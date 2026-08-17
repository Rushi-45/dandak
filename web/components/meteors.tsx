/** CSS meteors, amber streaks for the legends card. Fixed positions keep hydration stable. */
const METEORS = [
  { left: "8%", top: "-5%", delay: "0s", duration: "4.6s" },
  { left: "22%", top: "10%", delay: "1.4s", duration: "6.2s" },
  { left: "38%", top: "-8%", delay: "3.1s", duration: "5.1s" },
  { left: "52%", top: "4%", delay: "0.8s", duration: "6.8s" },
  { left: "64%", top: "-4%", delay: "2.2s", duration: "4.9s" },
  { left: "76%", top: "12%", delay: "4s", duration: "5.6s" },
  { left: "88%", top: "-6%", delay: "1.9s", duration: "6.4s" },
  { left: "30%", top: "30%", delay: "5.2s", duration: "5.8s" },
  { left: "70%", top: "26%", delay: "3.7s", duration: "4.4s" },
];

export function Meteors() {
  return (
    <>
      {METEORS.map((mt, i) => (
        <span
          key={i}
          aria-hidden
          className="meteor pointer-events-none absolute h-0.5 w-0.5 rounded-full bg-amber-200"
          style={{
            left: mt.left,
            top: mt.top,
            animationDelay: mt.delay,
            animationDuration: mt.duration,
          }}
        />
      ))}
    </>
  );
}
