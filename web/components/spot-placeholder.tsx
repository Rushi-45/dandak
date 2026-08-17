import { categoryMeta } from "@/lib/ui";

/**
 * The stand-in for a spot with no photograph — 78 of the 106 at the time of
 * writing, so this is what most of the /spots grid actually looks like.
 *
 * The card used to render nothing at all in the image slot, which left the grid
 * ragged: 28 cards with a 160px photo and 78 that started at the category chip.
 * A flat grey box would fix the silhouette and look like a broken image. Contour
 * lines in the category's own hue read as terrain, which is what this dataset is
 * about, and they make an unphotographed spot look deliberate rather than empty.
 *
 * Everything here is derived from the spot id, so the same spot draws the same
 * hillside on every render. That matters for more than tidiness: a random
 * pattern would differ between the server and the client and blow up hydration.
 * No Math.random, no Date — see the seeded generator below.
 */

/** FNV-1a. Small, stable, and dependency-free. */
function hashId(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — a seeded PRNG, so the "randomness" is a pure function of the id. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 320;
const H = 160;
const LINES = 8;

export function SpotPlaceholder({
  seed,
  name,
  category,
  className = "",
}: {
  /** Stable per spot — the spot id, or `${district}-${slug}` which is the same thing. */
  seed: string;
  name: string;
  category: string;
  className?: string;
}) {
  const { tint } = categoryMeta(category);
  const rnd = mulberry32(hashId(seed));

  // A stack of sine ridges. Amplitude grows toward the foot of the frame so it
  // reads as a slope receding into distance rather than as wallpaper.
  const ridges: { points: string; opacity: number }[] = [];
  for (let i = 0; i < LINES; i++) {
    const y = 16 + i * ((H - 24) / (LINES - 1));
    const amp = 3 + rnd() * 7 + i * 0.9;
    const phase = rnd() * Math.PI * 2;
    const wavelength = 46 + rnd() * 34;
    const pts: string[] = [];
    for (let x = -12; x <= W + 12; x += 16) {
      pts.push(`${x},${(y + Math.sin(x / wavelength + phase) * amp).toFixed(1)}`);
    }
    ridges.push({ points: pts.join(" "), opacity: 0.2 + i * 0.055 });
  }

  // First letter that is actually a letter — several names open with a quote or
  // a bracket ("Karanjwa (Mahal) Falls"), and a stray glyph reads as a mistake.
  const initial = (name.match(/\p{L}/u)?.[0] ?? "•").toUpperCase();

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(130% 120% at 18% -15%, ${tint}40, transparent 66%), radial-gradient(90% 80% at 95% 105%, ${tint}1c, transparent 60%), linear-gradient(158deg, #16211d 0%, #0a0e0d 100%)`,
      }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {ridges.map((r, i) => (
          <polyline
            key={i}
            points={r.points}
            fill="none"
            stroke={tint}
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity={r.opacity}
          />
        ))}
      </svg>

      <span
        className="absolute -bottom-5 right-2 select-none font-serif text-[7rem] font-black italic leading-none"
        style={{ color: tint, opacity: 0.22 }}
      >
        {initial}
      </span>

      {/* Matches the gradient the photographed cards use, so both silhouettes
          settle into the card body the same way. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#101513] via-transparent to-transparent" />
    </div>
  );
}
