import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { pickAutoAccept, rankHelpers } from '@/lib/matching';
import {
  DEFAULT_USER_ID,
  geocodePlace,
  partners as seedPartners,
  seedRequests,
  users as seedUsers,
} from '@/seed/paterson-icpc';
import type {
  Category,
  HelpRequest,
  ParsedRequest,
  Partner,
  Rating,
  TrustTier,
  User,
} from '@/types/barakah';
import { CATEGORY_MIN_TIER, POINTS_EXCLUDED } from '@/types/barakah';

const AUTO_ACCEPT_MS = 2200;
const POINTS_PER_HELP = 25;

type Toast = { id: string; message: string } | null;

interface BarakahState {
  hydrated: boolean;
  currentUserId: string;
  users: User[];
  partners: Partner[];
  requests: HelpRequest[];
  ratings: Rating[];
  toast: Toast;
  setHydrated: (v: boolean) => void;
  getCurrentUser: () => User;
  getUser: (id: string) => User | undefined;
  resetDemo: () => void;
  setToast: (message: string | null) => void;
  toggleCategoryOffered: (category: Category) => void;
  submitIdVerification: () => void;
  approveVerification: () => void;
  submitRequest: (rawText: string, parsed: ParsedRequest) => string;
  acceptRequest: (requestId: string) => { ok: boolean; error?: string };
  confirmCompletion: (requestId: string) => void;
  submitRating: (requestId: string, stars: number, comment: string) => void;
  escalateToIcpc: (requestId: string) => void;
}

function cloneUsers(): User[] {
  return seedUsers.map((u) => ({
    ...u,
    categoriesOffered: [...u.categoriesOffered],
    badges: [...u.badges],
  }));
}

function cloneRequests(): HelpRequest[] {
  return seedRequests.map((r) => ({ ...r }));
}

function awardBadges(completedHelps: number, existing: string[]): string[] {
  const next = new Set(existing);
  if (completedHelps >= 1) next.add('first_help');
  if (completedHelps >= 5) next.add('five_helps');
  if (completedHelps >= 25) next.add('twenty_five');
  return Array.from(next);
}

const autoAcceptTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useBarakahStore = create<BarakahState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      currentUserId: DEFAULT_USER_ID,
      users: cloneUsers(),
      partners: seedPartners.map((p) => ({ ...p, categories: [...p.categories] })),
      requests: cloneRequests(),
      ratings: [],
      toast: null,

      setHydrated: (v) => set({ hydrated: v }),

      getCurrentUser: () => {
        const { users, currentUserId } = get();
        return users.find((u) => u.id === currentUserId) ?? users[0];
      },

      getUser: (id) => get().users.find((u) => u.id === id),

      resetDemo: () => {
        Object.values(autoAcceptTimers).forEach(clearTimeout);
        Object.keys(autoAcceptTimers).forEach((k) => delete autoAcceptTimers[k]);
        set({
          currentUserId: DEFAULT_USER_ID,
          users: cloneUsers(),
          partners: seedPartners.map((p) => ({ ...p, categories: [...p.categories] })),
          requests: cloneRequests(),
          ratings: [],
          toast: { id: String(Date.now()), message: 'Demo data reset' },
        });
      },

      setToast: (message) =>
        set({ toast: message ? { id: String(Date.now()), message } : null }),

      toggleCategoryOffered: (category) => {
        const { currentUserId, users } = get();
        set({
          users: users.map((u) => {
            if (u.id !== currentUserId) return u;
            const has = u.categoriesOffered.includes(category);
            return {
              ...u,
              categoriesOffered: has
                ? u.categoriesOffered.filter((c) => c !== category)
                : [...u.categoriesOffered, category],
            };
          }),
        });
      },

      submitIdVerification: () => {
        const { currentUserId, users } = get();
        set({
          users: users.map((u) =>
            u.id === currentUserId ? { ...u, verificationStatus: 'pending' } : u
          ),
          toast: {
            id: String(Date.now()),
            message: 'ID uploaded — pending demo approval',
          },
        });
      },

      approveVerification: () => {
        const { currentUserId, users } = get();
        set({
          users: users.map((u) =>
            u.id === currentUserId
              ? {
                  ...u,
                  verificationStatus: 'approved',
                  trustTier: Math.max(u.trustTier, 2) as TrustTier,
                }
              : u
          ),
          toast: { id: String(Date.now()), message: 'Tier 2 approved (demo)' },
        });
      },

      submitRequest: (rawText, parsed) => {
        const { currentUserId, users, requests } = get();
        const geo = geocodePlace(parsed.location_text);
        const id = `req-${Date.now()}`;
        const request: HelpRequest = {
          id,
          requesterId: currentUserId,
          rawText,
          category: parsed.category,
          urgency: parsed.urgency,
          timeWindow: parsed.time_window,
          locationText: geo.label,
          preference: parsed.preference,
          confidence: parsed.confidence,
          location: geo.location,
          status: 'matching',
          matchedHelperId: null,
          aiMatchReason: null,
          createdAt: new Date().toISOString(),
          requesterConfirmed: false,
          helperConfirmed: false,
        };

        set({ requests: [request, ...requests] });

        const matches = rankHelpers(request, users, currentUserId);
        const chosen = pickAutoAccept(matches);

        if (chosen) {
          autoAcceptTimers[id] = setTimeout(() => {
            const state = get();
            const stillWaiting = state.requests.find(
              (r) => r.id === id && (r.status === 'matching' || r.status === 'open')
            );
            if (!stillWaiting) return;
            set({
              requests: state.requests.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      status: 'matched',
                      matchedHelperId: chosen.helper.id,
                      aiMatchReason: chosen.aiMatchReason,
                    }
                  : r
              ),
              toast: {
                id: String(Date.now()),
                message: `${chosen.helper.name} accepted your request`,
              },
            });
          }, AUTO_ACCEPT_MS);
        } else {
          set({
            requests: get().requests.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: 'open',
                    aiMatchReason: 'No nearby match yet — try ICPC escalate',
                  }
                : r
            ),
            toast: {
              id: String(Date.now()),
              message: 'No helper matched yet — you can escalate to ICPC',
            },
          });
        }

        return id;
      },

      acceptRequest: (requestId) => {
        const { currentUserId, users, requests } = get();
        const me = users.find((u) => u.id === currentUserId);
        const request = requests.find((r) => r.id === requestId);
        if (!me || !request) return { ok: false, error: 'Request not found' };
        if (request.requesterId === currentUserId) {
          return { ok: false, error: "You can't accept your own request" };
        }
        if (request.status !== 'open' && request.status !== 'matching') {
          return { ok: false, error: 'Already taken' };
        }
        if (!me.categoriesOffered.includes(request.category)) {
          return { ok: false, error: "You don't offer this category" };
        }
        const minTier = CATEGORY_MIN_TIER[request.category];
        if (me.trustTier < minTier) {
          return { ok: false, error: `Requires Tier ${minTier}` };
        }

        const matches = rankHelpers(request, users, request.requesterId);
        const mine = matches.find((m) => m.helper.id === currentUserId);
        const reason =
          mine?.aiMatchReason ??
          `You offer ${request.category.replace(/_/g, ' ')} nearby and meet Tier ${me.trustTier}`;

        set({
          requests: requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'matched',
                  matchedHelperId: currentUserId,
                  aiMatchReason: reason,
                }
              : r
          ),
          users: users.map((u) =>
            u.id === currentUserId ? { ...u, lastMatchAt: new Date().toISOString() } : u
          ),
          toast: { id: String(Date.now()), message: 'You accepted this request' },
        });
        return { ok: true };
      },

      confirmCompletion: (requestId) => {
        const { currentUserId, requests, users } = get();
        const request = requests.find((r) => r.id === requestId);
        if (!request || !request.matchedHelperId) return;

        const isRequester = request.requesterId === currentUserId;
        const isHelper = request.matchedHelperId === currentUserId;
        if (!isRequester && !isHelper) return;

        let requesterConfirmed = request.requesterConfirmed;
        let helperConfirmed = request.helperConfirmed;
        if (isRequester) requesterConfirmed = true;
        if (isHelper) helperConfirmed = true;

        const both = requesterConfirmed && helperConfirmed;
        const updated: HelpRequest = {
          ...request,
          requesterConfirmed,
          helperConfirmed,
          status: both ? 'completed' : 'in_progress',
        };

        let nextUsers = users;
        if (both && !POINTS_EXCLUDED.includes(request.category)) {
          nextUsers = users.map((u) => {
            if (u.id !== request.matchedHelperId) return u;
            const completedHelps = u.completedHelps + 1;
            return {
              ...u,
              completedHelps,
              points: u.points + POINTS_PER_HELP,
              badges: awardBadges(completedHelps, u.badges),
              isNewHelper: false,
            };
          });
        }

        set({
          requests: requests.map((r) => (r.id === requestId ? updated : r)),
          users: nextUsers,
          toast: {
            id: String(Date.now()),
            message: both
              ? 'Help confirmed — points awarded'
              : 'Marked complete — waiting on the other side',
          },
        });
      },

      submitRating: (requestId, stars, comment) => {
        const { currentUserId, requests, ratings, users } = get();
        const request = requests.find((r) => r.id === requestId);
        if (!request || request.status !== 'completed' || !request.matchedHelperId) return;
        if (!request.requesterConfirmed || !request.helperConfirmed) return;

        const toUserId =
          currentUserId === request.requesterId
            ? request.matchedHelperId
            : request.requesterId;

        if (ratings.some((r) => r.requestId === requestId && r.fromUserId === currentUserId)) {
          return;
        }

        const rating: Rating = {
          id: `rating-${Date.now()}`,
          requestId,
          fromUserId: currentUserId,
          toUserId,
          stars,
          comment,
        };

        const targetRatings = [...ratings, rating].filter((r) => r.toUserId === toUserId);
        const avg =
          targetRatings.reduce((sum, r) => sum + r.stars, 0) / targetRatings.length;

        set({
          ratings: [...ratings, rating],
          users: users.map((u) =>
            u.id === toUserId
              ? {
                  ...u,
                  ratingAvg: Math.round(avg * 10) / 10,
                  ratingCount: targetRatings.length,
                }
              : u
          ),
          toast: { id: String(Date.now()), message: 'Thanks for rating' },
        });
      },

      escalateToIcpc: (requestId) => {
        const { requests, users } = get();
        const fatima = users.find((u) => u.id === 'user-fatima');
        if (!fatima) return;
        set({
          requests: requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'matched',
                  matchedHelperId: fatima.id,
                  aiMatchReason: 'Escalated to ICPC Tier 3 volunteer roster',
                }
              : r
          ),
          toast: {
            id: String(Date.now()),
            message: 'Routed to ICPC — Fatima Ali assigned',
          },
        });
      },
    }),
    {
      name: 'barakah-demo-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        users: s.users,
        requests: s.requests,
        ratings: s.ratings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
