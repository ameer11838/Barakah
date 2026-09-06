import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type ThemePreference } from '@/constants/theme';
import { DEFAULT_COMMUNITY, rehome, type Community } from '@/lib/community';
import { currentLocation, describeLocation, geocodePlace } from '@/lib/geocode';
import { pickAutoAccept, rankHelpers } from '@/lib/matching';
import { notices, raiseNotice } from '@/lib/notify';
import {
  ANCHOR,
  DEFAULT_USER_ID,
  partners as seedPartners,
  seedRequests,
  users as seedUsers,
} from '@/seed/community';
import type {
  AppNotification,
  Category,
  HelpRequest,
  LatLng,
  ParsedRequest,
  Partner,
  Rating,
  TrustTier,
  User,
} from '@/types/barakah';
import { CATEGORY_MIN_TIER, POINTS_EXCLUDED, categoryTitle } from '@/types/barakah';

const AUTO_ACCEPT_MS = 2200;
export const POINTS_PER_HELP = 25;
const MAX_NOTIFICATIONS = 60;

type Toast = { id: string; message: string } | null;

interface BarakahState {
  hydrated: boolean;
  currentUserId: string;
  community: Community;
  users: User[];
  partners: Partner[];
  requests: HelpRequest[];
  ratings: Rating[];
  notifications: AppNotification[];
  toast: Toast;
  /** Light/dark choice. Survives resetDemo — it is a preference, not demo data. */
  themePreference: ThemePreference;
  /**
   * When on, a plausible helper accepts on a timer so the flow can be shown
   * single-handed. Off by default: the two-sided walkthrough — switch personas
   * and accept as the helper — is the more honest demo, and a timer that fires
   * first steals that moment.
   */
  autoAcceptEnabled: boolean;
  /** Guards the launch-time location lookup so it runs once per app start. */
  locatedThisSession: boolean;

  setHydrated: (v: boolean) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setAutoAccept: (enabled: boolean) => void;
  /** Become another seeded person, to show the other half of the exchange. */
  switchUser: (userId: string) => void;
  /** Anchor on the device's real location, once per launch. */
  autoLocate: () => Promise<void>;
  getCurrentUser: () => User;
  getUser: (id: string) => User | undefined;
  resetDemo: () => void;
  setToast: (message: string | null) => void;

  /** Re-anchor the whole community on the device's real location. */
  useDeviceLocation: (opts?: { silent?: boolean }) => Promise<boolean>;
  updateProfile: (patch: { name?: string; email?: string | null }) => void;

  toggleCategoryOffered: (category: Category) => void;
  submitIdVerification: () => void;
  approveVerification: () => void;

  submitRequest: (rawText: string, parsed: ParsedRequest) => Promise<string>;
  acceptRequest: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  confirmCompletion: (requestId: string) => Promise<void>;
  submitRating: (requestId: string, stars: number, comment: string) => void;
  escalateToPartner: (requestId: string) => Promise<void>;

  markNotificationsRead: () => void;
  unreadCount: () => number;
}

function cloneUsers(): User[] {
  return seedUsers.map((u) => ({
    ...u,
    categoriesOffered: [...u.categoriesOffered],
  }));
}

function clonePartners(): Partner[] {
  return seedPartners.map((p) => ({ ...p, categories: [...p.categories] }));
}

function cloneRequests(): HelpRequest[] {
  return seedRequests.map((r) => ({ ...r }));
}

const autoAcceptTimers: Record<string, ReturnType<typeof setTimeout>> = {};

export const useBarakahStore = create<BarakahState>()(
  persist(
    (set, get) => {
      /** Append a notice, keeping the feed bounded. */
      const pushNotification = (n: AppNotification) => {
        const next = [n, ...get().notifications].slice(0, MAX_NOTIFICATIONS);
        set({ notifications: next });
      };

      /**
       * Raise a notice for a user, on every channel available. Never rejects:
       * a failed email must not roll back an accept that already happened.
       */
      const notify = async (
        userId: string,
        kind: AppNotification['kind'],
        copy: { title: string; body: string },
        requestId: string | null
      ) => {
        try {
          const user = get().users.find((u) => u.id === userId);
          const record = await raiseNotice({
            userId,
            kind,
            title: copy.title,
            body: copy.body,
            requestId,
            // Only the person holding this device gets a real email; the other
            // seeded personas are not real inboxes.
            email: userId === get().currentUserId ? (user?.email ?? null) : null,
          });
          pushNotification(record);
        } catch (err) {
          console.log('[barakah] notify failed', err);
        }
      };

      return {
        hydrated: false,
        currentUserId: DEFAULT_USER_ID,
        community: DEFAULT_COMMUNITY,
        users: cloneUsers(),
        partners: clonePartners(),
        requests: cloneRequests(),
        ratings: [],
        notifications: [],
        toast: null,
        themePreference: 'system',
        autoAcceptEnabled: false,
        locatedThisSession: false,

        setHydrated: (v) => set({ hydrated: v }),

        setThemePreference: (themePreference) => set({ themePreference }),

        setAutoAccept: (autoAcceptEnabled) => set({ autoAcceptEnabled }),

        switchUser: (userId) => {
          const user = get().users.find((u) => u.id === userId);
          if (!user) return;
          set({
            currentUserId: userId,
            toast: { id: String(Date.now()), message: `Now viewing as ${user.name}` },
          });
        },

        autoLocate: async () => {
          if (get().locatedThisSession) return;
          set({ locatedThisSession: true });
          // Silent: at launch this is scene-setting, not something the user
          // asked for, so it should not throw a toast over the first screen.
          await get().useDeviceLocation({ silent: true });
        },

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
            community: DEFAULT_COMMUNITY,
            users: cloneUsers(),
            partners: clonePartners(),
            requests: cloneRequests(),
            ratings: [],
            notifications: [],
            locatedThisSession: false,
            toast: { id: String(Date.now()), message: 'Demo data reset' },
          });
          // The seed is laid out around the default anchor, so re-home it on
          // the real location again rather than leaving the demo in New Jersey.
          void get().autoLocate();
        },

        setToast: (message) =>
          set({ toast: message ? { id: String(Date.now()), message } : null }),

        /**
         * Move the community to wherever the user actually is, preserving the
         * relative layout of everyone in it. This is what makes the app work
         * outside one neighbourhood: open it in any city and the map is
         * populated with plausible neighbours instead of being empty.
         */
        useDeviceLocation: async ({ silent = false } = {}) => {
          const point = await currentLocation();
          if (!point) {
            if (!silent) {
              set({
                toast: {
                  id: String(Date.now()),
                  message: 'Location permission declined. Using the default area.',
                },
              });
            }
            return false;
          }

          const label = await describeLocation(point);
          const from = get().community.anchor;
          const move = (p: LatLng) => rehome(p, from, point);

          set({
            community: { ...get().community, anchor: point, label },
            users: get().users.map((u) => ({ ...u, location: move(u.location) })),
            partners: get().partners.map((p) => ({ ...p, location: move(p.location) })),
            requests: get().requests.map((r) => ({ ...r, location: move(r.location) })),
            ...(silent
              ? {}
              : { toast: { id: String(Date.now()), message: `Community set to ${label}` } }),
          });
          return true;
        },

        updateProfile: ({ name, email }) => {
          const { currentUserId, users } = get();
          set({
            users: users.map((u) =>
              u.id === currentUserId
                ? {
                    ...u,
                    name: name?.trim() ? name.trim() : u.name,
                    email: email === undefined ? u.email : email?.trim() || null,
                  }
                : u
            ),
            toast: { id: String(Date.now()), message: 'Profile updated' },
          });
        },

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
              message: 'ID uploaded. Waiting on demo approval.',
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

        submitRequest: async (rawText, parsed) => {
          const { currentUserId, users, partners, requests, community } = get();

          // Geocoding is a real network/OS lookup now, so it is awaited before
          // the request is written rather than guessed from a lookup table.
          const geo = await geocodePlace(parsed.location_text, community.anchor);

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
            customLabel: parsed.customLabel ?? null,
          };

          set({ requests: [request, ...requests] });

          const what = categoryTitle(request.category, request.customLabel).toLowerCase();
          const matches = rankHelpers(request, users, currentUserId, partners);
          const chosen = pickAutoAccept(matches);

          void notify(
            currentUserId,
            'request_created',
            notices.requestCreated(what, matches.length),
            id
          );

          if (chosen && get().autoAcceptEnabled) {
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
              void notify(
                state.requests.find((r) => r.id === id)!.requesterId,
                'request_accepted',
                notices.requestAccepted(chosen.helper.name, what),
                id
              );
            }, AUTO_ACCEPT_MS);
          } else if (chosen) {
            // Helpers are in range but nobody has taken it yet. It stays open
            // on the map for a real person — switch personas and accept it.
            set({
              toast: {
                id: String(Date.now()),
                message: `Sent to ${matches.length} nearby helper${matches.length === 1 ? '' : 's'}`,
              },
            });
          } else {
            const partner = get().partners.find((p) => p.isEscalationPartner);
            set({
              requests: get().requests.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      status: 'open',
                      aiMatchReason: partner
                        ? `No nearby match yet. You can send this to ${partner.name}.`
                        : 'No nearby match yet.',
                    }
                  : r
              ),
              toast: {
                id: String(Date.now()),
                message: partner
                  ? `No helper matched yet. You can send this to ${partner.name}.`
                  : 'No helper matched yet.',
              },
            });
          }

          return id;
        },

        acceptRequest: async (requestId) => {
          const { currentUserId, users, partners, requests } = get();
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

          const what = categoryTitle(request.category, request.customLabel).toLowerCase();
          const matches = rankHelpers(request, users, request.requesterId, partners);
          const mine = matches.find((m) => m.helper.id === currentUserId);
          const reason =
            mine?.aiMatchReason ?? `You offer ${what} nearby (Tier ${me.trustTier})`;

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

          // Both sides hear about it: the requester that help is coming, the
          // helper as their own record of what they took on.
          const requester = users.find((u) => u.id === request.requesterId);
          void notify(
            request.requesterId,
            'request_accepted',
            notices.requestAccepted(me.name, what),
            requestId
          );
          void notify(
            currentUserId,
            'request_accepted',
            notices.helperAssigned(what, requester?.name ?? 'a neighbour'),
            requestId
          );

          return { ok: true };
        },

        confirmCompletion: async (requestId) => {
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

          const earnsPoints = both && !POINTS_EXCLUDED.includes(request.category);
          let nextUsers = users;
          if (earnsPoints) {
            nextUsers = users.map((u) => {
              if (u.id !== request.matchedHelperId) return u;
              const completedHelps = u.completedHelps + 1;
              return {
                ...u,
                completedHelps,
                points: u.points + POINTS_PER_HELP,
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
                ? 'Help confirmed. Points added.'
                : 'Marked complete. Waiting on the other person.',
            },
          });

          if (both) {
            const what = categoryTitle(request.category, request.customLabel).toLowerCase();
            const copy = notices.completed(what, earnsPoints ? POINTS_PER_HELP : 0);
            void notify(request.requesterId, 'request_completed', copy, requestId);
            void notify(request.matchedHelperId, 'request_completed', copy, requestId);
          }
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

        /**
         * Hand a request nobody took to the community's institution partner.
         * The partner is looked up by flag, not by a hardcoded id, so this
         * works for whichever organisation a given community has onboarded.
         */
        escalateToPartner: async (requestId) => {
          const { requests, users, partners } = get();
          const request = requests.find((r) => r.id === requestId);
          const partner = partners.find((p) => p.isEscalationPartner);
          if (!request || !partner) return;

          // Prefer a Tier 3 volunteer on that partner's roster.
          const volunteer =
            users.find(
              (u) =>
                u.partnerId === partner.id &&
                u.trustTier >= CATEGORY_MIN_TIER[request.category]
            ) ?? users.find((u) => u.partnerId === partner.id);
          if (!volunteer) return;

          set({
            requests: requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'matched',
                    matchedHelperId: volunteer.id,
                    aiMatchReason: `Sent to the ${partner.name} volunteer roster`,
                  }
                : r
            ),
            toast: {
              id: String(Date.now()),
              message: `Sent to ${partner.name}. ${volunteer.name} is assigned.`,
            },
          });

          const what = categoryTitle(request.category, request.customLabel).toLowerCase();
          void notify(
            request.requesterId,
            'escalated',
            notices.escalated(what, partner.name),
            requestId
          );
        },

        markNotificationsRead: () => {
          const { currentUserId, notifications } = get();
          set({
            notifications: notifications.map((n) =>
              n.userId === currentUserId ? { ...n, read: true } : n
            ),
          });
        },

        unreadCount: () => {
          const { currentUserId, notifications } = get();
          return notifications.filter((n) => n.userId === currentUserId && !n.read).length;
        },
      };
    },
    {
      // Bumped from v2: seeded coordinates were re-scattered and the stored
      // badge list was removed. Rehydrating v2 state would restore people at
      // the old out-of-ring positions and silently undo that fix, so the old
      // key is abandoned rather than migrated — it is demo data.
      name: 'barakah-demo-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        community: s.community,
        users: s.users,
        partners: s.partners,
        requests: s.requests,
        ratings: s.ratings,
        notifications: s.notifications,
        themePreference: s.themePreference,
        autoAcceptEnabled: s.autoAcceptEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
