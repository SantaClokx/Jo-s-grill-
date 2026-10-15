"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import * as cart from "@/lib/cart";
import {
  cartStore,
  clientSnapshotTrue,
  noopSubscribe,
  serverSnapshotFalse,
} from "@/lib/cart-store";
import { MENU_ITEMS } from "@/lib/menu";
import type { CartLineView, MenuItem } from "@/types";

interface CartContextValue {
  items: CartLineView[];
  count: number;
  subtotal: number;
  /** True once the client has taken over, i.e. the saved cart is available. */
  isHydrated: boolean;
  addItem: (item: MenuItem, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
  getQuantity: (itemId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    clientSnapshotTrue,
    serverSnapshotFalse,
  );

  const addItem = useCallback((item: MenuItem, quantity = 1) => {
    cartStore.add(item.id, quantity);
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    cartStore.setQuantity(itemId, quantity);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    cartStore.remove(itemId);
  }, []);

  const clear = useCallback(() => cartStore.clear(), []);

  const value = useMemo<CartContextValue>(() => {
    const items = cart.viewCart(lines, MENU_ITEMS);
    return {
      items,
      count: cart.countItems(lines),
      subtotal: items.reduce((total, line) => total + line.lineTotal, 0),
      isHydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
      getQuantity: (itemId: string) =>
        lines.find((line) => line.itemId === itemId)?.quantity ?? 0,
    };
  }, [lines, isHydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
