export type Category =
  | 'ride'
  | 'food'
  | 'moving_help'
  | 'new_muslim_resources'
  | 'laptop'
  | 'childcare'
  | 'elder_transport'
  /**
   * Anything the fixed list does not cover. Real need does not arrange itself
   * into seven buckets, and the alternative to an explicit "other" is a request
   * silently filed as the closest wrong category.
   */
  | 'other';

export type Urgency = 'immediate' | 'scheduled';

export type TrustTier = 1 | 2 | 3;

export type RequestStatus =
  | 'open'
  | 'matching'
  | 'matched'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type VerificationStatus = 'none' | 'pending' | 'approved';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface ParsedRequest {
  category: Category;
  urgency: Urgency;
  time_window: string;
  location_text: string;
  preference: string | null;
  confidence: number;
  /** Free text the requester wrote when they picked "Something else". */
  customLabel?: string | null;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  /** Where accept/complete notices are emailed. Optional: nobody is forced
   *  to hand over an address to ask for help. */
  email: string | null;
  trustTier: TrustTier;
  categoriesOffered: Category[];
  location: LatLng;
  ratingAvg: number | null;
  ratingCount: number;
  points: number;
  completedHelps: number;
  responseRate: number;
  lastMatchAt: string | null;
  partnerId: string | null;
  avatarColor: string;
  isNewHelper: boolean;
  verificationStatus: VerificationStatus;
  availabilityLabel: string;
  radiusMiles: number;
}

export interface Partner {
  id: string;
  name: string;
  type: 'institution' | 'business';
  /** True for the institution that absorbs escalations in this community. */
  isEscalationPartner?: boolean;
  categories: Category[];
  location: LatLng;
  standingOffer: string | null;
}

export interface HelpRequest {
  id: string;
  requesterId: string;
  rawText: string;
  category: Category;
  urgency: Urgency;
  timeWindow: string;
  locationText: string;
  preference: string | null;
  confidence: number;
  location: LatLng;
  status: RequestStatus;
  matchedHelperId: string | null;
  aiMatchReason: string | null;
  createdAt: string;
  requesterConfirmed: boolean;
  helperConfirmed: boolean;
  /** Set only when category is 'other' — what the requester actually needs. */
  customLabel?: string | null;
}

export interface Rating {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  stars: number;
  comment: string;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  ride: 'Ride',
  food: 'Food',
  moving_help: 'Moving help',
  new_muslim_resources: 'New Muslim resources',
  laptop: 'Laptop',
  childcare: 'Childcare',
  elder_transport: 'Elder transport',
  other: 'Something else',
};

export const CATEGORY_MIN_TIER: Record<Category, TrustTier> = {
  ride: 2,
  food: 2,
  moving_help: 2,
  new_muslim_resources: 2,
  laptop: 2,
  childcare: 3,
  elder_transport: 3,
  // An open-ended request is reviewed by a verified helper like any other
  // everyday task. It cannot be used as a side door into the Tier 3
  // categories, because those are gated on the category, not the wording.
  other: 2,
};


export const POINTS_EXCLUDED: Category[] = ['childcare', 'elder_transport'];

export const ALL_CATEGORIES: Category[] = [
  'ride',
  'food',
  'moving_help',
  'new_muslim_resources',
  'laptop',
  'childcare',
  'elder_transport',
  'other',
];

/** How a request should read in a list, honouring a custom label. */
export function categoryTitle(
  category: Category,
  customLabel?: string | null
): string {
  if (category === 'other' && customLabel?.trim()) return customLabel.trim();
  return CATEGORY_LABELS[category];
}

/**
 * The seed ships the device owner as "You" rather than a made-up person, so
 * the demo never puts a stranger's name on the presenter. Screens use this to
 * greet plainly until someone sets a real name in Profile.
 */
export const PLACEHOLDER_NAME = 'You';

export function hasRealName(name: string): boolean {
  const n = name.trim();
  return n.length > 0 && n !== PLACEHOLDER_NAME;
}

export type NotificationKind =
  | 'request_created'
  | 'request_accepted'
  | 'request_completed'
  | 'escalated';

/**
 * A notice raised for one person. Kept in the store so the app can show a
 * feed of what was sent, whether or not the device granted push permission
 * and whether or not an email provider is configured.
 */
export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  requestId: string | null;
  createdAt: string;
  read: boolean;
  /** Delivery outcomes, so the UI never claims more than actually happened. */
  pushed: boolean;
  emailedTo: string | null;
  emailStatus: 'sent' | 'skipped' | 'failed' | 'none';
}
