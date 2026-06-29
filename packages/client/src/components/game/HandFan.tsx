import { closestCenter, DndContext, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import type { GamePlayer } from "game";
import type { ComponentProps, CSSProperties } from "react";
import { Card } from "../Card.tsx";
import { SortableHandCard } from "./SortableHandCard.tsx";

type SuitShort = "h" | "d" | "c" | "s";

interface HandFanProps {
  hand: GamePlayer["hand"];
  selectedIndices: Set<number>;
  canInteract: boolean;
  scale: number;
  sensors: ComponentProps<typeof DndContext>["sensors"];
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleCard: (index: number) => void;
  handCardW: number;
  handCardH: number;
  handOverlap: number;
  handFanMult: number;
  /** Absolute-position overrides applied on top of the shared row container style.
   *  Desktop passes `{ bottom: 28, zIndex: 6 }`, mobile passes `{ top: 78, zIndex: 7 }`. */
  containerStyle: CSSProperties;
}

export function HandFan({
  hand,
  selectedIndices,
  canInteract,
  scale,
  sensors,
  onDragStart,
  onDragEnd,
  onToggleCard,
  handCardW,
  handCardH,
  handOverlap,
  handFanMult,
  containerStyle,
}: HandFanProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={hand.map((c) => `${c.rank}-${c.suit.short}`)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            ...containerStyle,
          }}
        >
          {hand.map((c, i) => {
            const cnt = hand.length;
            const angle = (i - (cnt - 1) / 2) * handFanMult;
            const isRedTen = c.rank === 10 && (c.suit.short === "h" || c.suit.short === "d");
            const isSel = selectedIndices.has(i);
            const id = `${c.rank}-${c.suit.short}`;
            return (
              <SortableHandCard key={id} id={id} marginLeft={i === 0 ? 0 : handOverlap} scale={scale}>
                <Card
                  rank={c.rank}
                  suitShort={c.suit.short as SuitShort}
                  width={handCardW}
                  height={handCardH}
                  rotate={angle}
                  selectable={canInteract}
                  selected={isSel}
                  glow={isSel ? "var(--color-accent)" : isRedTen ? "var(--color-team-red-glow)" : null}
                  onClick={canInteract ? () => onToggleCard(i) : undefined}
                />
              </SortableHandCard>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
