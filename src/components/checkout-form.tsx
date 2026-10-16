"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { useCart } from "@/components/cart-provider";
import { Button, ButtonLink, ExternalButton } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { EmptyState, MenuGridSkeleton, SuccessState } from "@/components/ui/states";
import { formatNaira } from "@/lib/currency";
import { calculatePricing, NIGERIAN_STATES } from "@/lib/delivery";
import { site, whatsappLink } from "@/lib/site";
import { hasErrors, validateCheckout, type ValidationErrors } from "@/lib/validation";
import type { DeliveryDetails, Order } from "@/types";

interface OrderResponse {
  order: Order;
  persisted: boolean;
  deliveredToRestaurant: boolean;
  message: string;
}

const EMPTY_CUSTOMER: DeliveryDetails = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  notes: "",
};

/**
 * A random key identifying one checkout attempt. The server stores it and treats
 * a repeat as the same order, so a double-submit does not create two orders.
 * Crypto is used when available; the fallback is still sufficient to avoid an
 * accidental collision.
 */
function createIdempotencyKey(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function CheckoutForm() {
  const { items, count, subtotal, isHydrated, clear } = useCart();
  const [customer, setCustomer] = useState<DeliveryDetails>(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderResponse | null>(null);

  /**
   * A stable key for one checkout attempt. It is created once and reused on
   * retry so a double-submit (or an impatient second tap) cannot create two
   * orders. Cleared only when a new order is started.
   */
  const idempotencyKey = useRef<string>(createIdempotencyKey());

  const pricing = useMemo(
    () => calculatePricing(subtotal, customer.state || "Rivers"),
    [subtotal, customer.state],
  );

  if (!isHydrated) {
    return <MenuGridSkeleton count={2} />;
  }

  if (result) {
    return (
      <OrderConfirmation
        result={result}
        onStartNew={() => {
          clear();
          idempotencyKey.current = createIdempotencyKey();
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out yet"
        description="Your cart is empty. Add a dish from the menu, then come back to complete your order."
        action={
          <ButtonLink href="/menu" size="lg">
            Browse the menu
          </ButtonLink>
        }
      />
    );
  }

  const update = (field: keyof DeliveryDetails, value: string) => {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const nextErrors = validateCheckout(customer, items.map((line) => ({
      itemId: line.item.id,
      quantity: line.quantity,
    })));
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          lines: items.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
          idempotencyKey: idempotencyKey.current,
        }),
      });

      const payload = (await response.json()) as OrderResponse | { error: string; errors?: ValidationErrors };

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "We could not process your order. Please try again.";
        if ("errors" in payload && payload.errors) setErrors(payload.errors);
        setSubmitError(message);
        return;
      }

      setResult(payload as OrderResponse);
    } catch {
      setSubmitError(
        "Network problem — we could not reach the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRivers = pricing.zone === "rivers";

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
      <div className="space-y-8">
        <fieldset className="rounded-3xl border border-line bg-white p-6 shadow-card">
          <legend className="px-1 text-lg font-black">Delivery details</legend>
          <p className="mb-5 mt-1 text-sm text-muted">
            We use these details to deliver your order and to confirm it with you.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              htmlFor="fullName"
              error={errors.fullName}
              className="sm:col-span-2"
            >
              <input
                id="fullName"
                name="fullName"
                autoComplete="name"
                value={customer.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
                className={inputClass(errors.fullName)}
                placeholder="e.g. Chinedu Okafor"
              />
            </Field>

            <Field label="Phone number" htmlFor="phone" error={errors.phone}>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={customer.phone}
                onChange={(event) => update("phone", event.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={inputClass(errors.phone)}
                placeholder="0803 123 4567"
              />
            </Field>

            <Field label="City / town" htmlFor="city" error={errors.city}>
              <input
                id="city"
                name="city"
                autoComplete="address-level2"
                value={customer.city}
                onChange={(event) => update("city", event.target.value)}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? "city-error" : undefined}
                className={inputClass(errors.city)}
                placeholder="e.g. Elelenwo"
              />
            </Field>

            <Field
              label="Delivery address"
              htmlFor="address"
              error={errors.address}
              className="sm:col-span-2"
            >
              <textarea
                id="address"
                name="address"
                autoComplete="street-address"
                rows={3}
                value={customer.address}
                onChange={(event) => update("address", event.target.value)}
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "address-error" : undefined}
                className={inputClass(errors.address)}
                placeholder="House number, street, landmark"
              />
            </Field>

            <Field
              label="State"
              htmlFor="state"
              error={errors.state}
              className="sm:col-span-2"
            >
              <select
                id="state"
                name="state"
                value={customer.state}
                onChange={(event) => update("state", event.target.value)}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={errors.state ? "state-error" : undefined}
                className={inputClass(errors.state)}
              >
                <option value="">Select your state</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Delivery notes (optional)"
              htmlFor="notes"
              className="sm:col-span-2"
            >
              <textarea
                id="notes"
                name="notes"
                rows={2}
                value={customer.notes}
                onChange={(event) => update("notes", event.target.value)}
                className={inputClass(undefined)}
                placeholder="Gate colour, landmark, preferred time…"
              />
            </Field>
          </div>
        </fieldset>

        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            isRivers ? "border-green/30 bg-green/5 text-green-dark" : "border-orange/40 bg-orange/10 text-ink"
          }`}
        >
          {customer.state ? (
            isRivers ? (
              <>
                Delivering within <strong>Rivers State</strong> — delivery fee{" "}
                <strong>{formatNaira(pricing.deliveryFee)}</strong>.
              </>
            ) : (
              <>
                Delivering outside Rivers State ({customer.state}) — delivery fee{" "}
                <strong>{formatNaira(pricing.deliveryFee)}</strong>.
              </>
            )
          ) : (
            <>Select your state to see your exact delivery fee.</>
          )}
        </div>
      </div>

      <aside className="rounded-3xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-24">
        <h2 className="text-lg font-black">Order summary</h2>

        <ul className="mt-5 space-y-3 text-sm">
          {items.map(({ item, quantity, lineTotal }) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="text-ink-soft">
                {item.name}
                <span className="text-muted"> × {quantity}</span>
              </span>
              <span className="font-semibold">{formatNaira(lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{`Subtotal (${count} ${count === 1 ? "item" : "items"})`}</dt>
            <dd className="font-semibold">{formatNaira(pricing.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">
              Delivery {customer.state ? `(${isRivers ? "Rivers State" : "outside Rivers"})` : ""}
            </dt>
            <dd className="font-semibold">
              {customer.state ? formatNaira(pricing.deliveryFee) : "Select your state"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
          <span className="font-black">Total</span>
          <span className="text-2xl font-black">
            {formatNaira(customer.state ? pricing.total : pricing.subtotal)}
          </span>
        </div>
        {!customer.state && (
          <p className="mt-2 text-xs text-muted">
            Food total only — your delivery fee is added once you choose a state.
          </p>
        )}

        {submitError && (
          <p role="alert" className="mt-4 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand">
            {submitError}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Placing order…" : "Place order"}
        </Button>

        <p className="mt-3 text-center text-xs leading-relaxed text-muted">
          After placing your order you&apos;ll confirm it with the restaurant on WhatsApp.
        </p>

        <Link
          href="/cart"
          className="mt-3 block text-center text-sm font-bold text-muted hover:text-brand"
        >
          Back to cart
        </Link>
      </aside>
    </form>
  );
}

function OrderConfirmation({
  result,
  onStartNew,
}: {
  result: OrderResponse;
  onStartNew: () => void;
}) {
  const { order, persisted, message } = result;

  const whatsappMessage = buildWhatsAppMessage(order);

  return (
    <div className="mx-auto max-w-2xl">
      <SuccessState
        title={`Order ${order.reference} received`}
        description={
          persisted
            ? "Your order has been recorded and your total is confirmed. Send it to the restaurant on WhatsApp so they can start cooking."
            : "We've validated your order and calculated your total. The final step is to send it to the restaurant on WhatsApp so they can start cooking."
        }
      >
        <div className="mx-auto max-w-md text-left">
          <dl className="space-y-2 rounded-2xl border border-line bg-white p-5 text-sm">
            <Row label="Customer" value={order.customer.fullName} />
            <Row label="Phone" value={order.customer.phone} />
            <Row
              label="Deliver to"
              value={`${order.customer.address}, ${order.customer.city}, ${order.customer.state}`}
            />
            <Row label="Subtotal" value={formatNaira(order.pricing.subtotal)} />
            <Row
              label="Delivery"
              value={`${formatNaira(order.pricing.deliveryFee)} (${
                order.pricing.zone === "rivers" ? "Rivers State" : "outside Rivers State"
              })`}
            />
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="font-black">Total</dt>
              <dd className="font-black">{formatNaira(order.pricing.total)}</dd>
            </div>
          </dl>

          <ExternalButton
            href={whatsappLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            variant="whatsapp"
            size="lg"
            className="mt-5 w-full"
          >
            <WhatsAppIcon />
            Send order on WhatsApp
          </ExternalButton>

          {!persisted && (
            <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-ink-soft">
              <strong>Please note:</strong> {message}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/menu" variant="dark" className="flex-1">
              Order something else
            </ButtonLink>
            <ButtonLink href="/" variant="secondary" className="flex-1" onClick={onStartNew}>
              Back to home
            </ButtonLink>
          </div>

          <p className="mt-5 text-center text-xs text-muted">
            Need help? Call{" "}
            <a href={site.phoneHref} className="font-bold text-ink hover:text-brand">
              {site.phoneDisplay}
            </a>
          </p>
        </div>
      </SuccessState>
    </div>
  );
}

function buildWhatsAppMessage(order: Order): string {
  const lines = order.lines
    .map((line) => `• ${line.name} × ${line.quantity} — ${formatNaira(line.unitPrice * line.quantity)}`)
    .join("\n");

  return [
    "Hello JO'S Grill 👋",
    "",
    `I'd like to place order ${order.reference}.`,
    "",
    "CUSTOMER",
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
    `Address: ${order.customer.address}, ${order.customer.city}, ${order.customer.state}`,
    order.customer.notes ? `Notes: ${order.customer.notes}` : "",
    "",
    "ORDER",
    lines,
    "",
    `Subtotal: ${formatNaira(order.pricing.subtotal)}`,
    `Delivery: ${formatNaira(order.pricing.deliveryFee)} (${
      order.pricing.zone === "rivers" ? "Rivers State" : "outside Rivers State"
    })`,
    `Total: ${formatNaira(order.pricing.total)}`,
    "",
    "Please confirm my order. Thank you!",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-brand">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(error?: string): string {
  return [
    "w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand",
    error ? "border-brand" : "border-line",
  ].join(" ");
}
