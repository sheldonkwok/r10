import type { CSSProperties, ReactNode } from "react";

interface PixelPanelProps {
  children: ReactNode;
  width?: number | string;
  height?: number | string;
  accent?: string;
  glow?: string | null;
  className?: string;
  style?: CSSProperties;
}

const PX = 3;

export function PixelPanel({ children, width, height, accent, glow, className, style }: PixelPanelProps) {
  const borderColor = accent ?? "var(--color-panel-border)";
  const boxShadow = [
    `inset 0 0 0 ${PX}px ${borderColor}`,
    `inset ${PX * 2}px ${PX * 2}px 0 0 color-mix(in srgb, var(--color-panel-highlight) 20%, transparent)`,
    `inset -${PX * 2}px -${PX * 2}px 0 0 rgba(0,0,0,0.27)`,
    `${PX}px ${PX}px 0 0 rgba(0,0,0,0.67)`,
    glow ? `0 0 ${PX * 8}px ${glow}` : "",
  ]
    .filter(Boolean)
    .join(",");

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        background: "var(--color-panel)",
        boxShadow,
        padding: 12,
        color: "var(--color-paper)",
        ...style,
      }}
    >
      <span style={cornerStyle(0, 0, borderColor)} />
      <span style={cornerStyle(0, "auto", borderColor, 0)} />
      <span style={cornerStyle("auto", 0, borderColor, undefined, 0)} />
      <span style={cornerStyle("auto", "auto", borderColor, 0, 0)} />
      {children}
    </div>
  );
}

function cornerStyle(
  top: number | string,
  left: number | string,
  color: string,
  right?: number,
  bottom?: number,
): CSSProperties {
  return {
    position: "absolute",
    top: top === "auto" ? undefined : top,
    bottom: top === "auto" ? (bottom ?? 0) : undefined,
    left: left === "auto" ? undefined : left,
    right: left === "auto" ? (right ?? 0) : undefined,
    width: PX,
    height: PX,
    background: color,
    pointerEvents: "none",
  };
}
