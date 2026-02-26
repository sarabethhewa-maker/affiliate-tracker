import { Resend } from 'resend';
import { getSettings } from '@/lib/settings';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const LOGO_URL = 'https://affiliate-tracker-psi.vercel.app/logo.png';
const EMAIL_LOGO_HTML = `<div style="text-align:center;margin-bottom:16px"><img src="${LOGO_URL}" alt="Biolongevity Labs" style="height:50px;width:auto;" /></div>`;

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
    html: `${EMAIL_LOGO_HTML}<p><strong>Alert:</strong> ${message}</p><p>Affiliate: ${affiliateName}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/">Open dashboard</a></p>`,
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
    html: EMAIL_LOGO_HTML + html,
  });
}

export async function sendAffiliateWelcome(
  name: string,
  email: string,
  salesLink: string,
  recruitLink: string,
  opts?: { tierName?: string; commissionRate?: number; portalUrl?: string }
) {
  if (!resend) return;
  const tierName = opts?.tierName ?? 'Silver';
  const rate = opts?.commissionRate ?? 10;
  const portalUrl = opts?.portalUrl ?? (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/portal` : '/portal');
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're in! Welcome to the Biolongevity Labs Affiliate Program",
    html: `${EMAIL_LOGO_HTML}<p>Hi ${name},</p><p>You're in! Welcome to the Biolongevity Labs Affiliate Program.</p><p><strong>Your tier:</strong> ${tierName} (${rate}% commission on sales)</p><p><strong>Sales link</strong> (share with customers):<br/><a href="${salesLink}">${salesLink}</a></p><p><strong>Recruit link</strong> (share to sign up new affiliates under you):<br/><a href="${recruitLink}">${recruitLink}</a></p><p>Sign in anytime at <a href="${portalUrl}">${portalUrl}</a> to view your dashboard, earnings, and team.</p><p>Welcome!</p>`,
  });
}

export async function sendAffiliateRejection(name: string, email: string) {
  if (!resend) return;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Biolongevity Labs Affiliate Program — Application update',
    html: `${EMAIL_LOGO_HTML}<p>Hi ${name},</p><p>Thank you for your interest in the Biolongevity Labs Affiliate Program. After review, we're unable to approve your application at this time.</p><p>If you have questions, please reply to this email.</p><p>Best,<br/>Biolongevity Labs Team</p>`,
  });
}
