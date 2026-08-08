"use client";

import { m, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/** Aceternity-style tracing beam — a gradient line that draws itself as you read. */
export function TracingBeam({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.35", "end 0.75"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const dotTop = useTransform(scaleY, [0, 1], ["0%", "100%"]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="absolute -left-8 top-2 hidden h-[calc(100%-1rem)] w-px bg-white/[0.06] lg:block xl:-left-14">
        <m.div
          style={{ scaleY }}
          className="h-full w-px origin-top bg-gradient-to-b from-emerald-400 via-teal-300 to-amber-300"
        />
        <m.div
          style={{ top: dotTop }}
          className="absolute -left-[5px] h-[11px] w-[11px] -translate-y-1/2 rounded-full border border-emerald-300 bg-[#080c0b] shadow-[0_0_14px_3px_rgba(52,211,153,0.55)]"
        />
      </div>
      {children}
    </div>
  );
}
