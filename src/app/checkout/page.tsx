import type { Metadata } from "next";

import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Enter your name, phone number and delivery details to complete your JO'S Grill order.",
};

export default function CheckoutPage() {
  return (
    <div className="shell py-12 md:py-16">
      <h1 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">Checkout</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Enter your delivery details. We calculate your delivery fee automatically — ₦1,000 within
        Rivers State and ₦5,000 outside Rivers State.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
