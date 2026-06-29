import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface SortableHandCardProps {
  id: string;
  marginLeft: number;
  scale: number;
  children: ReactNode;
}

export function SortableHandCard({ id, marginLeft, scale, children }: SortableHandCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  // dnd-kit reports pointer/layout deltas in screen px, but they're applied inside a
  // CSS-scaled container — divide by scale so on-screen movement matches the cursor.
  const adjusted = transform ? { ...transform, x: transform.x / scale, y: transform.y / scale } : null;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        marginLeft,
        transform: CSS.Transform.toString(adjusted),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
        touchAction: "none",
      }}
    >
      {children}
    </div>
  );
}
