"use client";

import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SpotCard, type SpotCardData } from "@/components/spot-card";
import { categoryMeta } from "@/lib/ui";

const QUICK_TAGS = [
  { tag: "monsoon", label: "☔ Monsoon" },
  { tag: "offbeat", label: "🧭 Offbeat" },
  { tag: "family", label: "👪 Family" },
  { tag: "popular", label: "⭐ Popular" },
  { tag: "pilgrimage", label: "🪔 Pilgrimage" },
  { tag: "free-entry", label: "🆓 Free entry" },
];

const PLACEHOLDERS = [
  "Try “waterfalls”…",
  "Try “sunset”…",
  "Try “safari”…",
  "Try “rajpipla”…",
  "Try “trek”…",
];

function labelize(s: string) {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The district named by /spots#dang.
 *
 * A fragment is never sent to the server, so the server can only ever render
 * "all" — which is why this cannot be a lazy useState initialiser without a
 * hydration mismatch, and why setting it from an effect was the previous
 * approach. useSyncExternalStore is the supported way to hold a value that
 * legitimately differs between server and client, and subscribing to
 * hashchange means arriving from another page's #dang link now works while
 * the page is already open, which the one-shot effect never did.
 */
type DistrictTab = "all" | "dang" | "narmada";

const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const hashDistrict = (): DistrictTab => {
  const h = window.location.hash.replace("#", "");
  return h === "dang" || h === "narmada" ? h : "all";
};
const serverDistrict = (): DistrictTab => "all";

export function SpotExplorer({ spots }: { spots: SpotCardData[] }) {
  // null until the reader picks a tab, so the #dang deep link keeps working
  const [districtChoice, setDistrict] = useState<DistrictTab | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [ph, setPh] = useState(0);

  const fromHash = useSyncExternalStore(subscribeHash, hashDistrict, serverDistrict);
  const district = districtChoice ?? fromHash;

  useEffect(() => {
    const t = setInterval(() => setPh((v) => (v + 1) % PLACEHOLDERS.length), 2800);
    return () => clearInterval(t);
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of spots) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((s) => {
      if (district !== "all" && s.district !== district) return false;
      if (category && s.category !== category) return false;
      // "free-entry" is derived from visit.fees rather than tagged — the tag
      // exists in the vocabulary but is on zero records, so this chip used to
      // empty the grid while 72 spots are in fact free. See toCardData.
      if (tags.length && !tags.every((t) => (t === "free-entry" ? s.free : s.tags.includes(t))))
        return false;
      if (q) {
        const hay = `${s.name.en} ${s.summary} ${s.category} ${s.cluster ?? ""} ${s.district} ${s.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [spots, district, category, tags, query]);

  const active = district !== "all" || category !== null || tags.length > 0 || query.trim() !== "";

  function clearAll() {
    setDistrict("all");
    setCategory(null);
    setTags([]);
    setQuery("");
  }

  return (
    <div>
      {/* ── Sticky filter bar ─────────────────────────────── */}
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-white/[0.06] bg-[#080c0b]/85 px-4 pb-3 pt-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* district tabs */}
          <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1 text-sm">
            {(["all", "dang", "narmada"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDistrict(d)}
                className={`rounded-lg px-3.5 py-1.5 font-semibold capitalize transition-colors ${
                  district === d
                    ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/30"
                    : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {d === "all" ? `All · ${spots.length}` : d}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500">
              ⌕
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[ph]}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-9 text-sm text-stone-200 outline-none transition-all placeholder:text-stone-600 focus:border-emerald-400/40 focus:bg-white/[0.05] focus:shadow-[0_0_30px_-10px_rgba(16,185,129,0.5)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 transition-colors hover:text-stone-200"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {active && (
            <button
              onClick={clearAll}
              className="rounded-xl border border-amber-300/25 bg-amber-400/10 px-3.5 py-2 text-xs font-bold text-amber-200 transition-colors hover:bg-amber-400/20"
            >
              Clear all ✕
            </button>
          )}
        </div>

        {/* category chips */}
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map(([cat, count]) => {
            const meta = categoryMeta(cat);
            const on = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(on ? null : cat)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-all ${
                  on
                    ? `${meta.chip} scale-105`
                    : "bg-white/[0.03] text-stone-400 ring-white/10 hover:text-stone-200 hover:ring-white/25"
                }`}
              >
                <span aria-hidden>{meta.emoji}</span>
                {labelize(cat)}
                <span className={on ? "opacity-80" : "text-stone-600"}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* quick tags */}
        <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {QUICK_TAGS.map(({ tag, label }) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => setTags((v) => (on ? v.filter((t) => t !== tag) : [...v, tag]))}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 transition-all ${
                  on
                    ? "bg-emerald-400/15 text-emerald-200 ring-emerald-300/40"
                    : "bg-white/[0.02] text-stone-500 ring-white/[0.08] hover:text-stone-300"
                }`}
              >
                {label}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 self-center text-xs text-stone-500">
            <span className="font-bold text-emerald-300">{filtered.length}</span> of {spots.length}{" "}
            places
          </span>
        </div>
      </div>

      {/* ── Results grid ──────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="group/cards mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((spot) => (
              <m.div
                key={`${spot.district}-${spot.slug}`}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <SpotCard spot={spot} />
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-20 text-center">
          <p className="font-serif text-3xl font-black italic text-stone-300">
            Nothing in the forest matches that.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Try fewer filters — or a different word for it.
          </p>
          <button
            onClick={clearAll}
            className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-200 transition-colors hover:bg-emerald-400/20"
          >
            Clear everything
          </button>
        </div>
      )}
    </div>
  );
}
