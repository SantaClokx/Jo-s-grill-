"use client";

import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="shell py-20">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error interrupted this page. You can try again, or head back to the menu."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => retry()} size="lg">
              Try again
            </Button>
            <ButtonLink href="/menu" variant="secondary" size="lg">
              Browse the menu
            </ButtonLink>
          </div>
        }
      />
    </div>
  );
}
