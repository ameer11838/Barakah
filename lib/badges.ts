import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { HelpRequest, User } from '@/types/barakah';
import { POINTS_EXCLUDED } from '@/types/barakah';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Badges, derived rather than stored.
 *
 * The old scheme kept an array of milestone ids on the user and appended to it
 * forever, so somebody with seven helps wore "First help" and "5 helps" at the
 * same time — two labels making opposite claims about the same person. The fix
 * is not better wording, it is a better shape:
 *
 *   - RANK is a single title. You hold exactly one, the highest you have
 *     reached, and reaching the next one replaces it.
 *   - TRAITS are many, and each describes a different *kind* of help. Holding
 *     several says something true, because they are not on one scale.
 *
 * Both are computed from data the app already has, so they can never drift out
 * of sync with what someone actually did.
 */

export interface Badge {
  id: string;
  label: string;
  hint: string;
  icon: IoniconName;
}

export interface Rank extends Badge {
  /** Completed helps needed to hold this title. */
  at: number;
}

/** Ordered low to high. */
export const RANKS: Rank[] = [
  {
    id: 'first_answer',
    at: 1,
    label: 'First Answer',
    hint: 'Answered your first call for help',
    icon: 'hand-right',
  },
  {
    id: 'reliable',
    at: 5,
    label: 'Reliable Neighbour',
    hint: 'Five helps completed',
    icon: 'ribbon',
  },
  {
    id: 'anchor',
    at: 15,
    label: 'Community Anchor',
    hint: 'Fifteen helps completed',
    icon: 'shield-half',
  },
  {
    id: 'pillar',
    at: 30,
    label: 'Pillar',
    hint: 'Thirty helps completed — people count on you',
    icon: 'trophy',
  },
];

/** The single title someone currently holds, or null before their first help. */
export function rankFor(completedHelps: number): Rank | null {
  let held: Rank | null = null;
  for (const rank of RANKS) if (completedHelps >= rank.at) held = rank;
  return held;
}

/** The next title and how far off it is, for a progress line. */
export function nextRank(
  completedHelps: number
): { rank: Rank; remaining: number } | null {
  const next = RANKS.find((r) => completedHelps < r.at);
  return next ? { rank: next, remaining: next.at - completedHelps } : null;
}

/**
 * Traits earned from what someone has actually done.
 *
 * Category traits read the completed request records, so they unlock live
 * during a demo. The last three read profile statistics, so an established
 * neighbour arrives already wearing something.
 */
export function traitsFor(user: User, requests: HelpRequest[]): Badge[] {
  const helped = requests.filter(
    (r) => r.status === 'completed' && r.matchedHelperId === user.id
  );
  const asked = requests.filter(
    (r) => r.status === 'completed' && r.requesterId === user.id
  );
  const did = (predicate: (r: HelpRequest) => boolean) => helped.some(predicate);

  const out: Badge[] = [];
  const add = (id: string, label: string, hint: string, icon: IoniconName) =>
    out.push({ id, label, hint, icon });

  if (did((r) => r.category === 'ride'))
    add('road_ready', 'Road Ready', 'Gave someone a ride', 'car-sport');
  if (did((r) => r.category === 'food'))
    add('open_table', 'Open Table', 'Made sure someone ate', 'restaurant');
  if (did((r) => r.category === 'moving_help'))
    add('heavy_lifting', 'Heavy Lifting', 'Helped someone move', 'cube');
  if (did((r) => r.category === 'laptop'))
    add('tech_lift', 'Tech Lift', 'Got someone equipped for school or work', 'laptop');
  if (did((r) => r.category === 'new_muslim_resources'))
    add('welcomer', 'Welcomer', 'Helped someone new to the community', 'sparkles');
  if (did((r) => POINTS_EXCLUDED.includes(r.category)))
    add('entrusted', 'Entrusted', 'Trusted with vetted-only care', 'shield-checkmark');
  if (did((r) => r.category === 'other'))
    add('problem_solver', 'Problem Solver', 'Took on something that fit no category', 'bulb');
  if (did((r) => r.urgency === 'immediate'))
    add('swift', 'Swift', 'Answered something urgent', 'flash');

  // The one that captures what mutual aid actually is: you have been on both
  // ends of it.
  if (helped.length > 0 && asked.length > 0)
    add('both_ways', 'Both Ways', 'Has asked for help and given it', 'swap-horizontal');

  if (user.ratingAvg != null && user.ratingAvg >= 4.8 && user.ratingCount >= 5)
    add('well_regarded', 'Well Regarded', `${user.ratingAvg.toFixed(1)} across ${user.ratingCount} ratings`, 'star');
  if (user.responseRate >= 0.9 && user.completedHelps >= 3)
    add('always_on', 'Always On', 'Rarely leaves a request unanswered', 'pulse');

  return out;
}
