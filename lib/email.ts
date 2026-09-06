/**
 * Sending an email from a client-only app.
 *
 * Barakah has no server, so there is nowhere to hide a secret. Two providers
 * are supported and both are designed for exactly this situation:
 *
 *   EmailJS  — built for browser/app senders. Its public key is meant to be
 *              public; the template lives server-side at EmailJS.
 *   Resend   — a normal REST API. Only use this if you accept that the key is
 *              readable by anyone with the bundle. Fine for a demo, not for
 *              production. There is a warning below for exactly this reason.
 *
 * With neither configured, sending is skipped and reported as skipped. The app
 * still records the notice so the flow is demonstrable — it simply never
 * claims an email was delivered when it was not.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export type EmailStatus = 'sent' | 'skipped' | 'failed';

export interface EmailResult {
  status: EmailStatus;
  detail?: string;
}

const EMAILJS_SERVICE = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
const RESEND_KEY = process.env.EXPO_PUBLIC_RESEND_API_KEY;
const RESEND_FROM = process.env.EXPO_PUBLIC_RESEND_FROM ?? 'Barakah <onboarding@resend.dev>';

export function emailConfigured(): boolean {
  return Boolean((EMAILJS_SERVICE && EMAILJS_TEMPLATE && EMAILJS_KEY) || RESEND_KEY);
}

export function emailProviderName(): string | null {
  if (EMAILJS_SERVICE && EMAILJS_TEMPLATE && EMAILJS_KEY) return 'EmailJS';
  if (RESEND_KEY) return 'Resend';
  return null;
}

async function viaEmailJs(msg: EmailMessage): Promise<EmailResult> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE,
      template_id: EMAILJS_TEMPLATE,
      user_id: EMAILJS_KEY,
      template_params: {
        to_email: msg.to,
        subject: msg.subject,
        message: msg.body,
      },
    }),
  });
  if (!res.ok) {
    return { status: 'failed', detail: `EmailJS ${res.status}: ${(await res.text()).slice(0, 120)}` };
  }
  return { status: 'sent', detail: 'EmailJS' };
}

async function viaResend(msg: EmailMessage): Promise<EmailResult> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [msg.to],
      subject: msg.subject,
      text: msg.body,
    }),
  });
  if (!res.ok) {
    return { status: 'failed', detail: `Resend ${res.status}: ${(await res.text()).slice(0, 120)}` };
  }
  return { status: 'sent', detail: 'Resend' };
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (!msg.to?.includes('@')) {
    return { status: 'skipped', detail: 'no email address on file' };
  }
  if (!emailConfigured()) {
    return { status: 'skipped', detail: 'no email provider configured' };
  }

  try {
    if (EMAILJS_SERVICE && EMAILJS_TEMPLATE && EMAILJS_KEY) return await viaEmailJs(msg);
    return await viaResend(msg);
  } catch (err) {
    return {
      status: 'failed',
      detail: err instanceof Error ? err.message : 'network error',
    };
  }
}
