import type { Metadata } from "next";
import { Suspense } from "react";
import { TripPlanner } from "@/components/trip-planner";
import { getItineraries, getPlannerIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Plan your own trip",
  description:
    "Tell us where you start, where you finish and when you are travelling: get a day-by-day route through Dang and Narmada built from the whole dataset.",
  alternates: { canonical: "/plan" },
};

export default function PlanPage() {
  const data = getPlannerIndex();
  const itineraries = getItineraries();
  const covered = new Set(itineraries.flatMap((i) => i.stops.map((s) => s.spot_id))).size;

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-12">
      <div className="pointer-events-none absolute -top-10 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />

      {/* The framing sells the planner to someone deciding whether to use it.
          On paper the decision is made and the trip is what matters, so this
          block goes and the printed sheet opens on the route itself. */}
      <p className="no-print text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
        Build your own
      </p>
      <h1 className="no-print mt-3 font-serif text-4xl font-black leading-[1.05] tracking-tight text-stone-50 sm:text-5xl">
        Where are you starting, and where do you have to be?
      </h1>
      <p className="no-print mt-4 text-lg leading-relaxed text-stone-400">
        The {itineraries.length} trips we wrote by hand reach {covered} of these{" "}
        {data.spots.length} places. Give us two points on the map and a month, and we will build a
        route through the rest, using the same road distances, visit lengths and season notes
        that every record already carries.
      </p>

      <div className="mt-10">
        {/* useSearchParams needs a Suspense boundary or the prerender fails */}
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-3xl border border-white/[0.07] bg-white/[0.02]" />
          }
        >
          <TripPlanner
            data={data}
            /* Slim stop-id sets for the 12 hand-written trips, so a generated
               plan can point at the one that already covers most of it — the
               curated pages carry day notes and prose the generator cannot. */
            trips={itineraries.map((i) => ({
              slug: i.slug,
              title: i.title,
              days: i.duration_days,
              spotIds: i.stops.map((s) => s.spot_id),
            }))}
          />
        </Suspense>
      </div>
    </div>
  );
}
