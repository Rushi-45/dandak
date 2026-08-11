/** Category → visual identity (emoji + chip classes). Static strings so Tailwind can see them. */
export const CATEGORY_META: Record<string, { emoji: string; chip: string }> = {
  waterfall: { emoji: "💧", chip: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30" },
  viewpoint: { emoji: "🌄", chip: "bg-amber-400/10 text-amber-300 ring-amber-400/30" },
  lake: { emoji: "🛶", chip: "bg-sky-400/10 text-sky-300 ring-sky-400/30" },
  garden: { emoji: "🌸", chip: "bg-pink-400/10 text-pink-300 ring-pink-400/30" },
  park: { emoji: "🎠", chip: "bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/30" },
  temple: { emoji: "🛕", chip: "bg-orange-400/10 text-orange-300 ring-orange-400/30" },
  "religious-site": { emoji: "🪔", chip: "bg-orange-400/10 text-orange-300 ring-orange-400/30" },
  museum: { emoji: "🏛️", chip: "bg-violet-400/10 text-violet-300 ring-violet-400/30" },
  wildlife: { emoji: "🐆", chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30" },
  fort: { emoji: "🏰", chip: "bg-stone-400/10 text-stone-300 ring-stone-400/30" },
  palace: { emoji: "👑", chip: "bg-yellow-400/10 text-yellow-300 ring-yellow-400/30" },
  monument: { emoji: "🗿", chip: "bg-indigo-400/10 text-indigo-300 ring-indigo-400/30" },
  dam: { emoji: "🌊", chip: "bg-blue-400/10 text-blue-300 ring-blue-400/30" },
  adventure: { emoji: "🪂", chip: "bg-red-400/10 text-red-300 ring-red-400/30" },
  "eco-campsite": { emoji: "🏕️", chip: "bg-lime-400/10 text-lime-300 ring-lime-400/30" },
  cultural: { emoji: "🎨", chip: "bg-rose-400/10 text-rose-300 ring-rose-400/30" },
  market: { emoji: "🛍️", chip: "bg-teal-400/10 text-teal-300 ring-teal-400/30" },
  show: { emoji: "✨", chip: "bg-purple-400/10 text-purple-300 ring-purple-400/30" },
};

export function categoryMeta(category: string) {
  return (
    CATEGORY_META[category] ?? {
      emoji: "📍",
      chip: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
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
