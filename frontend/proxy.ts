import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkConfiguration } from "@/app/data/clerk";

const withClerk = clerkMiddleware();

/** Keep public routes usable unless both optional Clerk keys are configured. */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (clerkConfiguration().status !== "configured") {
    return NextResponse.next();
  }
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
