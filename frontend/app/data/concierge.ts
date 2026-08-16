import { getDeviceToken } from "@/app/data/device-token";

export type ConciergeApproval = {
  interruptId: string;
  eventId: string;
  description: string;
};

export type ConciergeResponse = {
  conversationId: string;
  status: "completed" | "approval_required";
  response: string | null;
  approval: ConciergeApproval | null;
};

export type ConciergeToolCall = {
  id: string;
  name: string;
  status: "started" | "completed" | "error";
};

export class ConciergeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export type ConciergeStreamHandlers = {
  onConversation?: (conversationId: string) => void;
  onToken?: (text: string) => void;
  onTool?: (tool: ConciergeToolCall) => void;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseDone(value: unknown): ConciergeResponse | null {
  const payload = record(value);
  if (
    !payload ||
    typeof payload.conversation_id !== "string" ||
    !UUID_PATTERN.test(payload.conversation_id) ||
    (payload.status !== "completed" &&
      payload.status !== "approval_required") ||
    (payload.response !== null && typeof payload.response !== "string")
  ) {
    return null;
  }

  let approval: ConciergeApproval | null = null;
  if (payload.status === "approval_required") {
    const rawApproval = record(payload.approval);
    const actions = rawApproval?.action_requests;
    const action = Array.isArray(actions) ? record(actions[0]) : null;
    const args = record(action?.args);
    if (
      typeof rawApproval?.interrupt_id !== "string" ||
      rawApproval.interrupt_id.length < 1 ||
      rawApproval.interrupt_id.length > 255 ||
      action?.name !== "save_event" ||
      typeof args?.event_id !== "string" ||
      args.event_id.length < 1 ||
      args.event_id.length > 255
    ) {
      return null;
    }
    approval = {
      interruptId: rawApproval.interrupt_id,
      eventId: args.event_id,
      description:
        typeof action.description === "string"
          ? action.description
          : "Save this event to your Saved Events.",
    };
  }

  return {
    conversationId: payload.conversation_id,
    status: payload.status,
    response: payload.response,
    approval,
  };
}

function parseEvent(block: string): { event: string; data: unknown } | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  if (data.length === 0) return null;
  try {
    return { event, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

async function conciergeStream(
  url: string,
  body: Record<string, unknown>,
  handlers: ConciergeStreamHandlers,
): Promise<ConciergeResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      "X-Device-Token": getDeviceToken(),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    throw new ConciergeApiError(
      typeof payload?.error === "string"
        ? payload.error
        : "The concierge is unavailable right now.",
      response.status,
    );
  }
  if (!response.body) {
    throw new ConciergeApiError(
      "The concierge returned an invalid response.",
      502,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed: ConciergeResponse | null = null;

  const consume = (block: string) => {
    const parsed = parseEvent(block);
    const payload = record(parsed?.data);
    if (!parsed || !payload) return;
    if (
      parsed.event === "conversation" &&
      typeof payload.conversation_id === "string" &&
      UUID_PATTERN.test(payload.conversation_id)
    ) {
      handlers.onConversation?.(payload.conversation_id);
      return;
    }
    if (parsed.event === "token" && typeof payload.text === "string") {
      handlers.onToken?.(payload.text);
      return;
    }
    if (
      parsed.event === "tool" &&
      typeof payload.id === "string" &&
      typeof payload.name === "string" &&
      (payload.status === "started" ||
        payload.status === "completed" ||
        payload.status === "error")
    ) {
      handlers.onTool?.({
        id: payload.id,
        name: payload.name,
        status: payload.status,
      });
      return;
    }
    if (parsed.event === "done") {
      completed = parseDone(payload);
      return;
    }
    if (parsed.event === "error") {
      throw new ConciergeApiError(
        typeof payload.error === "string"
          ? payload.error
          : "The concierge is unavailable right now.",
        503,
      );
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    blocks.forEach(consume);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
  if (!completed) {
    throw new ConciergeApiError(
      "The concierge returned an invalid response.",
      502,
    );
  }
  return completed;
}

export function streamConciergeMessage(
  message: string,
  conversationId: string | null,
  handlers: ConciergeStreamHandlers = {},
): Promise<ConciergeResponse> {
  return conciergeStream(
    "/api/concierge/messages/stream",
    {
      message,
      conversationId,
    },
    handlers,
  );
}

export function streamConciergeSaveResolution(
  conversationId: string,
  approval: ConciergeApproval,
  decision: "approve" | "reject",
  handlers: ConciergeStreamHandlers = {},
): Promise<ConciergeResponse> {
  return conciergeStream(
    `/api/concierge/conversations/${encodeURIComponent(conversationId)}/decision/stream`,
    {
      interruptId: approval.interruptId,
      decision,
    },
    handlers,
  );
}
