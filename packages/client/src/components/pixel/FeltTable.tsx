interface FeltTableProps {
  width: number;
  height: number;
  inset?: number;
}

const PX = 4;

export function FeltTable({ width, height, inset = 40 }: FeltTableProps) {
  const frameInset = inset - 16;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: frameInset,
          top: frameInset,
          width: width - frameInset * 2,
          height: height - frameInset * 2,
          background: "var(--color-wood)",
          boxShadow: `inset 0 0 0 ${PX}px var(--color-wood-dark),
                      inset ${PX * 2}px ${PX * 2}px 0 0 var(--color-wood-light),
                      inset -${PX * 2}px -${PX * 2}px 0 0 var(--color-wood-dark)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: inset,
          top: inset,
          width: width - inset * 2,
          height: height - inset * 2,
          background:
            "radial-gradient(ellipse at 30% 20%, color-mix(in srgb, var(--color-felt-highlight) 20%, transparent) 0%, transparent 60%), var(--color-felt)",
          boxShadow: `inset 0 0 0 ${PX}px var(--color-felt-edge),
                      inset ${PX * 4}px ${PX * 4}px ${PX * 8}px 0 rgba(0,0,0,0.4)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: inset + PX,
          top: inset + PX,
          width: width - inset * 2 - PX * 2,
          height: height - inset * 2 - PX * 2,
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--color-felt-edge) 33%, transparent) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
