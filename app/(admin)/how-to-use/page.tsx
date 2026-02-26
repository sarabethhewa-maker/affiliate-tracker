"use client";

import Link from "next/link";
import Image from "next/image";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
};

const cardStyle = {
  background: THEME.card,
  border: `1px solid ${THEME.border}`,
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
};
const headingStyle = { color: THEME.text, fontSize: 18, fontWeight: 700, marginBottom: 12, display: "flex" as const, alignItems: "center" as const, gap: 10 };
const bodyStyle = { color: THEME.textMuted, fontSize: 14, lineHeight: 1.6 };
const faqQ = { color: THEME.text, fontWeight: 600, fontSize: 14, marginBottom: 6 };
const faqA = { color: THEME.textMuted, fontSize: 13, marginBottom: 16 };

export default function HowToUsePage() {
  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text, padding: "32px 40px", maxWidth: 720 }}>
      <style>{`* { box-sizing: border-box; } a { color: ${THEME.accent}; text-decoration: none; } a:hover { text-decoration: underline; }`}</style>
      <Link href="/" style={{ display: "inline-block", marginBottom: 24, color: THEME.textMuted, fontSize: 13 }}>← Back to Dashboard</Link>
      <Image src="/biolongevity-logo.png" alt="Bio Longevity Labs" width={220} height={56} style={{ width: "auto", height: 48, objectFit: "contain", marginBottom: 16 }} />
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>How to Use AffiliateOS</h1>
      <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24 }}>Affiliate program — quick guide</p>

      <div style={{ background: "#e0f2fe", border: `1px solid ${THEME.accent}40`, borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <p style={{ color: THEME.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          <strong>All program rules</strong> like tier names, commission rates, and thresholds can be customized in <strong><Link href="/settings">Settings</Link></strong> — no code required.
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>🚀</span> Getting Started</h2>
        <p style={bodyStyle}>Add your first affiliate from the dashboard: click <strong style={{ color: THEME.text }}>+ Add Affiliate</strong>, enter name and email, choose tier and optionally who recruited them. You can also share the <strong style={{ color: THEME.accent }}>/join</strong> link so people can apply on their own (no login required). Approve or reject applications from the <strong>Affiliates</strong> tab — see &quot;Pending Approvals&quot; at the top.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>📋</span> Public Affiliate Signup (/join)</h2>
        <p style={bodyStyle}>The public page at <strong>/join</strong> lets anyone apply to become an affiliate without logging in. They fill in name, email, optional phone and social handle, how they heard about you, and an optional referral code (recruiter&apos;s affiliate ID). Submissions are created with status <strong>pending</strong>. In the Affiliates tab, use <strong>Approve</strong> to activate them and send the welcome email (and assign them under the recruiter if they used a referral code), or <strong>Reject</strong> to remove the application entirely.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>📊</span> Understanding Tiers</h2>
        <p style={bodyStyle}>Commission is based on <strong style={{ color: THEME.text }}>monthly sales volume</strong>. Default tiers: Silver, Gold, Master (you can rename and change rates in Settings). Tiers update automatically each month. The progress bar on each affiliate shows how close they are to the next tier.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>⚙️</span> Customizing Your Program</h2>
        <div style={bodyStyle}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: THEME.text }}>How to change tier names:</strong> Go to Settings → Tier Settings. Click the name field next to any tier and type a new name. Hit Save. The new name will appear everywhere in the dashboard immediately.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: THEME.text }}>How to change commission percentages:</strong> In Settings → Tier Settings, update the % fields for each tier. You can set the direct commission rate and the MLM override rates for level 2 and level 3 recruits separately.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: THEME.text }}>How to add a new tier:</strong> Click &quot;Add Tier&quot; in Settings → Tier Settings. Give it a name, set the commission rates and the monthly sales threshold required to reach it.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: THEME.text }}>How to change thresholds:</strong> In Settings → Threshold Settings, update the dollar amount required for each tier. Affiliates will be automatically moved up or down based on their current month&apos;s sales.</p>
          <p style={{ marginBottom: 0 }}><strong style={{ color: THEME.text }}>How to change program settings:</strong> In Settings → Program Settings you can update your program name, website, admin email for notifications, and how long tracking cookies last.</p>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>🌐</span> How MLM Works</h2>
        <p style={bodyStyle}>When one affiliate recruits another, they earn an override on the recruit&apos;s sales. Example: <strong>Darlene</strong> recruits <strong>Elliot</strong>. Elliot makes a $500 sale and earns his tier commission (e.g. 10% = $50). Darlene earns a Level 2 bonus (e.g. 3% of $500 = $15). The MLM Tree tab shows the full network of who recruited who.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>🔗</span> Tracking Links</h2>
        <p style={bodyStyle}>Each affiliate has two links: a <strong style={{ color: THEME.text }}>sales link</strong> (for customers) and a <strong style={{ color: THEME.text }}>recruit link</strong> (sends signups to /join with their referral code). Copy from the Affiliates tab. Clicks on the sales link are recorded. When a customer buys, log the sale in Conversion Status or via + Log Sale.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>💰</span> Recording Sales</h2>
        <p style={bodyStyle}>Go to <strong>Conversion Status</strong> and click <strong>+ Log Sale</strong>. Select the affiliate, enter the sale amount, optional date and note. The conversion is created as &quot;pending&quot; — you can Approve it, then Mark paid when you&apos;ve sent the payout. This updates the affiliate&apos;s revenue and their volume-based tier.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>💳</span> Paying Affiliates</h2>
        <p style={bodyStyle}>On the <strong>Payouts</strong> tab you see unpaid vs paid balance per affiliate. Click <strong>Pay Now</strong> to open a modal: amount is pre-filled, choose payment method (PayPal, Venmo/Zelle, Bank Transfer), add a reference, then Confirm. The payout is recorded and approved conversions are marked paid.</p>
      </div>

      <div style={cardStyle}>
        <h2 style={headingStyle}><span style={{ fontSize: 20 }}>❓</span> FAQs</h2>
        <div style={bodyStyle}>
          <p style={faqQ}>How do I add an affiliate?</p>
          <p style={faqA}>Click + Add Affiliate on the dashboard, or share /join so they can apply; you approve from the Affiliates tab (Pending Approvals). Approve sends welcome email and links; Reject removes the application.</p>
          <p style={faqQ}>When does an affiliate&apos;s tier change?</p>
          <p style={faqA}>Tiers are based on current calendar month revenue. At the start of each month everyone resets toward Silver until they make sales again.</p>
          <p style={faqQ}>What&apos;s the difference between the two links?</p>
          <p style={faqA}>The sales link sends customers to your store and tracks clicks/sales. The recruit link sends new signups to /join and attaches them under that affiliate when they enter the referral code.</p>
          <p style={faqQ}>How do I mark a conversion as paid?</p>
          <p style={faqA}>Use Pay Now on the Payouts tab (marks approved conversions as paid and records the payout), or in Conversion Status click &quot;Mark paid&quot; on individual approved conversions.</p>
          <p style={faqQ}>Can I see who recruited who?</p>
          <p style={faqA}>Yes. Open the MLM Tree tab for a visual hierarchy, or on the Affiliates tab each card shows &quot;Referred by [name]&quot; and &quot;Signed up N referrals.&quot;</p>
        </div>
      </div>
    </div>
  );
}
