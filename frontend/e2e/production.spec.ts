import { expect, test } from "@playwright/test";

const expectedRevision = process.env.EXPECTED_DEPLOY_REVISION;
const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!expectedRevision || !baseURL) {
  throw new Error(
    "Production verification requires its origin and expected revision",
  );
}

test("public origin serves the exact deployed revision", async ({
  request,
}) => {
  expect(baseURL).toMatch(/^https:\/\//);
  const response = await request.get("/api/revision");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-deployment-revision"]).toBe(expectedRevision);
  await expect(response.json()).resolves.toEqual({
    revision: expectedRevision,
  });
});
