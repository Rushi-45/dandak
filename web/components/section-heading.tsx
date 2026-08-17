/**
 * The top-level section heading on long pages.
 *
 * The spot pages carry the longest prose in the project and had eleven sections
 * all set as the same 12px uppercase label. With every heading at identical
 * weight there is no hierarchy to scan — a reader looking for "Getting there"
 * has to read all eleven. This gives the page-level sections a serif voice that
 * matches the h1, and leaves the small uppercase style to do what it is good at:
 * labelling things *inside* a card, one level down.
 *
 * The accent rule is the only colour, so a section reads as belonging to the
 * page rather than to a palette of its own.
 */

const ACCENT = {
  emerald: "bg-gradient-to-r from-emerald-400 to-teal-400",
  amber: "bg-gradient-to-r from-amber-400 to-orange-400",
  cyan: "bg-gradient-to-r from-cyan-400 to-sky-400",
  red: "bg-gradient-to-r from-red-400 to-rose-400",
} as const;

export function SectionHeading({
  children,
  accent = "emerald",
  className = "",
}: {
  children: React.ReactNode;
  accent?: keyof typeof ACCENT;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className={`block h-[3px] w-9 rounded-full ${ACCENT[accent]}`} />
      <h2 className="mt-3.5 font-serif text-2xl font-black leading-tight tracking-tight text-stone-100 sm:text-[1.7rem]">
        {children}
      </h2>
    </div>
  );
}
