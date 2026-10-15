import { MenuGridSkeleton } from "@/components/ui/states";

export default function CheckoutLoading() {
  return (
    <div className="shell py-12 md:py-16">
      <div className="h-10 w-48 animate-pulse rounded bg-cream-deep" aria-hidden />
      <p className="sr-only">Loading checkout…</p>
      <div className="mt-8">
        <MenuGridSkeleton count={2} />
      </div>
    </div>
  );
}
