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
