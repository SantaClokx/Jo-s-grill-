import { MenuGridSkeleton } from "@/components/ui/states";

export default function CartLoading() {
  return (
    <div className="shell py-12 md:py-16">
      <div className="h-10 w-40 animate-pulse rounded bg-cream-deep" aria-hidden />
      <p className="sr-only">Loading your cart…</p>
      <div className="mt-8">
        <MenuGridSkeleton count={2} />
      </div>
    </div>
  );
}
