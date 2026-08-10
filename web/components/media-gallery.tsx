"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/data";

const LICENSE_LABEL: Record<string, string> = {
  own: "own photo",
  cc0: "CC0",
  "cc-by": "CC BY",
  "cc-by-sa": "CC BY-SA",
  "govt-open": "govt open data",
};

function Credit({ item, className }: { item: GalleryItem; className?: string }) {
  if (!item.credit) return null;
  const lic = item.license ? LICENSE_LABEL[item.license] : null;
  const label = `${item.type === "video" ? "🎥" : "📷"} ${item.credit}${lic ? ` · ${lic}` : ""}`;
  if (!item.sourceUrl) return <span className={className}>{label}</span>;
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`${className} transition-colors hover:text-emerald-300`}
    >
      {label}
    </a>
  );
}

export function MediaGallery({ items, title }: { items: GalleryItem[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = items.length;

  const step = useCallback(
    (delta: number) => setOpen((i) => (i === null ? null : (i + delta + count) % count)),
    [count]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  if (!count) return null;
  const hero = items[0];
  const active = open === null ? null : items[open];

  return (
    <>
      {/* hero */}
      <button
        type="button"
        onClick={() => setOpen(0)}
        aria-label={`Open ${title} media`}
        className="group relative mt-8 block h-72 w-full overflow-hidden rounded-[2rem] ring-1 ring-white/10 sm:h-96"
      >
        <Image
          src={hero.type === "video" ? (hero.poster ?? hero.src) : hero.src}
          alt={hero.caption ?? title}
          fill
          priority
          sizes="(min-width: 768px) 736px, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c0b]/75 via-transparent to-transparent" />
        {hero.type === "video" && (
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white ring-1 ring-white/30 backdrop-blur">
            ▶
          </span>
        )}
        {hero.caption && (
          <p className="absolute bottom-3 left-4 max-w-[70%] text-left text-xs text-stone-300">
            {hero.caption}
          </p>
        )}
        <Credit
          item={hero}
          className="absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-1 text-[10px] text-stone-400 backdrop-blur-md"
        />
      </button>

      {/* filmstrip */}
      {count > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((it, i) => (
            <button
              key={it.src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={it.caption ?? `${it.type} ${i + 1}`}
              className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10 transition-all duration-200 hover:ring-emerald-400/50 focus-visible:ring-emerald-400"
            >
              <Image
                src={it.type === "video" ? (it.poster ?? it.src) : it.src}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
              {it.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-[11px] text-white">
                  ▶
                </span>
              )}
            </button>
          ))}
          <span className="flex shrink-0 items-center px-2 text-[11px] text-stone-600">
            {count} item{count > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* lightbox */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} media viewer`}
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-stone-200 transition-colors hover:bg-white/20"
          >
            ✕
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                aria-label="Previous"
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-colors hover:bg-white/20 sm:left-6"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                aria-label="Next"
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-colors hover:bg-white/20 sm:right-6"
              >
                ›
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[78vh] w-full max-w-5xl items-center justify-center"
          >
            {active.type === "image" ? (
              <div className="relative h-[78vh] w-full">
                <Image
                  src={active.src}
                  alt={active.caption ?? title}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            ) : (
              <video
                key={active.src}
                src={active.src}
                poster={active.poster}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="max-h-[78vh] w-auto rounded-xl"
              />
            )}
          </div>

          <div className="mt-4 w-full max-w-3xl text-center" onClick={(e) => e.stopPropagation()}>
            {active.caption && <p className="text-sm text-stone-300">{active.caption}</p>}
            <p className="mt-1 text-[11px] text-stone-500">
              <Credit item={active} />
              {count > 1 && (
                <span className="ml-2 text-stone-600">
                  {(open ?? 0) + 1} / {count}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
