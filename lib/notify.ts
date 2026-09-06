import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { sendEmail, type EmailStatus } from '@/lib/email';
import type { AppNotification, NotificationKind } from '@/types/barakah';

/**
 * Raising a notice.
 *
 * One notice goes out on three channels, each of which is allowed to fail
 * independently: a device notification, an email, and an in-app record. The
 * record is the only one guaranteed to land, which is why the delivery
 * outcome is stored on it — the UI shows what actually happened rather than
 * asserting "email sent" on faith.
 *
 * A note on push: local notifications work in Expo Go. Remote push does not,
 * on iOS, since SDK 53 — that needs a development build. Everything here is
 * local, so it works in Expo Go today and keeps working in a native build.
 */

let handlerInstalled = false;
let permissionGranted: boolean | null = null;

function installHandler() {
  if (handlerInstalled) return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask once for notification permission. Safe to call repeatedly; safe on web,
 * where it resolves to false rather than throwing.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (permissionGranted !== null) return permissionGranted;
  if (Platform.OS === 'web') {
    permissionGranted = false;
    return false;
  }
  try {
    installHandler();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    permissionGranted = status === 'granted';
    return permissionGranted;
  } catch {
    permissionGranted = false;
    return false;
  }
}

async function pushLocal(title: string, body: string): Promise<boolean> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      // null fires it immediately.
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

export interface NoticeInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  requestId?: string | null;
  /** Recipient address; omit to skip the email channel. */
  email?: string | null;
}

/**
 * Deliver a notice and return the record to store. Never throws — a failed
 * email must not take down an accept.
 */
export async function raiseNotice(input: NoticeInput): Promise<AppNotification> {
  const pushed = await pushLocal(input.title, input.body);

  let emailStatus: EmailStatus | 'none' = 'none';
  let emailedTo: string | null = null;

  if (input.email) {
    const result = await sendEmail({
      to: input.email,
      subject: input.title,
      body: `${input.body}\n\n— Barakah`,
    });
    emailStatus = result.status;
    emailedTo = result.status === 'sent' ? input.email : null;
    if (result.status !== 'sent') {
      console.log(`[barakah] email ${result.status}: ${result.detail ?? ''}`);
    }
  }

  return {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    requestId: input.requestId ?? null,
    createdAt: new Date().toISOString(),
    read: false,
    pushed,
    emailedTo,
    emailStatus,
  };
}

/* ---------------------------------------------------------------- copy ---- */
/* Notice text lives here so the wording stays consistent wherever it is
   raised, and so it can be reviewed in one place rather than hunted through
   the store. */

export const notices = {
  requestCreated: (what: string, count: number) => ({
    title: 'Request sent',
    body:
      count > 0
        ? `Your request for ${what} went out to ${count} nearby helper${count === 1 ? '' : 's'}. We'll tell you the moment someone accepts.`
        : `Your request for ${what} is live. No one is in range yet — you can widen it or send it to a partner.`,
  }),

  requestAccepted: (helperName: string, what: string) => ({
    title: `${helperName} accepted`,
    body: `${helperName} is helping with your ${what}. Their contact details are now in the request.`,
  }),

  helperAssigned: (what: string, requesterLabel: string) => ({
    title: 'You accepted a request',
    body: `You're helping ${requesterLabel} with ${what}. Their contact details are now shared with you.`,
  }),

  completed: (what: string, points: number) => ({
    title: 'Help confirmed',
    body: points
      ? `Both sides confirmed the ${what}. You earned ${points} points.`
      : `Both sides confirmed the ${what}. Thank you.`,
  }),

  escalated: (what: string, partnerName: string) => ({
    title: 'Sent to a partner',
    body: `No neighbour was free, so your ${what} went to ${partnerName}'s volunteer roster.`,
  }),
};
