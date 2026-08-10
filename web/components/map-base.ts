import type { Map as LeafletMap_ } from "leaflet";

/**
 * Adds the three key-free base layers (satellite / terrain / dark) plus the
 * Esri place-name overlay that rides along with satellite only, since the
 * other bases already carry their own labels. Shared by every map on the site.
 */
export function addBaseLayers(
  L: typeof import("leaflet"),
  map: LeafletMap_,
  opts: { control?: boolean } = {}
) {
  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 17,
      attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics, GIS User Community",
    }
  );
  const terrain = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 16,
    attribution: "© OpenStreetMap contributors, SRTM · © OpenTopoMap (CC-BY-SA)",
  });
  const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors · © CARTO",
  });

  satellite.addTo(map);

  const placeLabels = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 17, attribution: "Labels © Esri" }
  );
  placeLabels.addTo(map);

  if (opts.control !== false) {
    L.control
      .layers({ "🛰 Satellite": satellite, "⛰ Terrain": terrain, "🌒 Dark": dark }, undefined, {
        position: "topright",
      })
      .addTo(map);
  }

  map.on("baselayerchange", (e) => {
    const name = (e as unknown as { name: string }).name;
    if (name.includes("Satellite")) placeLabels.addTo(map);
    else map.removeLayer(placeLabels);
  });

  return { satellite, terrain, dark, placeLabels };
}

/**
 * Leaflet measures its container once at init. If the container's size settles
 * later — web fonts landing, a phone rotating, a responsive reflow — tiles come
 * out blank or half-drawn. This re-measures on a tick and on every resize.
 * Returns a disposer for the effect cleanup.
 */
export function keepMapSized(map: LeafletMap_, el: HTMLElement) {
  const invalidate = () => map.invalidateSize({ animate: false });
  const t1 = setTimeout(invalidate, 0);
  const t2 = setTimeout(invalidate, 400);
  let ro: ResizeObserver | undefined;
  if (typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(invalidate);
    ro.observe(el);
  }
  window.addEventListener("orientationchange", invalidate);
  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    ro?.disconnect();
    window.removeEventListener("orientationchange", invalidate);
  };
}

/** Honest uncertainty radius (metres) for a record's coordinate precision. */
export function precisionRadius(precision: string): number | null {
  if (precision === "approximate") return 900;
  if (precision === "area") return 2500;
  return null; // exact
}
