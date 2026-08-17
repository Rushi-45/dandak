"use client";

import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Motion guardrails (per specs/09): LazyMotion + `m` components only,
 * reduced-motion respected, transform/opacity animations only.
 *
 * `features` is the bundle itself rather than a loader, deliberately. Passing
 * `() => import(...)` is the documented way to defer the animation runtime, and
 * it was tried here, but measured, the initial payload did not move: the
 * homepage went 227 to 228 KB gz, and two initial chunks still carried the
 * feature code. Every page mounts an `m` element from the same module, so the
 * bundler has no seam to split on. The indirection bought nothing, so it is
 * gone. Revisit only if `m` usage ever becomes route-specific.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
