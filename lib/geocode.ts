import * as Location from 'expo-location';
import { Platform } from 'react-native';

import type { LatLng } from '@/types/barakah';
import { DEFAULT_COMMUNITY, offsetFrom } from '@/lib/community';

/**
 * Turning a place name into coordinates, anywhere.
 *
 * The old build shipped a lookup table of four Paterson streets, which meant
 * the app only worked in one neighbourhood. This resolves in three stages:
 *
 *   1. The OS geocoder via expo-location. On iOS that is Apple's, on Android
 *      Google's — both work worldwide and neither needs an API key.
 *   2. OpenStreetMap Nominatim, which covers web where the OS geocoder is
 *      unavailable, and anything the OS geocoder misses.
 *   3. A point near the community anchor, flagged approximate so the UI can
 *      say the pin is a guess rather than quietly pretending otherwise.
 *
 * A request is never blocked on geocoding: stage 3 always returns something.
 */

export interface GeocodeResult {
  location: LatLng;
  label: string;
  source: 'device' | 'osm' | 'approximate';
}

/** Words that are not places, so we never geocode them. */
const NOT_A_PLACE =
  /^(flexible|anywhere|near me|nearby|here|home|my house|my place|asap|now)$/i;

async function viaOsGeocoder(query: string): Promise<GeocodeResult | null> {
  // expo-location's geocodeAsync is unimplemented on web.
  if (Platform.OS === 'web') return null;
  try {
    const results = await Location.geocodeAsync(query);
    const hit = results?.[0];
    if (!hit) return null;
    return {
      location: { latitude: hit.latitude, longitude: hit.longitude },
      label: query,
      source: 'device',
    };
  } catch {
    return null;
  }
}

async function viaNominatim(query: string, near: LatLng): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  // Bias results toward the community so "Main Street" resolves locally
  // rather than to whichever Main Street the index happens to rank first.
  const d = 0.35;
  url.searchParams.set(
    'viewbox',
    [near.longitude - d, near.latitude + d, near.longitude + d, near.latitude - d].join(',')
  );

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim's usage policy requires an identifying User-Agent.
        'User-Agent': 'Barakah/1.0 (community mutual aid app)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const hit = json?.[0];
    if (!hit) return null;
    return {
      location: { latitude: Number(hit.lat), longitude: Number(hit.lon) },
      label: hit.display_name.split(',').slice(0, 2).join(',').trim(),
      source: 'osm',
    };
  } catch {
    // Offline, slow, or rate-limited: fall through rather than block a request.
    return null;
  }
}

export async function geocodePlace(
  text: string,
  anchor: LatLng = DEFAULT_COMMUNITY.anchor
): Promise<GeocodeResult> {
  const query = text.trim();

  if (query && !NOT_A_PLACE.test(query)) {
    const os = await viaOsGeocoder(query);
    if (os) return os;

    const osm = await viaNominatim(query, anchor);
    if (osm) return osm;
  }

  // Nudged slightly off the exact anchor so several unresolved requests do not
  // stack into a single unreadable pin.
  return {
    location: offsetFrom(anchor, 0.002, -0.003),
    label: query || 'Near you',
    source: 'approximate',
  };
}

/**
 * Ask for the device's location once, to anchor the community.
 * Returns null if permission is refused — which is a normal answer, not an
 * error, and the app carries on with the default anchor.
 */
export async function currentLocation(): Promise<LatLng | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

/** Best-effort human name for a coordinate, for the community label. */
export async function describeLocation(point: LatLng): Promise<string> {
  if (Platform.OS === 'web') return 'your area';
  try {
    const places = await Location.reverseGeocodeAsync(point);
    const p = places?.[0];
    if (!p) return 'your area';
    return [p.city ?? p.subregion, p.region].filter(Boolean).join(', ') || 'your area';
  } catch {
    return 'your area';
  }
}
