import { CATEGORY_MIN_TIER, categoryTitle } from '@/types/barakah';
import type { HelpRequest, Partner, User } from '@/types/barakah';

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

function buildReason(
  helper: User,
  request: HelpRequest,
  distanceMiles: number,
  partners: Partner[]
): string {
  const dist = distanceMiles < 0.3 ? 'very close' : `${distanceMiles.toFixed(1)} mi away`;
  const tier = `Tier ${helper.trustTier}`;
  const what = categoryTitle(request.category, request.customLabel).toLowerCase();

  // Affiliation is looked up rather than hardcoded, so the reason stays true
  // whichever institutions a community actually has.
  const partner = helper.partnerId
    ? partners.find((p) => p.id === helper.partnerId)
    : undefined;

  if (partner?.type === 'institution') {
    return `${partner.name} volunteer (${tier}) for ${what}, ${dist}`;
  }
  if (partner?.type === 'business') {
    return `${partner.name} partner for ${what}, ${dist}`;
  }
  if (helper.isNewHelper) {
    return `New ${tier} helper for ${what}, ${dist}`;
  }
  return `Nearest ${tier} helper for ${what}, ${dist}`;
}

/**
 * Why this person cannot take this request, or null if they can.
 *
 * Shared by the map sheet and the Incoming list so both agree, and so neither
 * ever offers an Accept button that the store will refuse. Showing the reason
 * beats hiding the request: the tier rules are only visible if you can see
 * them holding something back.
 */
export function blockedReason(request: HelpRequest, me: User): string | null {
  if (request.requesterId === me.id) return 'This is your own request';
  const minTier = CATEGORY_MIN_TIER[request.category];
  if (me.trustTier < minTier) {
    return `Needs a Tier ${minTier} helper — you are Tier ${me.trustTier}`;
  }
  if (!me.categoriesOffered.includes(request.category)) {
    return 'You do not offer this category';
  }
  return null;
}

export function rankHelpers(
  request: HelpRequest,
  helpers: User[],
  excludeUserId: string,
  partners: Partner[] = []
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
        aiMatchReason: buildReason(helper, request, distanceMiles, partners),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

/**
 * Who takes it if nobody taps accept first.
 *
 * Prefers an unaffiliated neighbour over an institution volunteer when the
 * scores are close: a masjid roster is capacity for what neighbours cannot
 * cover, not the first stop. Falls back to the top match either way.
 */
export function pickAutoAccept(matches: RankedMatch[]): RankedMatch | null {
  if (!matches.length) return null;
  const best = matches[0];
  const neighbour = matches.find((m) => !m.helper.partnerId);
  if (neighbour && neighbour.score >= best.score - 0.15) return neighbour;
  return best;
}
