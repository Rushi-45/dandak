/**
 * Category → visual identity (emoji + chip classes). Static strings so Tailwind can see them.
 *
 * `tint` is the same hue as the chip, as a raw hex rather than a class, because
 * SpotPlaceholder paints SVG strokes and gradient stops with it. Tailwind cannot
 * generate a class from a runtime value, and an arbitrary-value class built by
 * template string would be purged — so the placeholder uses inline style and
 * takes the colour from here. Keep the two in sync: `tint` should be the -300
 * shade the chip's text uses.
 */
export const CATEGORY_META: Record<string, { emoji: string; chip: string; tint: string }> = {
  waterfall: { emoji: "💧", chip: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30", tint: "#67e8f9" },
  viewpoint: { emoji: "🌄", chip: "bg-amber-400/10 text-amber-300 ring-amber-400/30", tint: "#fcd34d" },
  lake: { emoji: "🛶", chip: "bg-sky-400/10 text-sky-300 ring-sky-400/30", tint: "#7dd3fc" },
  garden: { emoji: "🌸", chip: "bg-pink-400/10 text-pink-300 ring-pink-400/30", tint: "#f9a8d4" },
  park: { emoji: "🎠", chip: "bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/30", tint: "#f0abfc" },
  temple: { emoji: "🛕", chip: "bg-orange-400/10 text-orange-300 ring-orange-400/30", tint: "#fdba74" },
  "religious-site": { emoji: "🪔", chip: "bg-orange-400/10 text-orange-300 ring-orange-400/30", tint: "#fdba74" },
  museum: { emoji: "🏛️", chip: "bg-violet-400/10 text-violet-300 ring-violet-400/30", tint: "#c4b5fd" },
  wildlife: { emoji: "🐆", chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30", tint: "#6ee7b7" },
  fort: { emoji: "🏰", chip: "bg-stone-400/10 text-stone-300 ring-stone-400/30", tint: "#d6d3d1" },
  palace: { emoji: "👑", chip: "bg-yellow-400/10 text-yellow-300 ring-yellow-400/30", tint: "#fde047" },
  monument: { emoji: "🗿", chip: "bg-indigo-400/10 text-indigo-300 ring-indigo-400/30", tint: "#a5b4fc" },
  dam: { emoji: "🌊", chip: "bg-blue-400/10 text-blue-300 ring-blue-400/30", tint: "#93c5fd" },
  adventure: { emoji: "🪂", chip: "bg-red-400/10 text-red-300 ring-red-400/30", tint: "#fca5a5" },
  "eco-campsite": { emoji: "🏕️", chip: "bg-lime-400/10 text-lime-300 ring-lime-400/30", tint: "#bef264" },
  cultural: { emoji: "🎨", chip: "bg-rose-400/10 text-rose-300 ring-rose-400/30", tint: "#fda4af" },
  market: { emoji: "🛍️", chip: "bg-teal-400/10 text-teal-300 ring-teal-400/30", tint: "#5eead4" },
  show: { emoji: "✨", chip: "bg-purple-400/10 text-purple-300 ring-purple-400/30", tint: "#d8b4fe" },
};

export function categoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      emoji: "📍",
      chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
      tint: "#6ee7b7",
    }
  );
}

/** Stay type → visual identity. Shared by /stays and the spot pages so a bed reads the same everywhere. */
export const STAY_TYPE_META: Record<string, { emoji: string; label: string; chip: string }> = {
  "eco-campsite": {
    emoji: "🏕️",
    label: "forest campsite",
    chip: "bg-lime-400/10 text-lime-300 ring-lime-400/30",
  },
  homestay: {
    emoji: "🏡",
    label: "homestay",
    chip: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  },
  guesthouse: {
    emoji: "🛏️",
    label: "guesthouse",
    chip: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  },
  hotel: { emoji: "🏨", label: "hotel", chip: "bg-stone-400/10 text-stone-300 ring-stone-400/30" },
  resort: { emoji: "🌿", label: "resort", chip: "bg-teal-400/10 text-teal-300 ring-teal-400/30" },
  "tent-city": {
    emoji: "⛺",
    label: "tent city",
    chip: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
  },
  dharamshala: {
    emoji: "🪔",
    label: "dharamshala",
    chip: "bg-orange-400/10 text-orange-300 ring-orange-400/30",
  },
};

export function stayTypeMeta(type: string) {
  return (
    STAY_TYPE_META[type] ?? {
      emoji: "🛏️",
      label: type.replace(/-/g, " "),
      chip: "bg-stone-400/10 text-stone-300 ring-stone-400/30",
    }
  );
}

export const PRICE_BAND_LABEL: Record<string, string> = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
  luxury: "Luxury",
};

export const CONFIDENCE_META: Record<string, { label: string; cls: string }> = {
  high: { label: "Verified", cls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" },
  medium: { label: "Researched", cls: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  low: { label: "Explorer-grade", cls: "bg-stone-400/10 text-stone-300 ring-stone-400/30" },
};
