import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { streamConciergeMessage, streamConciergeSaveResolution, routerPush } =
  vi.hoisted(() => ({
    streamConciergeMessage: vi.fn(),
    streamConciergeSaveResolution: vi.fn(),
    routerPush: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  usePathname: () => "/concierge",
}));
vi.mock("@/app/data/concierge", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/app/data/concierge")>();
  return {
    ...original,
    streamConciergeMessage,
    streamConciergeSaveResolution,
  };
});

import ConciergeView from "./ConciergeView";

const conversationId = "da351c36-9e4c-4356-ae1a-68e53cd3556d";

beforeEach(() => {
  streamConciergeMessage.mockReset();
  streamConciergeSaveResolution.mockReset();
  routerPush.mockReset();
});

afterEach(cleanup);

describe("ConciergeView", () => {
  it("sends a plain-language question and renders the answer", async () => {
    streamConciergeMessage.mockImplementation(
      async (_message, _conversationId, handlers) => {
        handlers.onConversation(conversationId);
        handlers.onTool?.({
          id: "search-1",
          name: "search_current_events",
          status: "started",
        });
        handlers.onToken("I found two ");
        handlers.onToken("current Queens events.");
        return {
          conversationId,
          status: "completed",
          response: "I found two current Queens events.",
          approval: null,
        };
      },
    );
    render(<ConciergeView />);

    fireEvent.change(screen.getByLabelText("Ask about current events"), {
      target: { value: "Free events in Queens" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("I found two current Queens events."),
    ).toBeTruthy();
    expect(screen.getByTestId("concierge-tool-call").textContent).toContain(
      "search_current_events",
    );
    expect(streamConciergeMessage).toHaveBeenCalledWith(
      "Free events in Queens",
      null,
      expect.objectContaining({
        onConversation: expect.any(Function),
        onToken: expect.any(Function),
      }),
    );
  });

  it("renders Concierge answers as Markdown", async () => {
    streamConciergeMessage.mockResolvedValue({
      conversationId,
      status: "completed",
      response: "## Weekend picks\n\n- **Free** family event",
      approval: null,
    });
    render(<ConciergeView />);

    fireEvent.change(screen.getByLabelText("Ask about current events"), {
      target: { value: "What is on this weekend?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByRole("heading", { name: "Weekend picks", level: 2 }),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("concierge-messages")).getByRole("listitem")
        .textContent,
    ).toContain("Free family event");
  });

  it("blocks the composer until a save proposal is approved", async () => {
    const approval = {
      interruptId: "interrupt-1",
      eventId: "event-guid-1",
      description: "Save this exact event to your Saved Events.",
    };
    streamConciergeMessage.mockImplementation(
      async (_message, _conversationId, handlers) => {
        handlers.onToken("I can save that event.");
        return {
          conversationId,
          status: "approval_required",
          response: "I can save that event.",
          approval,
        };
      },
    );
    streamConciergeSaveResolution.mockImplementation(
      async (_conversationId, _approval, _decision, handlers) => {
        handlers.onToken("The event ");
        handlers.onToken("is saved.");
        return {
          conversationId,
          status: "completed",
          response: "The event is saved.",
          approval: null,
        };
      },
    );
    render(<ConciergeView />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Free family events in Queens this weekend",
      }),
    );
    expect(await screen.findByTestId("save-approval")).toBeTruthy();
    expect(
      screen
        .getByLabelText("Ask about current events")
        .hasAttribute("disabled"),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Approve save" }));
    await waitFor(() =>
      expect(streamConciergeSaveResolution).toHaveBeenCalledWith(
        conversationId,
        approval,
        "approve",
        expect.objectContaining({ onToken: expect.any(Function) }),
      ),
    );
    expect(await screen.findByText("The event is saved.")).toBeTruthy();
    expect(screen.queryByTestId("save-approval")).toBeNull();
  });
});
