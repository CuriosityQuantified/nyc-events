import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const conversationId = "3b7bfe13-7fd8-4a4e-83b8-d315163d699c";

function stream(...events: Array<[string, unknown]>) {
  return events
    .map(
      ([event, data]) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
    )
    .join("");
}

test.describe("Concierge tab", () => {
  test("navigates, chats, and saves only after approval", async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    let messageCount = 0;
    let approvedWrites = 0;
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/api/events?*", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 12, total: 0, totalPages: 0 },
      }),
    );
    await page.route("**/api/freshness", (route) =>
      route.fulfill({
        json: {
          lastSuccessfulSync: "2026-08-16T12:00:00Z",
          snapshotRowCount: 0,
          isStale: false,
        },
      }),
    );
    await page.route("**/api/profile/saved**", (route) =>
      route.fulfill({
        json: { events: [], page: 1, pageSize: 100, total: approvedWrites },
      }),
    );
    await page.route("**/api/concierge/messages/stream", async (route) => {
      messageCount += 1;
      const body = route.request().postDataJSON() as {
        message: string;
        conversationId: string | null;
      };
      if (messageCount === 1) {
        expect(body.conversationId).toBeNull();
        return route.fulfill({
          contentType: "text/event-stream",
          body: stream(
            ["conversation", { conversation_id: conversationId }],
            ["token", { text: "I found a current free " }],
            ["token", { text: "family event in Queens." }],
            [
              "done",
              {
                conversation_id: conversationId,
                status: "completed",
                response: "I found a current free family event in Queens.",
                approval: null,
              },
            ],
          ),
        });
      }
      expect(body.conversationId).toBe(conversationId);
      return route.fulfill({
        contentType: "text/event-stream",
        body: stream(
          ["token", { text: "I can save that event for you." }],
          [
            "done",
            {
              conversation_id: conversationId,
              status: "approval_required",
              response: "I can save that event for you.",
              approval: {
                interrupt_id: "interrupt-1",
                action_requests: [
                  {
                    name: "save_event",
                    args: { event_id: "queens-family-event" },
                    description: "Save this exact event to your Saved Events.",
                  },
                ],
              },
            },
          ],
        ),
      });
    });
    await page.route(
      "**/api/concierge/conversations/*/decision/stream",
      async (route) => {
        const body = route.request().postDataJSON() as {
          interruptId: string;
          decision: string;
        };
        expect(body).toEqual({
          interruptId: "interrupt-1",
          decision: "approve",
        });
        expect(approvedWrites).toBe(0);
        approvedWrites += 1;
        await route.fulfill({
          contentType: "text/event-stream",
          body: stream(
            ["token", { text: "The event " }],
            ["token", { text: "is saved." }],
            [
              "done",
              {
                conversation_id: conversationId,
                status: "completed",
                response: "The event is saved.",
                approval: null,
              },
            ],
          ),
        });
      },
    );

    await page.goto("/");
    const navigation =
      testInfo.project.name === "mobile"
        ? page.getByTestId("bottom-nav")
        : page.getByTestId("desktop-sidebar");
    await navigation.getByRole("button", { name: /Concierge/ }).click();
    await expect(page).toHaveURL(/\/concierge$/);
    await expect(
      page.getByRole("heading", { name: "Event Concierge" }),
    ).toBeVisible();

    const input = page.getByLabel("Ask about current events");
    await input.fill("Free family events in Queens");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(
      page.getByText("I found a current free family event in Queens."),
    ).toBeVisible();

    await input.fill("Save that event");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByTestId("save-approval")).toBeVisible();
    expect(approvedWrites).toBe(0);
    await page.getByRole("button", { name: "Approve save" }).click();
    await expect(page.getByText("The event is saved.")).toBeVisible();
    expect(approvedWrites).toBe(1);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
});
