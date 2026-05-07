import { useEffect, useState } from "react";

export function useStageScale(width: number, height: number): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const sx = window.innerWidth / width;
      const sy = window.innerHeight / height;
      setScale(Math.min(sx, sy));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [width, height]);
  return scale;
}
