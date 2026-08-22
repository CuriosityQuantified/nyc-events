import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const buildRoot = path.resolve(".next");
const prerender = JSON.parse(
  await readFile(path.join(buildRoot, "prerender-manifest.json"), "utf8"),
);
if (prerender.routes?.["/profile"]) {
  throw new Error("/profile must be request-rendered, not prerendered");
}

const fixtureMarkers = [
  "auth-client.fixture",
  "eventmatch-component-auth",
  "configured-auth component harness",
];
let runtimePublicKeyRead = false;

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(file);
      continue;
    }
    if (!/\.(?:html|js|json|rsc|txt)$/.test(entry.name)) continue;
    const content = await readFile(file, "utf8");
    for (const marker of fixtureMarkers) {
      if (content.includes(marker)) {
        throw new Error(
          `Production artifact contains fixture marker: ${marker}`,
        );
      }
    }
    if (/\["NEXT","PUBLIC","CLERK","PUBLISHABLE","KEY"\]/.test(content)) {
      runtimePublicKeyRead = true;
    }
  }
}

await inspect(buildRoot);
if (!runtimePublicKeyRead) {
  throw new Error(
    "Production server artifact lost the runtime Clerk public-key read",
  );
}

const dockerfile = await readFile("Dockerfile", "utf8");
if (/^ARG\s+.*CLERK/im.test(dockerfile)) {
  throw new Error("Dockerfile must not accept Clerk build arguments");
}

console.log(
  "auth artifact guard passed: dynamic Profile, runtime config, no fixture",
);
