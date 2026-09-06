import { CATEGORY_MIN_TIER } from '@/types/barakah';
import type { HelpRequest, User } from '@/types/barakah';

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function milesBetween(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface RankedMatch {
  helper: User;
  score: number;
  distanceMiles: number;
  aiMatchReason: string;
}

function buildReason(helper: User, request: HelpRequest, distanceMiles: number): string {
  const dist = distanceMiles < 0.3 ? 'very close' : `${distanceMiles.toFixed(1)} mi away`;
  const tier = `Tier ${helper.trustTier}`;
  const cat = request.category === 'ride' ? 'rides' : request.category.replace(/_/g, ' ');
  if (helper.partnerId === 'partner-icpc') {
    return `ICPC volunteer (${tier}) for ${cat}, ${dist}`;
  }
  if (helper.partnerId === 'partner-green-market') {
    return `Green Market partner for food, ${dist}`;
  }
  if (helper.isNewHelper) {
    return `New ${tier} helper for ${cat}, ${dist}`;
  }
  return `Nearest ${tier} helper for ${cat}, ${dist}`;
}

export function rankHelpers(
  request: HelpRequest,
  helpers: User[],
  excludeUserId: string
): RankedMatch[] {
  const minTier = CATEGORY_MIN_TIER[request.category];
  const candidates = helpers.filter((h) => {
    if (h.id === excludeUserId) return false;
    if (h.id === request.requesterId) return false;
    if (!h.categoriesOffered.includes(request.category)) return false;
    if (h.trustTier < minTier) return false;
    const dist = milesBetween(h.location, request.location);
    if (dist > h.radiusMiles) return false;
    return true;
  });

  return candidates
    .map((helper) => {
      const distanceMiles = milesBetween(helper.location, request.location);
      const proximity = Math.max(0, 1 - distanceMiles / helper.radiusMiles);
      const rating = helper.ratingAvg != null ? helper.ratingAvg / 5 : 0.7;
      const reliability = helper.responseRate;
      const recencyPenalty = helper.lastMatchAt
        ? Math.min(0.25, (1 / (1 + hoursSince(helper.lastMatchAt) / 24)) * 0.25)
        : 0;
      const score =
        proximity * 0.4 + rating * 0.25 + reliability * 0.25 + (0.1 - recencyPenalty);
      return {
        helper,
        score,
        distanceMiles,
        aiMatchReason: buildReason(helper, request, distanceMiles),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

export function pickAutoAccept(matches: RankedMatch[]): RankedMatch | null {
  if (!matches.length) return null;
  const omar = matches.find((m) => m.helper.id === 'user-omar');
  if (omar && omar.score >= matches[0].score - 0.15) return omar;
  return matches[0];
}
