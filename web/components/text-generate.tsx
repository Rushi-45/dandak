"use client";

import { m } from "motion/react";

/** Aceternity-style text generate — words de-blur into place one by one. */
export function TextGenerate({
  text,
  className = "",
  delay = 0.1,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <m.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, filter: "blur(7px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.3, delay: delay + i * 0.04, ease: "easeOut" }}
          className="inline-block"
        >
          {word}&nbsp;
        </m.span>
      ))}
    </span>
  );
}
