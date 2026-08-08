"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";

/** Subtle below-the-fold reveal — transform/opacity only. */
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </m.div>
  );
}
