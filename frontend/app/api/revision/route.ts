import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const revision =
    process.env.DEPLOY_REVISION ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    "unknown";

  return NextResponse.json(
    { revision },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Deployment-Revision": revision,
      },
    },
  );
}
