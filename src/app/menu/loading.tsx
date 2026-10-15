import { MenuGridSkeleton } from "@/components/ui/states";

export default function MenuLoading() {
  return (
    <div className="shell py-12 md:py-16">
      <div className="h-4 w-24 animate-pulse rounded bg-cream-deep" aria-hidden />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-cream-deep" aria-hidden />
      <p className="sr-only">Loading the menu…</p>
      <div className="mt-10">
        <MenuGridSkeleton count={6} />
      </div>
    </div>
  );
}
