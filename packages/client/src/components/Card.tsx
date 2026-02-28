import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "border-2 rounded px-1 py-0.5 inline-block select-none",
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
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  display: string;
  onClick?: () => void;
}

export function Card({ display, suit, selectable, selected, onClick }: CardProps) {
  return (
    <span className={cardVariants({ suit, selectable, selected })} onClick={onClick}>
      {display}
    </span>
  );
}
