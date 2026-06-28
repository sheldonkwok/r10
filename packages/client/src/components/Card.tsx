import { card } from "game";
import type { CSSProperties } from "react";

type SuitShort = "h" | "d" | "c" | "s";
type Glyph = "heart" | "diamond" | "club" | "spade";

const GLYPH_BY_SUIT: Record<SuitShort, Glyph> = {
  h: "heart",
  d: "diamond",
  c: "club",
  s: "spade",
};

const COLOR_BY_SUIT: Record<SuitShort, "red" | "black"> = {
  h: "red",
  d: "red",
  c: "black",
  s: "black",
};

const PIXEL_PALETTE = {
  cardBg: "#f5e6c8",
  cardEdge: "#7a5c3a",
  cardShadow: "#3a2a1c",
  cardHighlight: "#fff8e6",
  cardLowlight: "#d4be94",
  red: "#c8362b",
  black: "#2a1f1a",
  border: "#2a1f1a",
};

const SUIT_PIXELS: Record<Glyph, string[]> = {
  spade: ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX", "XXXXXXX", ".X.X.X.", "..XXX.."],
  heart: [".XX.XX.", "XXXXXXX", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
  club: ["..XXX..", ".XXXXX.", "..XXX..", "XXXXXXX", "XXXXXXX", "..XXX..", ".XXXXX."],
  diamond: ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
};

const FACE_GRIDS: Record<"J" | "Q" | "K", string[]> = {
  J: [
    "..XXXXX..",
    ".XXXXXXX.",
    "XX.X.X.XX",
    "XXXXXXXXX",
    "XX.XXX.XX",
    ".X.XXX.X.",
    "..XXXXX..",
    "..X.X.X..",
    "..X.X.X..",
  ],
  Q: [
    ".X.X.X.X.",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "XX.X.X.XX",
    "XXXXXXXXX",
    "XX.XXX.XX",
    ".XXXXXXX.",
    "..XXXXX..",
    "...XXX...",
  ],
  K: [
    "X.X.X.X.X",
    "XXXXXXXXX",
    ".XXXXXXX.",
    "XX.X.X.XX",
    "XXXXXXXXX",
    "XX.XXX.XX",
    ".X.XXX.X.",
    "..XXXXX..",
    "..XX.XX..",
  ],
};

interface PixelGridProps {
  grid: string[];
  color: string;
  cell: number;
}

function PixelGrid({ grid, color, cell }: PixelGridProps) {
  const w = grid[0].length;
  const h = grid.length;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${w}, ${cell}px)`,
        gridTemplateRows: `repeat(${h}, ${cell}px)`,
        width: w * cell,
        height: h * cell,
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: pixel grid is fixed-size
            key={`${x}-${y}`}
            style={{ background: c === "X" ? color : "transparent" }}
          />
        )),
      )}
    </div>
  );
}

interface CardProps {
  rank?: number;
  suitShort?: SuitShort;
  selectable?: boolean;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
  rotate?: number;
  glow?: string | null;
  lift?: number;
  dim?: boolean;
}

export function Card({
  rank,
  suitShort,
  selectable = false,
  selected = false,
  faceDown = false,
  onClick,
  width = 64,
  height = 92,
  rotate = 0,
  glow,
  lift = 0,
  dim = false,
}: CardProps) {
  if (faceDown || !rank || !suitShort) {
    return <CardBack width={width} height={height} rotate={rotate} />;
  }

  const px = Math.max(1, Math.round(width / 32));
  const display = card.rankDisplay(rank);
  const isFace = display === "J" || display === "Q" || display === "K";
  const isTen = rank === 10;
  const isRedTen = isTen && (suitShort === "h" || suitShort === "d");
  const fg = COLOR_BY_SUIT[suitShort] === "red" ? PIXEL_PALETTE.red : PIXEL_PALETTE.black;
  const glyph = GLYPH_BY_SUIT[suitShort];

  const wrapperStyle: CSSProperties = {
    position: "relative",
    width,
    height,
    transform: `rotate(${rotate}deg) translateY(${selected ? -16 : lift}px)`,
    transformOrigin: "bottom center",
    transition: "transform .12s ease-out",
    cursor: selectable && onClick ? "pointer" : "default",
    filter: dim ? "brightness(.55) saturate(.5)" : "none",
    flex: "0 0 auto",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!selectable && !onClick}
      style={{ all: "unset", ...wrapperStyle }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: PIXEL_PALETTE.cardShadow,
          transform: `translate(${px}px, ${px * 2}px)`,
          opacity: 0.5,
        }}
      />
      {glow ? (
        <div
          style={{
            position: "absolute",
            inset: -px * 2,
            boxShadow: `0 0 0 ${px}px ${glow}, 0 0 ${px * 8}px ${glow}`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: PIXEL_PALETTE.cardBg,
          boxShadow: `inset 0 0 0 ${px}px ${PIXEL_PALETTE.border},
                      inset ${px}px ${px}px 0 0 ${PIXEL_PALETTE.cardHighlight},
                      inset -${px}px -${px}px 0 0 ${PIXEL_PALETTE.cardLowlight}`,
          display: "flex",
          flexDirection: "column",
          padding: px * 2,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: isTen ? px * 5 : px * 7,
              color: fg,
              lineHeight: 1,
              letterSpacing: isTen ? -px * 0.5 : 0,
            }}
          >
            {display}
          </span>
          <PixelGrid grid={SUIT_PIXELS[glyph]} color={fg} cell={Math.max(1, Math.round(px * 0.7))} />
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isRedTen ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: px }}>
              <span
                style={{
                  fontFamily: "var(--font-pixel)",
                  fontSize: px * 9,
                  color: fg,
                  textShadow: `${px}px ${px}px 0 ${PIXEL_PALETTE.cardShadow}`,
                }}
              >
                10
              </span>
              <PixelGrid grid={SUIT_PIXELS[glyph]} color={fg} cell={Math.max(1, Math.round(px * 1.1))} />
            </div>
          ) : isFace ? (
            <PixelGrid
              grid={FACE_GRIDS[display as "J" | "Q" | "K"]}
              color={fg}
              cell={Math.max(1, Math.round(px * 1.3))}
            />
          ) : (
            <PixelGrid grid={SUIT_PIXELS[glyph]} color={fg} cell={Math.max(1, Math.round(px * 2.2))} />
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
            transform: "rotate(180deg)",
            alignSelf: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: isTen ? px * 5 : px * 7,
              color: fg,
              lineHeight: 1,
              letterSpacing: isTen ? -px * 0.5 : 0,
            }}
          >
            {display}
          </span>
          <PixelGrid grid={SUIT_PIXELS[glyph]} color={fg} cell={Math.max(1, Math.round(px * 0.7))} />
        </div>
      </div>
    </button>
  );
}

interface CardBackProps {
  width: number;
  height: number;
  rotate?: number;
}

function CardBack({ width, height, rotate = 0 }: CardBackProps) {
  const px = Math.max(1, Math.round(width / 32));
  const palette = {
    bg: "#8b2a26",
    accent: "#3a1410",
    highlight: "#c44a3a",
    border: "#2a0a08",
  };
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transform: `rotate(${rotate}deg)`,
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: palette.bg,
          boxShadow: `inset 0 0 0 ${px}px ${palette.border},
                      inset ${px * 2}px ${px * 2}px 0 0 ${palette.highlight}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: px * 3,
          backgroundImage: `repeating-linear-gradient(45deg,
            ${palette.accent} 0 ${px * 2}px,
            transparent ${px * 2}px ${px * 4}px)`,
          boxShadow: `inset 0 0 0 ${px}px ${palette.border}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(45deg)",
          width: width * 0.35,
          height: width * 0.35,
          background: palette.highlight,
          boxShadow: `inset 0 0 0 ${px}px ${palette.border}, ${px}px ${px}px 0 ${palette.border}`,
        }}
      />
    </div>
  );
}
