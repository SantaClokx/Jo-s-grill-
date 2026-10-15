"use client";

import Image from "next/image";

import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { CheckIcon, MinusIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
import { formatNaira } from "@/lib/currency";
import type { MenuItem } from "@/types";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem, getQuantity, setQuantity, isHydrated } = useCart();
  const { showToast } = useToast();
  const quantity = isHydrated ? getQuantity(item.id) : 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-card transition-shadow hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
        {item.tags?.includes("Popular") && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cream backdrop-blur">
            <StarIcon width={12} height={12} className="text-orange" />
            Popular
          </span>
        )}
        {!item.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/70 backdrop-blur-[1px]">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-ink">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-black leading-snug tracking-[-0.01em]">{item.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-lg font-black">{formatNaira(item.price)}</span>

          {!item.available ? (
            <Button variant="secondary" disabled aria-label={`${item.name} is unavailable`}>
              Unavailable
            </Button>
          ) : quantity === 0 ? (
            <Button
              onClick={() => {
                addItem(item);
                showToast(`${item.name} added to your order`);
              }}
              aria-label={`Add ${item.name} to your order`}
            >
              <PlusIcon width={16} height={16} />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-xl border border-line p-1">
              <button
                type="button"
                onClick={() => setQuantity(item.id, quantity - 1)}
                className="flex size-8 items-center justify-center rounded-lg text-ink hover:bg-cream"
                aria-label={`Remove one ${item.name}`}
              >
                <MinusIcon width={16} height={16} />
              </button>
              <span
                className="min-w-6 text-center text-sm font-black"
                aria-label={`${quantity} in your order`}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(item.id, quantity + 1)}
                className="flex size-8 items-center justify-center rounded-lg text-ink hover:bg-cream"
                aria-label={`Add one more ${item.name}`}
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>
          )}
        </div>

        {quantity > 0 && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-green-dark">
            <CheckIcon width={14} height={14} />
            {quantity} in your order
          </p>
        )}
      </div>
    </article>
  );
}
