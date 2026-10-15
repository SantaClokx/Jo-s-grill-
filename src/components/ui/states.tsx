import type { ReactNode } from "react";

import { AlertIcon, CartIcon, CheckIcon } from "@/components/ui/icons";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </p>
      )}
      <h2 className="text-balance text-3xl font-black tracking-[-0.03em] sm:text-4xl md:text-[2.6rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/70 px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-cream-deep text-ink/70">
        {icon ?? <CartIcon width={26} height={26} />}
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border border-brand/25 bg-brand/5 px-6 py-12 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <AlertIcon width={26} height={26} />
      </div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SuccessState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-green/25 bg-green/5 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-green/15 text-green-dark">
        <CheckIcon width={28} height={28} />
      </div>
      <h3 className="text-xl font-black">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/** Skeleton used while the menu catalogue is loading. */
export function MenuGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-line bg-white shadow-card"
        >
          <div className="aspect-[4/3] animate-pulse bg-cream-deep" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-cream-deep" />
            <div className="h-3 w-full animate-pulse rounded bg-cream-deep" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-cream-deep" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 animate-pulse rounded bg-cream-deep" />
              <div className="h-9 w-20 animate-pulse rounded-xl bg-cream-deep" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
