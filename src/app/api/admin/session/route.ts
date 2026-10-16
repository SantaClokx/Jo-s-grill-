import { NextResponse } from "next/server";

import { guardFailureResponse, requireAdmin } from "@/lib/auth/guard";

/**
 * Protected admin API endpoint.
 *
 * Exists so the server-side administrator guard can be exercised end to end.
 * It returns only the caller's own identity - no customer data - but it is a
 * real guard: every unauthenticated or non-admin request is refused here, on
 * the server, regardless of what the browser does.
 *
 * Route handlers always run at request time, so no cache configuration is
 * needed - and `dynamic` is not allowed here because `cacheComponents` is on.
 */
export async function GET() {
  const result = await requireAdmin();

  if (!result.ok) return guardFailureResponse(result);

  return NextResponse.json({
    ok: true,
    userId: result.userId,
    role: "admin",
  });
}
