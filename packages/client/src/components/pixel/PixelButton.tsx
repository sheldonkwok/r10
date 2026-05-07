import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const pixelButtonVariants = cva(
  "inline-flex items-center justify-center font-pixel uppercase tracking-widest text-[9px] px-4 py-2 select-none disabled:cursor-not-allowed",
  {
    variants: {
      tone: {
        accent: "",
        success: "",
        danger: "",
        muted: "",
        red: "",
      },
      dim: {
        true: "cursor-not-allowed",
        false: "cursor-pointer",
      },
    },
    defaultVariants: {
      tone: "accent",
      dim: false,
    },
  },
);

const TONE_COLORS: Record<NonNullable<VariantProps<typeof pixelButtonVariants>["tone"]>, string> = {
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  danger: "var(--color-danger)",
  red: "var(--color-team-red)",
  muted: "var(--color-paper-muted)",
};

interface PixelButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pixelButtonVariants> {
  children: ReactNode;
}

export function PixelButton({
  children,
  tone = "accent",
  dim,
  className,
  style,
  disabled,
  ...rest
}: PixelButtonProps) {
  const isDim = dim || disabled;
  const tint = TONE_COLORS[tone ?? "accent"];

  const inlineStyle: CSSProperties = isDim
    ? {
        background: "var(--color-panel)",
        color: "var(--color-paper-muted)",
        boxShadow: "inset 0 0 0 2px var(--color-paper-muted), 2px 2px 0 0 #000",
      }
    : {
        background: tint,
        color: "#0a0a0a",
        boxShadow:
          "inset 0 0 0 2px #000, inset 2px 2px 0 0 rgba(255,248,230,0.55), inset -2px -2px 0 0 rgba(0,0,0,0.4), 2px 2px 0 0 #000",
      };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(pixelButtonVariants({ tone, dim: isDim }), className)}
      style={{ ...inlineStyle, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
