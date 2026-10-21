import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

import { isClerkConfigured } from "@/lib/auth/config";

/**
 * Clerk session middleware.
 *
 * Next.js 16 renamed the `middleware` file convention to `proxy`, so this file
 * is `src/proxy.ts` rather than `src/middleware.ts`. The code is otherwise the
 * standard Clerk integration.
 *
 * This deliberately does NOT protect any route. Clerk's own guidance is to
 * enforce access as close to the data as possible, so the real checks live in
 * `requireAdmin()` and run inside every admin page and admin API route. A check
 * here would only add a second, weaker gate - and a redirect in middleware is
 * easy to mistake for actual protection.
 *
 * `clerkMiddleware()` still attaches the session to the request, which is what
 * makes `auth()` work in server components and route handlers.
 */
const withClerk = clerkMiddleware();

/**
 * When Clerk is unconfigured, `clerkMiddleware()` throws and would take the
 * whole site down - including the public menu and checkout, which need no
 * authentication at all. So the middleware is skipped in that case.
 *
 * This is not an authentication bypass: the admin guards independently refuse
 * every request with a 503 while Clerk is unconfigured, so nothing privileged
 * becomes reachable. The effect is "public site stays up, admin stays shut".
 */
export default function proxy(request: NextRequest, event: Parameters<typeof withClerk>[1]) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }
  return withClerk(request, event);
}

export const config = {
  /**
   * Next.js requires this array to be statically analysable, so it stays inline
   * rather than imported from a shared module.
   *
   * `/__clerk/(.*)` is not optional. Clerk's Frontend API proxy serves Clerk's
   * browser bundles from `/__clerk/npm/.../ *.js`, and the generic "skip static
   * files" pattern below excludes every `.js` path. Without this entry the proxy
   * never sees those requests, the bundle 404s, and the sign-in widget silently
   * fails to mount - the page renders its heading and nothing else.
   */
  matcher: [
    // Skip Next.js internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Always run for Clerk Frontend API proxy routes.
    "/__clerk/(.*)",
  ],
};
