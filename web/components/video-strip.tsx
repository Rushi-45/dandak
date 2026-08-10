interface VideoClip {
  url: string;
  title?: string | null;
  source?: string | null;
}

/**
 * Short silent clips for a spot. Plain <video controls> so it needs no client
 * JS, and preload="none" means nothing downloads until the visitor taps play —
 * the poster frame is all that loads.
 */
export function VideoStrip({ videos }: { videos: VideoClip[] }) {
  if (!videos.length) return null;
  const credit = videos.find((v) => v.source)?.source;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-300">In motion</h2>
        {credit && <p className="text-[11px] text-stone-500">🎥 {credit}</p>}
      </div>
      <div
        className={`mt-4 grid gap-3 ${videos.length > 1 ? "sm:grid-cols-2 lg:grid-cols-3" : ""}`}
      >
        {videos.map((v) => (
          <figure
            key={v.url}
            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-black/40"
          >
            <video
              className="h-full w-full bg-black"
              src={v.url}
              poster={v.url.replace(/\.mp4$/, ".jpg")}
              controls
              muted
              loop
              playsInline
              preload="none"
            />
            {v.title && (
              <figcaption className="px-4 py-2.5 text-xs leading-snug text-stone-400">
                {v.title}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
