import { afterEach, describe, expect, it } from "vitest";
import { GET } from "./route";

const originalDeployRevision = process.env.DEPLOY_REVISION;
const originalRailwayRevision = process.env.RAILWAY_GIT_COMMIT_SHA;

afterEach(() => {
  if (originalDeployRevision === undefined) delete process.env.DEPLOY_REVISION;
  else process.env.DEPLOY_REVISION = originalDeployRevision;
  if (originalRailwayRevision === undefined)
    delete process.env.RAILWAY_GIT_COMMIT_SHA;
  else process.env.RAILWAY_GIT_COMMIT_SHA = originalRailwayRevision;
});

describe("deployment revision endpoint", () => {
  it("reports the exact release revision without allowing caches", async () => {
    process.env.DEPLOY_REVISION = "abc123";
    const response = await GET();

    expect(await response.json()).toEqual({ revision: "abc123" });
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-deployment-revision")).toBe("abc123");
  });

  it("uses Railway's Git revision when an explicit release revision is absent", async () => {
    delete process.env.DEPLOY_REVISION;
    process.env.RAILWAY_GIT_COMMIT_SHA = "railway-sha";

    expect(await (await GET()).json()).toEqual({ revision: "railway-sha" });
  });

  it("reports unknown instead of inventing a revision", async () => {
    delete process.env.DEPLOY_REVISION;
    delete process.env.RAILWAY_GIT_COMMIT_SHA;

    expect(await (await GET()).json()).toEqual({ revision: "unknown" });
  });
});
