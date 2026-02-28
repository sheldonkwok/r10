import { cva, type VariantProps } from "class-variance-authority";
import { card } from "shared";

const cardVariants = cva(
  "flex flex-col items-center justify-center gap-1 border-2 rounded-lg bg-white select-none w-14 h-20 p-0",
  {
    variants: {
      suit: {
        red: "border-red-600 text-red-600",
        black: "border-black text-black",
      },
      selectable: {
        true: "cursor-pointer hover:opacity-80",
        false: "",
      },
      selected: {
        true: "bg-yellow-100",
        false: "",
      },
    },
    defaultVariants: {
      suit: "black",
      selectable: false,
      selected: false,
    },
  },
);

interface CardProps extends VariantProps<typeof cardVariants> {
  rank: number;
  suitEmoji: string;
  onClick?: () => void;
}

export function Card({ rank, suitEmoji, suit, selectable, selected, onClick }: CardProps) {
  return (
    <button type="button" className={cardVariants({ suit, selectable, selected })} onClick={onClick}>
      <span className="text-lg font-bold leading-none">{card.rankDisplay(rank)}</span>
      <span className="text-xl leading-none">{suitEmoji}</span>
    </button>
  );
}
