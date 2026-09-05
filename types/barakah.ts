export type Category =
  | 'ride'
  | 'food'
  | 'moving_help'
  | 'new_muslim_resources'
  | 'laptop'
  | 'childcare'
  | 'elder_transport';

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
}

export interface User {
  id: string;
  name: string;
  phone: string;
  trustTier: TrustTier;
  categoriesOffered: Category[];
  location: LatLng;
  ratingAvg: number | null;
  ratingCount: number;
  points: number;
  badges: string[];
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
};

export const CATEGORY_MIN_TIER: Record<Category, TrustTier> = {
  ride: 2,
  food: 2,
  moving_help: 2,
  new_muslim_resources: 2,
  laptop: 2,
  childcare: 3,
  elder_transport: 3,
};


export const BADGE_LABELS: Record<string, string> = {
  first_help: 'First help',
  five_helps: '5 helps',
  twenty_five: '25 helps',
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
];
