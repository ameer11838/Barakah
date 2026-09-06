import type { LatLng } from '@/types/barakah';

/**
 * Where "here" is.
 *
 * Barakah is not built around one masjid in one city. A community is an anchor
 * point and a label, and everything else — seeded helpers, partners, the map
 * region, the fallback for an unrecognised place name — is positioned relative
 * to that anchor. Set it from the device's location and the same app works
 * anywhere someone needs help.
 */

export interface Community {
  /** Centre of the community. Seeded people are placed around it. */
  anchor: LatLng;
  /** Human label for the anchor, e.g. "Paterson, NJ" or "your area". */
  label: string;
  /** Name for the local institution partner in seeded data. */
  institutionName: string;
  /** Name for the local business partner in seeded data. */
  businessName: string;
}

/**
 * The default anchor. Deliberately a generic city centre rather than a real
 * congregation's address: the app ships unaffiliated, and the first thing it
 * does on launch is try to replace this with wherever the user actually is.
 */
export const DEFAULT_COMMUNITY: Community = {
  anchor: { latitude: 40.9168, longitude: -74.1718 },
  label: 'your area',
  institutionName: 'Community Masjid',
  businessName: 'Neighbourhood Grocer',
};

/**
 * How far out "the community" reaches. One constant, because the ring drawn on
 * the map, the camera that frames it and the seeded neighbours all have to
 * agree — when they were three separate numbers they silently disagreed, and
 * every seeded person sat outside the ring that was supposed to contain them.
 */
export const COMMUNITY_RADIUS_METERS = 1600;

const METERS_PER_MILE = 1609.34;
const MILES_PER_DEGREE_LAT = 69;

/** Camera framing the whole community ring, with a little air around it. */
export function mapRegionFor(anchor: LatLng) {
  const spanMiles = (COMMUNITY_RADIUS_METERS / METERS_PER_MILE) * 2.6;
  const latitudeDelta = spanMiles / MILES_PER_DEGREE_LAT;
  // A degree of longitude shrinks toward the poles, so the span has to be
  // widened by 1/cos(lat) to stay square on the ground.
  const longitudeDelta =
    latitudeDelta / Math.max(0.2, Math.cos((anchor.latitude * Math.PI) / 180));
  return { ...anchor, latitudeDelta, longitudeDelta };
}

/** Metres-ish offsets used to scatter seeded people around the anchor. */
export function offsetFrom(anchor: LatLng, dLat: number, dLng: number): LatLng {
  return {
    latitude: anchor.latitude + dLat,
    longitude: anchor.longitude + dLng,
  };
}

/**
 * Shift a whole set of coordinates from one anchor to another, preserving the
 * relative layout. Used when the app learns the user's real location and
 * re-homes the seeded community around them, so a demo run in any city still
 * has neighbours at plausible distances instead of an empty map.
 */
export function rehome(point: LatLng, from: LatLng, to: LatLng): LatLng {
  return {
    latitude: point.latitude - from.latitude + to.latitude,
    longitude: point.longitude - from.longitude + to.longitude,
  };
}
