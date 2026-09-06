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

export function mapRegionFor(anchor: LatLng) {
  return {
    ...anchor,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  };
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
