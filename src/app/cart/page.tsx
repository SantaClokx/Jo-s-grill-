import type { Metadata } from "next";

import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the dishes in your JO'S Grill order before checkout.",
};

export default function CartPage() {
  return (
    <div className="shell py-12 md:py-16">
      <h1 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">Your order</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Review your items and quantities. Delivery is calculated at checkout based on your state.
      </p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
