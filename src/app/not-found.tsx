import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">404</p>
      <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you
        back to the food.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">
          Back to home
        </ButtonLink>
        <ButtonLink href="/menu" variant="secondary" size="lg">
          Browse the menu
        </ButtonLink>
      </div>
    </div>
  );
}
