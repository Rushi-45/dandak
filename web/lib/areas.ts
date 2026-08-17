/**
 * Areas, the travel-facing grouping of the dataset's `cluster` taxonomy.
 *
 * Clusters are the right axis for landing pages: each one is a *place*, which is
 * how people search, and every spot belongs to exactly one, so six pages cover
 * all 106 records with nothing left over and nothing counted twice. Category
 * pages would overlap badly: 8 of the 13 gardens sit inside the Statue of Unity
 * complex, and 6 of the 12 Dang viewpoints are in Saputara, so those pages would
 * be near-duplicates of the area pages rather than new information.
 *
 * The two smallest clusters are merged rather than dropped, into the neighbour
 * they are actually visited from: Poicha (2) joins Rajpipla, ~13 km away rather
 * than ~25 km from Ekta Nagar; Around Ekta Nagar (4) joins the Statue of Unity
 * complex, which is the same catchment.
 *
 * Slugs are hand-written here and never derived from data, so adding a 107th
 * spot can never mint a URL. The intros are editorial synthesis, so they live in
 * web/ rather than data/: the dataset's contract is that every claim carries a
 * source, and a written introduction has none to give.
 */

export interface Area {
  slug: string;
  /** page title and the anchor text every spot page will link with */
  title: string;
  /** the dataset clusters this area covers */
  clusters: string[];
  district: "dang" | "narmada";
  /** one line, used on cards and in meta descriptions */
  blurb: string;
  /** the editorial opening, without one, a page like this is a doorway */
  intro: string[];
}

export const AREAS: Area[] = [
  {
    slug: "interior-dang",
    title: "Interior Dang",
    clusters: ["dang-interior"],
    district: "dang",
    blurb:
      "The forest beyond Ahwa, the largest concentration of waterfalls in Gujarat, and the least visited.",
    intro: [
      "Everything south and east of Ahwa is what people mean by interior Dang: a dissected plateau of teak and bamboo where the roads follow ridgelines because the valleys are too steep to build in. It holds more of this dataset than anywhere else, and almost none of it appears in a tourism brochure.",
      "The arithmetic of the place is unforgiving. Ahwa to Chikhalda Falls is 12 km as the crow flies and 54 km by road, because you descend to a valley road and come back up the far side. Fuel up in Ahwa; there are no pumps on the interior stretch. Distances here punish optimism more than anywhere else in either district.",
      "It is also where the payoff is. Girmal is the tallest fall in Gujarat, Don sits at the highest village, and a dozen falls in these pages, Chikhalda, Ritu, Baaj, Chirai, Advait, are documented here and almost nowhere else on the internet.",
    ],
  },
  {
    slug: "statue-of-unity",
    title: "The Statue of Unity Complex",
    clusters: ["sou-complex", "ekta-nagar-area"],
    district: "narmada",
    blurb:
      "Ekta Nagar and the precinct around the world's tallest statue, gardens, a safari, a dam and a river gorge.",
    intro: [
      "The Statue of Unity is 182 metres of Sardar Patel facing the Sardar Sarovar dam, and the precinct built around it at Ekta Nagar is unlike anything else in either district: ticketed, landscaped, shuttle-served, and busy in a way the forests never are.",
      "It rewards planning more than wandering. Most of the gardens are walkable from one another but the road network is a one-way visitor loop, so driving between two neighbours can take four times the distance you would walk. The statue itself wants two to four hours if you go up to the viewing gallery.",
      "The surrounding country is the quieter half. Zarwani falls inside the Shoolpaneshwar sanctuary, Garudeshwar sits on the Narmada with its own temple ghat, and the Khalwani rafting stretch runs when the dam releases.",
    ],
  },
  {
    slug: "saputara",
    title: "Saputara Hill Station",
    clusters: ["saputara"],
    district: "dang",
    blurb:
      "Gujarat's only hill station, a lake, a ropeway, a ring of viewpoints, and the state's coolest summer.",
    intro: [
      "Saputara sits at nearly a thousand metres on the Maharashtra border, and it is the one part of Dang built for visitors rather than stumbled upon by them. A lake at the centre, gardens and viewpoints around the rim, a ropeway up to the sunset ridge, and a tribal museum that is genuinely worth the half hour.",
      "Its season runs opposite to the rest of the dataset. The waterfalls below peak in August and September; Saputara peaks in the cool clear months from October to December, when the valley haze lifts and the viewpoints actually show you something. The monsoon festival is the exception, and it is deliberately timed against the weather.",
      "Almost everything here is within a few kilometres, so this is the one area you can do largely on foot. It also makes the obvious base for the interior falls, though be honest about the distances, which run to two hours each way.",
    ],
  },
  {
    slug: "rajpipla",
    title: "Rajpipla & the Narmada Bank",
    clusters: ["rajpipla", "poicha"],
    district: "narmada",
    blurb:
      "The old princely town, the Karjan hills behind it, and the temple riverbank at Poicha.",
    intro: [
      "Rajpipla was the seat of a princely state until 1948 and still looks it: a palace on the hill, a planned town below, and a district's worth of administration that has never quite become a tourist economy. It is the practical base for everything in northern Narmada that is not the Statue of Unity.",
      "Behind the town the Karjan catchment folds into hills holding falls that see almost no visitors, Kesharva, Juna Ghanta, Chhatwada, and the Devsatra ridge above them. West along the river, Nilkanthdham at Poicha is a modern temple complex on the Narmada bank that draws pilgrims in numbers the rest of this area never sees.",
      "One thing to plan around: the Narmada is in the way. Places that look close on a map can need a long detour to a bridge, so check the route rather than the distance.",
    ],
  },
  {
    slug: "waghai",
    title: "The Waghai Belt",
    clusters: ["waghai"],
    district: "dang",
    blurb:
      "The forest gateway to Dang: a botanical garden, Vansda's teak, and the falls along the Ambika.",
    intro: [
      "Waghai is the door into Dang from the plains, and the belt around it is the gentlest forest country in the district: the Ambika and Khapri rivers, a botanical garden of some size, and Vansda National Park just over the Navsari line holding one of the last stands of old teak in Gujarat.",
      "It is the easiest part of Dang to reach and the easiest to underestimate. Gira Falls is a few kilometres out and runs wide rather than tall, which makes it the fall most people in Gujarat have actually seen. The heritage narrow-gauge line still runs to Waghai station.",
      "For an early start into the interior, or a first night before the ghat roads, this is the sensible place to stop, the Forest Department campsites at Kilad and Padam Dungari are both here.",
    ],
  },
  {
    slug: "dediapada",
    title: "Dediapada & the Shoolpaneshwar Belt",
    clusters: ["dediapada-belt"],
    district: "narmada",
    blurb:
      "Gujarat's largest wildlife sanctuary, its remotest falls, and the campsites inside the forest.",
    intro: [
      "The Shoolpaneshwar sanctuary spreads south from the Narmada across the hills toward Maharashtra, and Dediapada is the town you pass through to enter it. This is the wildest country in either district: sloth bear, leopard and a forest that closes over the road.",
      "It is also the least equipped. Ninai Falls is the one people come for, dropping in stages through the sanctuary, and the approach is a forest road that monsoon does not improve. There is no fuel and little phone signal past the town.",
      "The Forest Department runs campsites at Sagai and Malsamot inside the belt, which is the honest way to see it: the distances are too long and the roads too slow to make a day trip from Rajpipla comfortable.",
    ],
  },
];

/** Registry cluster labels, mirrored from scripts/registry.json (which needs node:fs). */
export const CLUSTER_LABEL: Record<string, string> = {
  saputara: "Saputara Hill Station",
  waghai: "Waghai Belt",
  "dang-interior": "Interior Dang",
  "sou-complex": "Statue of Unity Complex",
  "ekta-nagar-area": "Around Ekta Nagar",
  "dediapada-belt": "Dediapada & Shoolpaneshwar Belt",
  rajpipla: "Rajpipla Town & Around",
  poicha: "Poicha Riverbank",
};

export function clusterLabel(cluster: string | null | undefined): string | null {
  if (!cluster) return null;
  return CLUSTER_LABEL[cluster] ?? null;
}

export function areaBySlug(slug: string): Area | undefined {
  return AREAS.find((a) => a.slug === slug);
}

/** The area a spot belongs to: every cluster is covered, so this only returns null for a null cluster. */
export function areaForCluster(cluster: string | null | undefined): Area | null {
  if (!cluster) return null;
  return AREAS.find((a) => a.clusters.includes(cluster)) ?? null;
}
