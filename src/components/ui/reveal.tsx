"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Fades and rises into view the first time it scrolls onto the screen. With `stagger`, its children follow one after another. Visible without JavaScript. */
export function Reveal({ children, className, stagger = false }: { children: React.ReactNode; className?: string; delay?: number; stagger?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Only hide the content once we know it can be revealed again.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArmed(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn(armed && "reveal-armed", shown && "reveal-in", stagger && "reveal-stagger", className)}>
      {children}
    </div>
  );
}
