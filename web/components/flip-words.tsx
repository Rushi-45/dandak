"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useState } from "react";

/** Aceternity-style flip words, cycles through phrases with a blur-slide. */
export function FlipWords({
  words,
  interval = 2600,
  className = "",
}: {
  words: string[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span className={`relative inline-block whitespace-nowrap align-baseline ${className}`}>
      <AnimatePresence mode="wait">
        <m.span
          key={words[index]}
          initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-block"
        >
          {words[index]}
        </m.span>
      </AnimatePresence>
    </span>
  );
}
