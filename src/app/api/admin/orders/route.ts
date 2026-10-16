import { NextResponse } from "next/server";

import { guardFailureResponse, requireAdmin } from "@/lib/auth/guard";
import { isDatabaseConfigured } from "@/lib/db/config";
import { countOrders, listOrders, recordAudit, transitionOrderStatus } from "@/lib/db/orders";
import { describeTransitionError, isOrderStatus } from "@/lib/orders/status";
import type { OrderStatus } from "@/types";

/**
 * Admin order API.
 *
 * Every method starts with `requireAdmin()`, which verifies the Clerk session
 * and the administrator role **on the server**. Nothing here trusts the browser:
 * the caller's identity is never read from the query string or body, and the
 * only fields honoured are the order reference and the target status. A request
 * cannot promote itself, change an amount, or act on another account.
 *
 * Reads and status changes are written to the audit log with the verified actor
 * id. Customer personal data is returned to administrators only.
 */

const MAX_LIMIT = 200;

function readPagination(url: URL): { limit: number; offset: number } {
  const limitRaw = Number(url.searchParams.get("limit"));
  const offsetRaw = Number(url.searchParams.get("offset"));

  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), MAX_LIMIT) : 50;
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

  return { limit, offset };
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guardFailureResponse(guard);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Order storage is not configured on this server." },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const { limit, offset } = readPagination(url);

  // An unrecognised status filter is ignored rather than guessing, so a typo
  // returns the full list instead of a confusing empty page.
  const statusParam = url.searchParams.get("status");
  const status: OrderStatus | undefined =
    statusParam && isOrderStatus(statusParam) ? statusParam : undefined;

  try {
    const [ordersList, total] = await Promise.all([
      listOrders({ limit, offset, status }),
      countOrders(status),
    ]);

    // Reading customer records is an auditable action. The log records the
    // query shape and the count, never the customer data itself.
    await recordAudit({
      actorUserId: guard.userId,
      action: "list",
      entity: "order",
      entityId: null,
      details: { status: status ?? "all", limit, offset, returned: ordersList.length },
    });

    return NextResponse.json({ orders: ordersList, total, limit, offset });
  } catch {
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guardFailureResponse(guard);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Order storage is not configured on this server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Only two fields are read. Anything else in the body - a user id, a role, a
  // price - is ignored, which is what prevents mass assignment.
  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const reference = typeof record.reference === "string" ? record.reference.trim() : "";
  const status = typeof record.status === "string" ? record.status.trim() : "";

  if (reference === "" || !isOrderStatus(status)) {
    return NextResponse.json(
      { error: "Provide a valid order reference and status." },
      { status: 400 },
    );
  }

  try {
    const result = await transitionOrderStatus(reference, status);

    if (result.outcome === "not_found") {
      return NextResponse.json({ error: "No order with that reference." }, { status: 404 });
    }

    if (result.outcome === "invalid_transition") {
      return NextResponse.json(
        { error: describeTransitionError(result.from, status) },
        { status: 409 },
      );
    }

    if (result.outcome === "conflict") {
      return NextResponse.json(
        { error: "The order was changed by someone else. Reload and try again." },
        { status: 409 },
      );
    }

    await recordAudit({
      actorUserId: guard.userId,
      action: "update_status",
      entity: "order",
      entityId: reference,
      details: { status },
    });

    return NextResponse.json({ order: result.order });
  } catch {
    // Any repository failure is a 500. A write that did not happen must never be
    // reported as success.
    return NextResponse.json({ error: "Could not update the order." }, { status: 500 });
  }
}
