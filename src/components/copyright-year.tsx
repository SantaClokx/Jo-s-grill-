"use client";

import { useSyncExternalStore } from "react";

import { clientSnapshotTrue, noopSubscribe, serverSnapshotFalse } from "@/lib/cart-store";

/**
 * Renders the current year on the client only. Pages that include it stay
 * statically prerendered instead of bailing out to dynamic rendering, and the
 * server snapshot uses `fallback` so the markup matches on first paint.
 */
export function CopyrightYear({ fallback = 2026 }: { fallback?: number }) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    clientSnapshotTrue,
    serverSnapshotFalse,
  );

  return <>{isClient ? new Date().getFullYear() : fallback}</>;
}
