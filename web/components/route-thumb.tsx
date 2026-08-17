export interface RouteThumbStop {
  lat: number;
  lng: number;
  day: number;
  order: number;
}

const W = 240;
const H = 96;
const PAD = 14;
const DAY_STROKE = ["#34d399", "#fbbf24", "#38bdf8", "#f472b6", "#a78bfa"];

/** Tiny static signature of a trip's route, server-safe, no interactivity. */
export function RouteThumb({ stops }: { stops: RouteThumbStop[] }) {
  if (stops.length < 2) return null;

  const midLat = stops.reduce((a, s) => a + s.lat, 0) / stops.length;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = stops.map((s) => s.lng * kx);
  const ys = stops.map((s) => s.lat);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const dx = Math.max(Math.max(...xs) - minX, 0.01);
  const dy = Math.max(maxY - Math.min(...ys), 0.01);
  const scale = Math.min((W - PAD * 2) / dx, (H - PAD * 2) / dy);
  const ox = (W - dx * scale) / 2;
  const oy = (H - dy * scale) / 2;
  const pt = (s: RouteThumbStop) => ({
    x: ox + (s.lng * kx - minX) * scale,
    y: oy + (maxY - s.lat) * scale,
  });

  const days = [...new Set(stops.map((s) => s.day))].sort((a, b) => a - b);
  const lists = days.map((d) =>
    stops.filter((s) => s.day === d).sort((a, b) => a.order - b.order)
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      aria-hidden
      role="presentation"
    >
      {lists.slice(0, -1).map((list, i) => {
        const next = lists[i + 1];
        if (!list.length || !next?.length) return null;
        const a = pt(list[list.length - 1]);
        const b = pt(next[0]);
        return (
          <line
            key={`c${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
        );
      })}
      {lists.map((list, i) => {
        if (list.length < 2) return null;
        const d = list
          .map((s, j) => {
            const { x, y } = pt(s);
            return `${j === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(" ");
        const color = DAY_STROKE[i % DAY_STROKE.length];
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
      {stops.map((s) => {
        const { x, y } = pt(s);
        return (
          <circle
            key={`${s.day}-${s.order}`}
            cx={x}
            cy={y}
            r="2.6"
            fill="#0b1210"
            stroke={DAY_STROKE[(s.day - 1) % DAY_STROKE.length]}
            strokeWidth="1.4"
          />
        );
      })}
    </svg>
  );
}
