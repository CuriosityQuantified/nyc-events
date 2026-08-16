import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getFilteredEvents } = vi.hoisted(() => ({
  getFilteredEvents: vi.fn(),
}));
vi.mock("@/app/data/events", () => ({ getFilteredEvents }));

import { GET } from "./route";

const emptyPage = {
  events: [],
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};

beforeEach(() => {
  getFilteredEvents.mockReset();
  getFilteredEvents.mockResolvedValue(emptyPage);
});

describe("filtered events route", () => {
  it("passes canonical combined filters to the bounded event query", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/events?page=2&borough=Queens&category=Nature&date=weekend&registration=required",
      ),
    );

    expect(response.status).toBe(200);
    expect(getFilteredEvents).toHaveBeenCalledWith(
      {
        borough: "Queens",
        category: "Nature",
        date: "weekend",
        registration: "required",
      },
      2,
      12,
    );
  });

  it("fails closed on repeated, unsupported, or malformed filter state", async () => {
    for (const query of [
      "borough=Queens&borough=Bronx",
      "category=%3Cscript%3E",
      "date=next-century",
      "registration=maybe",
    ]) {
      const response = await GET(
        new NextRequest(`http://localhost/api/events?page=1&${query}`),
      );
      expect(response.status).toBe(400);
    }
    expect(getFilteredEvents).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination before querying data", async () => {
    for (const query of [
      "page=0",
      "page=1&page_size=0",
      "page=1&page_size=101",
    ]) {
      const response = await GET(
        new NextRequest(`http://localhost/api/events?${query}&borough=Queens`),
      );
      expect(response.status).toBe(400);
    }
    expect(getFilteredEvents).not.toHaveBeenCalled();
  });

  it("allows the bounded map page size", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/events?page=1&page_size=100"),
    );
    expect(response.status).toBe(200);
    expect(getFilteredEvents).toHaveBeenCalledWith(
      { borough: null, category: null, date: null, registration: null },
      1,
      100,
    );
  });

  it("returns a closed service error when the bounded filter query fails", async () => {
    getFilteredEvents.mockRejectedValueOnce(new Error("backend unavailable"));
    const response = await GET(
      new NextRequest("http://localhost/api/events?page=1&borough=Queens"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Events are unavailable",
    });
  });
});
