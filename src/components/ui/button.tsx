import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "whatsapp";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-[0_10px_24px_-8px_rgba(230,57,47,0.55)]",
  secondary: "bg-white text-ink border border-line hover:border-ink/25 hover:bg-cream",
  dark: "bg-ink text-white hover:bg-ink-soft",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  whatsapp: "bg-green text-white hover:bg-green-dark shadow-[0_10px_24px_-8px_rgba(32,177,90,0.55)]",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function classes(variant: Variant, size: Size, className?: string) {
  return [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}

interface ExternalButtonProps extends ComponentProps<"a"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ExternalButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ExternalButtonProps) {
  return (
    <a className={classes(variant, size, className)} {...props}>
      {children}
    </a>
  );
}
