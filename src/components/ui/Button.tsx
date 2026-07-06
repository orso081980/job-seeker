import type { ButtonHTMLAttributes } from "react";

type PaddedVariant = "primary" | "ghost" | "ghostBrand" | "danger";
type TextVariant = "text";
type Variant = PaddedVariant | TextVariant;
type Size = "md" | "sm" | "xs";

const PADDED_VARIANTS: Record<PaddedVariant, string> = {
  primary:
    "rounded-lg bg-ink-900 text-white shadow-glow-sm hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-gray-100",
  ghost:
    "rounded-lg border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10",
  ghostBrand:
    "rounded-lg text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/20",
  danger:
    "rounded-lg border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/40 dark:bg-white/5 dark:text-red-400 dark:hover:bg-red-900/20",
};

const TEXT_VARIANTS: Record<TextVariant, string> = {
  text: "text-brand-700 hover:underline dark:text-brand-300",
};

const PADDING: Record<Size, string> = { md: "px-4 py-2", sm: "px-3 py-1.5", xs: "px-2.5 py-1" };
const FONT_SIZE: Record<Size, string> = { md: "text-sm", sm: "text-sm", xs: "text-xs" };

function isPadded(variant: Variant): variant is PaddedVariant {
  return variant === "primary" || variant === "ghost" || variant === "ghostBrand" || variant === "danger";
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const colorShape = isPadded(variant) ? PADDED_VARIANTS[variant] : TEXT_VARIANTS[variant];
  const sizing = isPadded(variant) ? `${PADDING[size]} ${FONT_SIZE[size]}` : FONT_SIZE[size];

  return (
    <button
      type="button"
      className={`font-medium transition-colors disabled:opacity-50 ${colorShape} ${sizing} ${className}`}
      {...props}
    />
  );
}
