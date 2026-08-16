import { NextResponse } from "next/server";
import type {
  ConciergeApproval,
  ConciergeResponse,
} from "@/app/data/concierge";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseUpstreamConciergeResponse(
  value: unknown,
): ConciergeResponse | null {
  const payload = record(value);
  if (!payload) return null;
  if (
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
    const parsedActions = Array.isArray(actions)
      ? actions.map((value) => {
          const action = record(value);
          const args = record(action?.args);
          return {
            action,
            eventId: args?.event_id,
            description: action?.description,
          };
        })
      : [];
    if (
      typeof rawApproval?.interrupt_id !== "string" ||
      rawApproval.interrupt_id.length < 1 ||
      rawApproval.interrupt_id.length > 255 ||
      parsedActions.length === 0 ||
      parsedActions.some(
        ({ action, eventId }) =>
          action?.name !== "save_event" ||
          typeof eventId !== "string" ||
          eventId.length < 1 ||
          eventId.length > 255,
      )
    ) {
      return null;
    }
    const events = parsedActions.map(({ eventId, description }) => ({
      eventId: eventId as string,
      description:
        typeof description === "string"
          ? description
          : "Save this event to your Saved Events.",
    }));
    approval = {
      interruptId: rawApproval.interrupt_id,
      eventId: events[0].eventId,
      description: events[0].description,
      events,
    };
  }

  return {
    conversationId: payload.conversation_id,
    status: payload.status,
    response: payload.response,
    approval,
  };
}

export async function upstreamError(upstream: Response): Promise<NextResponse> {
  let detail: unknown = null;
  try {
    detail = ((await upstream.json()) as { detail?: unknown }).detail;
  } catch {
    // The public response stays generic when the backend body is malformed.
  }
  const status = [409, 422, 503].includes(upstream.status)
    ? upstream.status
    : 503;
  const fallback =
    status === 409
      ? "That approval is no longer pending."
      : status === 422
        ? "The concierge request was rejected."
        : "The concierge is unavailable right now.";
  return NextResponse.json(
    { error: typeof detail === "string" ? detail : fallback },
    { status },
  );
}
