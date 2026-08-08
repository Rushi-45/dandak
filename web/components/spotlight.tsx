"use client";

import { m, useMotionTemplate, useMotionValue } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

/** Card-spotlight wrapper — an emerald glow follows the pointer across children. */
export function Spotlight({ children, className = "" }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(-300);
  const y = useMotionValue(-300);
  const bg = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, rgba(52,211,153,0.13), transparent 70%)`;

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - r.left);
    y.set(e.clientY - r.top);
  }

  return (
    <div
      className={`group relative ${className}`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        x.set(-300);
        y.set(-300);
      }}
    >
      <m.div
        aria-hidden
        style={{ background: bg }}
        className="pointer-events-none absolute -inset-2 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </div>
  );
}
