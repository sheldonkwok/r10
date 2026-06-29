import type { GamePlayer, GameState } from "game";
import { Card } from "../Card.tsx";

type SuitShort = "h" | "d" | "c" | "s";

interface PileProps {
  currentPlay: GameState["currentPlay"];
  pilePlayer: GamePlayer | null | undefined;
  isMobile: boolean;
  pileCardW: number;
  pileCardH: number;
}

export function Pile({ currentPlay, pilePlayer, isMobile, pileCardW, pileCardH }: PileProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: isMobile ? 310 : "44%",
          transform: isMobile ? "translateX(-50%)" : "translate(-50%, -50%)",
          display: "flex",
          zIndex: 4,
        }}
      >
        {currentPlay ? (
          currentPlay.cards.map((c, i) => {
            const cnt = currentPlay.cards.length;
            const angle = (i - (cnt - 1) / 2) * 6;
            return (
              <div key={`${c.rank}-${c.suit.short}-${i}`} style={{ marginLeft: i === 0 ? 0 : 6 }}>
                <Card
                  rank={c.rank}
                  suitShort={c.suit.short as SuitShort}
                  width={pileCardW}
                  height={pileCardH}
                  rotate={angle}
                />
              </div>
            );
          })
        ) : (
          <div
            className="font-pixel text-[10px] tracking-widest"
            style={{ color: "var(--color-paper-muted)" }}
          >
            ◂ EMPTY PILE ▸
          </div>
        )}
      </div>
      {currentPlay && (
        <div
          className="font-pixel text-[9px] tracking-widest"
          style={{
            position: "absolute",
            left: "50%",
            top: isMobile ? 424 : "61%",
            transform: "translateX(-50%)",
            color: "var(--color-paper-muted)",
            zIndex: 4,
            whiteSpace: "nowrap",
          }}
        >
          ◂ {pilePlayer?.username.toUpperCase() ?? ""} PLAYED ▸
        </div>
      )}
    </>
  );
}
