import * as cartLib from "@/lib/cart";
import { safeParseJson, sanitiseCartLines } from "@/lib/sanitise";
import type { CartLine } from "@/types";

const STORAGE_KEY = "jos-grill:cart:v1";
const EMPTY: CartLine[] = [];

type Listener = () => void;

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage may be full or blocked (private mode). Keep in-memory state.
  }
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    lines = sanitiseCartLines(safeParseJson<unknown>(window.localStorage.getItem(STORAGE_KEY), []));
  } catch {
    lines = EMPTY;
  }
}

function mutate(next: CartLine[]): void {
  if (typeof window === "undefined") return;
  load();
  lines = next;
  persist();
  emit();
}

/**
 * Cart backed by localStorage and consumed via `useSyncExternalStore`.
 * This keeps server and client markup identical on first paint while still
 * restoring the customer's saved cart after hydration.
 */
export const cartStore = {
  subscribe(listener: Listener): () => void {
    load();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): CartLine[] {
    load();
    return lines;
  },
  getServerSnapshot(): CartLine[] {
    return EMPTY;
  },
  add(itemId: string, quantity = 1): void {
    load();
    mutate(cartLib.addLine(lines, itemId, quantity));
  },
  setQuantity(itemId: string, quantity: number): void {
    load();
    mutate(cartLib.setQuantity(lines, itemId, quantity));
  },
  remove(itemId: string): void {
    load();
    mutate(cartLib.removeLine(lines, itemId));
  },
  clear(): void {
    mutate(EMPTY);
  },
};

/** Stable helpers so `useSyncExternalStore` sees consistent function identities. */
export const noopSubscribe = (): (() => void) => () => {};
export const clientSnapshotTrue = (): boolean => true;
export const serverSnapshotFalse = (): boolean => false;
