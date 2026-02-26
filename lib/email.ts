import { Resend } from 'resend';
import { getSettings } from '@/lib/settings';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

async function getAdminTo(): Promise<string> {
  const settings = await getSettings();
  if (settings.adminEmails?.trim()) {
    const first = settings.adminEmails.split(',')[0]?.trim();
    if (first) return first;
  }
  return settings.adminEmail || ADMIN_EMAIL || '';
}

export async function sendAdminNewSignup(name: string, email: string) {
  if (!resend) return;
  const to = await getAdminTo();
  if (!to) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `[Affiliate] New signup: ${name}`,
    html: `<p>New affiliate application:</p><p><strong>${name}</strong> — ${email}</p><p>Log in to the dashboard to approve or reject.</p>`,
  });
}

export async function sendAlertEmail(affiliateName: string, message: string) {
  if (!resend) return;
  const to = await getAdminTo();
  if (!to) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `[Affiliate Tracker] Fraud / Anomaly Alert`,
    html: `<p><strong>Alert:</strong> ${message}</p><p>Affiliate: ${affiliateName}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/">Open dashboard</a></p>`,
  });
}

export async function sendWeeklyDigest(html: string) {
  if (!resend) return;
  const to = await getAdminTo();
  if (!to) return;
  await resend.emails.send({
    from: FROM,
    to,
    subject: '[Affiliate Tracker] Weekly digest',
    html,
  });
}

export async function sendAffiliateWelcome(name: string, email: string, salesLink: string, recruitLink: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're approved — Bio Longevity Affiliate",
    html: `<p>Hi ${name},</p><p>You're approved as an affiliate. Here are your links:</p><p><strong>Sales link</strong> (share with customers):<br/><a href="${salesLink}">${salesLink}</a></p><p><strong>Recruit link</strong> (share to sign up new affiliates under you):<br/><a href="${recruitLink}">${recruitLink}</a></p><p>You earn a % of sales from your referrals. Welcome!</p>`,
  });
}
