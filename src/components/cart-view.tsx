"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { MinusIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { EmptyState, MenuGridSkeleton } from "@/components/ui/states";
import { formatNaira } from "@/lib/currency";
import { DELIVERY_FEES } from "@/lib/delivery";

export function CartView() {
  const { items, count, subtotal, isHydrated, setQuantity, removeItem, clear } = useCart();

  if (!isHydrated) {
    return <MenuGridSkeleton count={2} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add a dish from the menu and it will appear here, ready for checkout."
        action={
          <ButtonLink href="/menu" size="lg">
            Browse the menu
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start">
      <ul className="space-y-4">
        {items.map(({ item, quantity, lineTotal }) => (
          <li
            key={item.id}
            className="flex gap-4 rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-cream-deep sm:size-24">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black leading-snug">{item.name}</h2>
                  <p className="mt-0.5 text-sm text-muted">{formatNaira(item.price)} each</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand/10 hover:text-brand"
                  aria-label={`Remove ${item.name} from your order`}
                >
                  <TrashIcon width={18} height={18} />
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center gap-1 rounded-xl border border-line p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity - 1)}
                    className="flex size-8 items-center justify-center rounded-lg hover:bg-cream"
                    aria-label={`Reduce quantity of ${item.name}`}
                  >
                    <MinusIcon width={16} height={16} />
                  </button>
                  <span
                    className="min-w-6 text-center text-sm font-black"
                    aria-label={`Quantity: ${quantity}`}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity + 1)}
                    className="flex size-8 items-center justify-center rounded-lg hover:bg-cream"
                    aria-label={`Increase quantity of ${item.name}`}
                  >
                    <PlusIcon width={16} height={16} />
                  </button>
                </div>
                <span className="font-black">{formatNaira(lineTotal)}</span>
              </div>
            </div>
          </li>
        ))}

        <li className="flex justify-end pt-1">
          <Button variant="ghost" onClick={clear} className="text-muted hover:text-brand">
            <TrashIcon width={16} height={16} />
            Clear cart
          </Button>
        </li>
      </ul>

      <aside className="rounded-3xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
        <h2 className="text-lg font-black">Order summary</h2>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{`Subtotal (${count} ${count === 1 ? "item" : "items"})`}</dt>
            <dd className="font-semibold">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold">
              {formatNaira(DELIVERY_FEES.rivers)} – {formatNaira(DELIVERY_FEES.outside)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-muted">
          Delivery is <strong>₦1,000 within Rivers State</strong> and{" "}
          <strong>₦5,000 outside Rivers State</strong>. The exact fee is confirmed at checkout
          once you enter your state.
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
          <span className="font-black">Food total</span>
          <span className="text-xl font-black">{formatNaira(subtotal)}</span>
        </div>

        <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">
          Proceed to checkout
        </ButtonLink>
        <Link
          href="/menu"
          className="mt-3 block text-center text-sm font-bold text-muted hover:text-brand"
        >
          Add more items
        </Link>
      </aside>
    </div>
  );
}
