"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

const THEME = {
  bg: "#ffffff",
  bgAlt: "#f8f9fa",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a2e",
  textMuted: "#4a5568",
  accent: "#1a4a8a",
  accentSecondary: "#f0c040",
  shadow: "0 1px 3px rgba(0,0,0,0.06)",
};

type FaqItem = { q: string; a: string };
type FaqSection = { id: string; title: string; items: FaqItem[] };

const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "faq-dashboard",
    title: "Dashboard",
    items: [
      {
        q: "What do the dashboard stats mean?",
        a: "**Total Revenue** is the sum of all conversion amounts in the selected period. **Link Clicks** counts every visit to an affiliate's tracking link. **Conversions** is the number of sales attributed to affiliates. **Affiliates** is your total active affiliate count. All stats respect the period filter (Today, This Week, This Month, This Year, All Time).",
      },
      {
        q: "How do the date filters work?",
        a: "Use the **Period** buttons (Today, This Week, This Month, This Year, All Time) above the stats. They filter the dashboard revenue, clicks, conversions, and the **Top Performers** and **Top Products** lists. The activity feed and fraud alerts are not filtered by period.",
      },
      {
        q: "What is the activity feed?",
        a: "The **Activity** section on the Dashboard shows recent events: new conversions, affiliate approvals, tier upgrades, and payouts. It helps you see what's happening in your program at a glance.",
      },
      {
        q: "How does the top performers list work?",
        a: "**Top Performers** lists the top 5 affiliates by revenue in the selected date period. Each row shows rank, name, tier badge, and revenue. It's sorted by sales in that period only.",
      },
    ],
  },
  {
    id: "faq-affiliates",
    title: "Affiliates",
    items: [
      {
        q: "How do I add a new affiliate?",
        a: "Click **+ Add Affiliate** on the Dashboard or in the **Affiliates** tab. Enter name and email, choose tier and optionally who recruited them, then save. You can also share the **/join** link so people apply; you then approve or reject from the Affiliates tab (see Pending Applications).",
      },
      {
        q: "How do I approve or reject an application?",
        a: "Pending applications appear at the top of the **Affiliates** tab (and in the Dashboard when there are pending applicants). Click **Approve** to activate the affiliate and send the welcome email; they'll be linked to the recruiter if they used a referral code. Click **Reject** to decline (you can optionally send a rejection email).",
      },
      {
        q: "How do I view an affiliate's details?",
        a: "In the **Affiliates** tab, each card shows name, email, tier, status, tracking and recruit links, coupon code, conversions, and payouts. Click **View as Affiliate** to open their portal view, or use the expandable area on the card for more info and fraud flags.",
      },
      {
        q: "How do I edit an affiliate's contact info or social links?",
        a: "Open the affiliate card in the **Affiliates** tab. Use the **Edit** controls next to phone, social handle, and the social URL fields (Instagram, TikTok, YouTube, website) to update. Save changes when prompted.",
      },
      {
        q: "How do I change an affiliate's tracking slug?",
        a: "On the affiliate card, click **Edit slug** next to the sales link. Enter the new slug (e.g. jane) and check availability. Save to apply. Their new sales link becomes **yoursite.com/ref/jane**; the legacy link (api/ref/id) continues to work.",
      },
      {
        q: "What happens to old links when I change a slug?",
        a: "The **legacy** link (e.g. **yoursite.com/api/ref/[id]**) always continues to work. When you set a custom slug, the new link **yoursite.com/ref/slug** is the preferred one; both attribute clicks and sales to the same affiliate.",
      },
      {
        q: "How do I archive an affiliate?",
        a: "On the affiliate card, click **Archive**. Archived affiliates are hidden from the active list by default (toggle **Show Archived** to see them). Their data is preserved; they no longer earn new commissions or appear in active counts.",
      },
      {
        q: "How do I delete an affiliate?",
        a: "On the affiliate card, use the **Delete** action (often in a menu or at the bottom of the card). You'll be asked to confirm. Deletion removes the affiliate and all related data (clicks, conversions, payouts, etc.) and cannot be undone.",
      },
      {
        q: "How do I bulk delete affiliates?",
        a: "In the **Affiliates** tab, check the boxes for the affiliates you want, or use **Select All**. When at least one is selected, a floating bar appears. Click **Bulk Delete**, follow the two-step confirmation (warning then typing **DELETE [X] AFFILIATES** exactly), then confirm. Progress is shown; the list refreshes when done.",
      },
      {
        q: "What's the difference between archive and delete?",
        a: "**Archive** hides the affiliate from the active list and stops new commissions; historical data is kept. **Delete** permanently removes the affiliate and all their data (clicks, conversions, payouts, slug history, fraud flags). Use archive to pause someone; use delete to clear test data or fully remove a record.",
      },
    ],
  },
  {
    id: "faq-commission-tiers",
    title: "Commission Tiers",
    items: [
      {
        q: "How do commission tiers work?",
        a: "Each affiliate has a tier (e.g. Silver, Gold, Master) based on their **current calendar month** sales volume. The tier determines their direct commission % on sales and their Level 2 / Level 3 override % on recruits' sales. Tiers are recalculated automatically when conversions are added or when you run tier updates.",
      },
      {
        q: "What are the tier thresholds?",
        a: "Go to **Settings & Customization** → **Threshold Settings** (or Tier Settings, depending on layout). Each tier has a monthly sales threshold (e.g. $0, $500, $2000). An affiliate's tier is the highest tier whose threshold they meet this month.",
      },
      {
        q: "How do automatic tier upgrades work?",
        a: "Tiers are based on the current month's revenue. When new conversions are recorded (via WooCommerce webhook or manual **+ Log Sale**), the system recalculates each affiliate's volume and updates their tier. At the start of each month, everyone effectively resets toward the lowest tier until they make sales again.",
      },
      {
        q: "How do I manually override a tier?",
        a: "The system uses volume-based tiers by default. If your settings support a manual override field on the affiliate, you can set it there; otherwise tier is driven solely by monthly revenue. Check **Settings** → **Tier Settings** for tier names and rates.",
      },
      {
        q: "What are Level 2 override commissions?",
        a: "When an affiliate recruits another (Level 2), the recruiter earns a percentage of the recruit's sales—the **Level 2 (MLM)** rate set in **Settings** → **Tier Settings** for each tier. Level 3 overrides work the same for one more level down. These are in addition to the recruit's own direct commission.",
      },
    ],
  },
  {
    id: "faq-mlm",
    title: "MLM Tree",
    items: [
      {
        q: "What does the MLM tree show?",
        a: "The **MLM Tree** tab shows the full network hierarchy: who recruited whom. Each affiliate appears under their recruiter (parent). You can see the structure at a glance and how many levels deep the network goes.",
      },
      {
        q: "How do I see an affiliate's downline?",
        a: "In the **MLM Tree** tab, the tree is rendered recursively: each affiliate's **downline** (recruits) are listed under them. On the **Affiliates** tab, each card shows **Referred by [name]** and **Signed up N referrals** so you can see direct recruits there too.",
      },
      {
        q: "How does the referral structure work?",
        a: "When someone applies via **/join** and enters a **referral code** (the recruiter's affiliate ID or code), they are linked as that affiliate's recruit. The recruiter then earns Level 2 (and optionally Level 3) override commissions on the recruit's sales, as set in **Settings** → **Tier Settings**.",
      },
    ],
  },
  {
    id: "faq-import",
    title: "Import Affiliates",
    items: [
      {
        q: "How do I import affiliates from a CSV?",
        a: "Go to the **Import Affiliates** tab. Choose **CSV**, upload your file or paste CSV data, then map columns to fields (Name, Email, Phone, Tier, etc.). Set **Skip duplicates** and **Default status** (active/pending), then run the import. Results show how many were imported, updated, or skipped.",
      },
      {
        q: "What format should the CSV be in?",
        a: "Use a header row with column names. The importer lets you map columns to: name, email, phone, tier, social_handle, website_url, coupon_code, referred_by_email, notes, etc. A template is available on the Import tab; common format is: name, email, phone, tier, social_handle, website_url, coupon_code, referred_by_email, notes.",
      },
      {
        q: "How do I import from TapAffiliate/GoAffPro/Tune?",
        a: "In the **Import Affiliates** tab, select **TapAffiliate**, **GoAffPro**, or **Tune**. Enter the required API credentials (and network ID for Tune). Connect to fetch the list of affiliates, then run the import. The same column mapping and duplicate/skip options apply where relevant.",
      },
    ],
  },
  {
    id: "faq-payouts",
    title: "Payouts",
    items: [
      {
        q: "How do I pay an affiliate?",
        a: "Go to the **Payouts** tab. Find the affiliate and click **Pay Now**. The amount is pre-filled from their approved (unpaid) commission. Choose payment method (PayPal, Venmo/Zelle, Bank Transfer, Tipalti), add a reference note, and confirm. The payout is recorded and approved conversions are marked paid.",
      },
      {
        q: "How does Tipalti mass payout work?",
        a: "In **Payouts**, click **Mass Payout**. Select the affiliates you want to pay (only those with Tipalti status **active** and a balance are eligible). Submit to send payouts through Tipalti in bulk. Configure your Tipalti API and webhook (**Settings** → **Tipalti**) so payment status (confirmed/failed) is recorded.",
      },
      {
        q: "What is store credit?",
        a: "**Store credit** is a balance you can give to an affiliate for use on your store (e.g. as a bonus or reward). It's shown on the Payouts tab and in the affiliate portal. It does not replace commission payouts; it's a separate balance you manage.",
      },
      {
        q: "How do I give store credit?",
        a: "On the **Payouts** tab, find the affiliate and click **Give Store Credit**. Enter the amount and confirm. The balance is added to their store credit total. Affiliates see it in their portal under Payouts / earnings.",
      },
    ],
  },
  {
    id: "faq-tracking",
    title: "Tracking & WooCommerce",
    items: [
      {
        q: "How does affiliate tracking work?",
        a: "When a customer clicks an affiliate's link (**yoursite.com/ref/slug** or **yoursite.com/api/ref/id**), a click is recorded and a cookie (and optionally localStorage) stores the affiliate reference. At checkout, the store sends that reference (e.g. **_bll_affiliate_ref**) so the WooCommerce webhook can attribute the order to the affiliate and create a conversion.",
      },
      {
        q: "How do I set up the WooCommerce webhook?",
        a: "In WooCommerce go to **Settings** → **Advanced** → **Webhooks**. Create a webhook for **Order updated**. Set the delivery URL to **https://your-domain.com/api/webhooks/woocommerce**. Set the same secret in **Settings** → **WooCommerce** (or as **WOOCOMMERCE_WEBHOOK_SECRET** in .env.local). When orders are completed (or refunded), the webhook creates or updates conversions.",
      },
      {
        q: "How do I install the tracking snippet?",
        a: "Go to **Settings & Customization** → **Tracking** (or WooCommerce/tracking section). Copy the script URL or the **&lt;script&gt;** tag shown there. Add it to your store's header (or via Google Tag Manager). The snippet reads **?ref=** or **?affiliate=** from the URL, saves the affiliate ref in a cookie and localStorage, and adds it to checkout as **_bll_affiliate_ref** so the webhook can attribute orders.",
      },
      {
        q: "How does coupon code tracking work?",
        a: "Each affiliate can have a **coupon code** (e.g. JANE15). When a WooCommerce order contains that coupon, the webhook matches the order to the affiliate by coupon code if no click/cookie ref is present. Set or edit the coupon on the affiliate card in the **Affiliates** tab.",
      },
      {
        q: "What happens when an order is refunded?",
        a: "When the WooCommerce webhook receives an order with status **refunded**, the system deletes the matching conversion (if any) and recalculates tiers. The affiliate no longer gets commission for that order.",
      },
    ],
  },
  {
    id: "faq-leaderboard",
    title: "Leaderboard",
    items: [
      {
        q: "How does the leaderboard work?",
        a: "The **Leaderboard** tab ranks affiliates by your choice of: **This Month** (sales in current month), **All Time** (total sales), or **Most Recruits** (number of recruits). Top 3 get special styling (gold, silver, bronze).",
      },
      {
        q: "What metrics are shown?",
        a: "Each row shows rank, affiliate name, tier badge, and the primary metric: sales this month, total sales, or recruit count depending on the selected mode. Revenue is shown in dollars; recruit count is the number of direct recruits.",
      },
    ],
  },
  {
    id: "faq-announcements",
    title: "Announcements",
    items: [
      {
        q: "How do I post an announcement?",
        a: "Go to the **Announcements** tab. Click **New Announcement**. Enter a title and message, set **Priority** (normal, important, urgent), optionally **Pin** and an **Expires** date, then click **Publish**. Affiliates see active announcements in their portal.",
      },
      {
        q: "How do affiliates see announcements?",
        a: "Affiliates see announcements on their **Portal** dashboard and on the **Announcements** page (**/portal/announcements**). Only announcements that are published and not yet expired are shown. Pinned and high-priority ones are emphasized.",
      },
      {
        q: "What are priority levels?",
        a: "Announcements can be **normal**, **important**, or **urgent**. Urgent and important use stronger colors (e.g. red for urgent, blue for important) so affiliates notice them first. Pinned announcements stay at the top.",
      },
    ],
  },
  {
    id: "faq-fraud",
    title: "Fraud Detection",
    items: [
      {
        q: "What does fraud detection check for?",
        a: "The system can flag suspicious activity such as click anomalies (e.g. many clicks from one IP), IP abuse, or other patterns. **Fraud Alerts** appear on the Dashboard when there are unresolved flags. Each flag has a type, description, severity (e.g. high, medium), and is tied to an affiliate.",
      },
      {
        q: "How do I resolve a fraud flag?",
        a: "On the Dashboard, expand **Fraud Alerts** and click **Resolve** on a flag. Add a note (e.g. \"Reviewed, legitimate traffic\") and click **Mark as Resolved**. The flag is then marked resolved and no longer counts as unresolved.",
      },
      {
        q: "How do I run a manual fraud scan?",
        a: "On the Dashboard, expand **Fraud Alerts**. Click **Run fraud scan**. The system runs checks across affiliates and creates or updates fraud flags. When done, refresh to see new or updated flags.",
      },
    ],
  },
  {
    id: "faq-tax",
    title: "Tax & Compliance",
    items: [
      {
        q: "How does W9 collection work?",
        a: "Dedicated W9 collection flows are not built into the app. Use Tipalti or your payment provider for tax forms where required. Affiliate data can be exported via **Export** (affiliates/payouts) for your records.",
      },
      {
        q: "How do I export 1099 data?",
        a: "Use the **Export** options (e.g. **Export Affiliates**, **Export Payouts**) to get affiliate and payout data. There is no built-in 1099 form generator; use the exported data with your accounting or tax software.",
      },
      {
        q: "How does the affiliate agreement work?",
        a: "The public **/join** application form can include an affiliate agreement (e.g. terms and conditions). Applicants agree when they submit. The exact wording is in your join form and message templates; there is no separate agreement signing flow in the app.",
      },
    ],
  },
  {
    id: "faq-settings",
    title: "Settings",
    items: [
      {
        q: "How do I change tier names and rates?",
        a: "Go to **Settings & Customization** → **Tier Settings**. Edit tier names and commission percentages (direct, Level 2, Level 3). Use **Threshold Settings** to set the monthly sales amount required for each tier. Click **Save** to apply.",
      },
      {
        q: "How do I set up email marketing (Klaviyo/Mailchimp)?",
        a: "In **Settings** → **Email Marketing**, choose **Klaviyo** or **Mailchimp**. Enter API key and Affiliate List ID (and for Mailchimp, server prefix e.g. us19). Use **Test Connection** and **Sync All Affiliates** to push active affiliates. Syncing also runs when you approve an affiliate, when their tier changes, or when you send a payout.",
      },
      {
        q: "How do I manage admin access emails?",
        a: "Go to **Settings & Customization** → **Program Settings**. Set **Admin emails** (comma-separated) or **Admin notification email**. Only these emails can access the admin dashboard (/, /dashboard, /dashboard/settings, /dashboard/how-to-use). If no admin is set, you can use **FIRST_ADMIN_EMAIL** in .env.local once, then add your email in Settings.",
      },
      {
        q: "What is the Danger Zone?",
        a: "At the bottom of **Settings & Customization**, click **Show Danger Zone** to expand. The **Danger Zone** contains **Delete All Affiliates**—a nuclear option that permanently deletes all affiliates and all related data (clicks, conversions, payouts, etc.). It uses a multi-step confirmation and is intended for clearing test data before going live. Admin settings, announcements, and message templates are not deleted.",
      },
    ],
  },
  {
    id: "faq-chat",
    title: "AI Chatbot",
    items: [
      {
        q: "What can the AI chatbot help with?",
        a: "The admin chatbot answers questions about the dashboard: top performers, commission settings, approving affiliates, revenue, exports, and how to use admin tools. It's shown in the bottom-right corner when you're in the admin dashboard. Ask in plain language for quick answers.",
      },
      {
        q: "Why is the chatbot showing an error?",
        a: "The chatbot requires an **Anthropic API key** (ANTHROPIC_API_KEY in .env). If it's missing or invalid, you'll see a message that chat is not configured or that the request failed. Add the key in your environment and redeploy if needed.",
      },
    ],
  },
];

function renderAnswer(text: string): React.ReactNode {
  const parts: (string | React.ReactElement)[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    const boldStart = remaining.indexOf("**");
    if (boldStart === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, boldStart));
    const boldEnd = remaining.indexOf("**", boldStart + 2);
    if (boldEnd === -1) {
      parts.push(remaining.slice(boldStart));
      break;
    }
    parts.push(<strong key={parts.length} style={{ color: THEME.text, fontWeight: 700 }}>{remaining.slice(boldStart + 2, boldEnd)}</strong>);
    remaining = remaining.slice(boldEnd + 2);
  }
  return <>{parts.map((p, i) => (typeof p === "string" ? <span key={i}>{p}</span> : p))}</>;
}

export default function HowToUsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const mainRef = useRef<HTMLDivElement>(null);

  const gettingStartedId = "getting-started";
  const sectionIds = useMemo(() => [gettingStartedId, ...FAQ_SECTIONS.map((s) => s.id)], []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.getAttribute("data-section-id");
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_SECTIONS;
    const q = searchQuery.toLowerCase();
    return FAQ_SECTIONS.filter((sec) => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchItems = sec.items.some((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
      return matchTitle || matchItems;
    }).map((sec) => ({
      ...sec,
      items: sec.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter((sec) => sec.items.length > 0 || sec.title.toLowerCase().includes(q));
  }, [searchQuery]);

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id] ?? document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileTocOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: THEME.bgAlt,
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: THEME.text,
        display: "flex",
        flexDirection: "row",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        a { color: ${THEME.accent}; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .how-to-use-accordion { transition: max-height 0.25s ease-out, opacity 0.2s; }
      `}</style>

      {/* TOC - desktop fixed sidebar */}
      <aside
        style={{
          position: "sticky",
          top: 24,
          width: 220,
          flexShrink: 0,
          padding: "24px 16px",
          background: THEME.card,
          borderRight: `1px solid ${THEME.border}`,
          boxShadow: THEME.shadow,
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          display: "none",
        }}
        className="how-to-use-toc-desktop"
      >
        <nav style={{ fontSize: 12, fontWeight: 700, color: THEME.textMuted, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
          On this page
        </nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <button
              type="button"
              onClick={() => scrollToSection(gettingStartedId)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                borderRadius: 6,
                border: "none",
                background: activeSection === gettingStartedId ? `${THEME.accent}18` : "transparent",
                color: activeSection === gettingStartedId ? THEME.accent : THEME.textMuted,
                fontWeight: activeSection === gettingStartedId ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Getting Started
            </button>
          </li>
          {FAQ_SECTIONS.map((sec) => (
            <li key={sec.id} style={{ marginBottom: 6 }}>
              <button
                type="button"
                onClick={() => scrollToSection(sec.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: activeSection === sec.id ? `${THEME.accent}18` : "transparent",
                  color: activeSection === sec.id ? THEME.accent : THEME.textMuted,
                  fontWeight: activeSection === sec.id ? 700 : 400,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {sec.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main
        ref={mainRef}
        style={{
          flex: 1,
          minWidth: 0,
          padding: "24px 32px 80px",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <Link href="/dashboard" style={{ display: "inline-block", marginBottom: 16, color: THEME.textMuted, fontSize: 13 }}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: THEME.text }}>
          How to Use — Admin Guide
        </h1>
        <p style={{ color: THEME.textMuted, fontSize: 14, marginBottom: 24 }}>
          Getting started and reference for all features.
        </p>

        {/* Search */}
        <div style={{ marginBottom: 32 }}>
          <label htmlFor="how-to-search" style={{ display: "block", fontSize: 12, fontWeight: 600, color: THEME.textMuted, marginBottom: 8 }}>
            Search FAQs
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: THEME.textMuted, fontSize: 16 }} aria-hidden>🔍</span>
            <input
              id="how-to-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions and answers..."
              style={{
                width: "100%",
                padding: "12px 14px 12px 44px",
                border: `1px solid ${THEME.border}`,
                borderRadius: 10,
                fontSize: 14,
                background: THEME.card,
                color: THEME.text,
              }}
            />
          </div>
        </div>

        {/* Mobile TOC dropdown */}
        <div style={{ marginBottom: 24, display: "block" }} className="how-to-use-toc-mobile">
          <button
            type="button"
            onClick={() => setMobileTocOpen((o) => !o)}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${THEME.border}`,
              borderRadius: 10,
              background: THEME.card,
              color: THEME.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            Jump to section
            <span style={{ fontSize: 12, color: THEME.textMuted }}>{mobileTocOpen ? "▲" : "▼"}</span>
          </button>
          {mobileTocOpen && (
            <div style={{ marginTop: 8, padding: 12, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 10, boxShadow: THEME.shadow }}>
              <button type="button" onClick={() => scrollToSection(gettingStartedId)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: THEME.text }}>Getting Started</button>
              {FAQ_SECTIONS.map((sec) => (
                <button key={sec.id} type="button" onClick={() => scrollToSection(sec.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, color: THEME.text }}>
                  {sec.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started */}
        <section
          ref={(el) => { sectionRefs.current[gettingStartedId] = el; }}
          data-section-id={gettingStartedId}
          id={gettingStartedId}
          style={{ marginBottom: 48 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: THEME.text, borderBottom: `2px solid ${THEME.accent}`, paddingBottom: 8 }}>
            Getting Started in 5 Minutes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { step: 1, title: "Understanding the Dashboard", desc: "Learn what the stats (revenue, clicks, conversions, affiliates) mean and how to use the date filters (Today, Week, Month, Year, All Time).", linkId: "faq-dashboard" },
              { step: 2, title: "Your First Affiliate", desc: "Add an affiliate manually with + Add Affiliate or share /join for applications; approve or reject from the Affiliates tab.", linkId: "faq-affiliates" },
              { step: 3, title: "Setting Up Tracking", desc: "Connect WooCommerce via webhook and install the tracking snippet so orders are attributed to affiliates.", linkId: "faq-tracking" },
              { step: 4, title: "Managing Commissions", desc: "Tiers are based on monthly sales volume and update automatically; override rates are set in Settings.", linkId: "faq-commission-tiers" },
              { step: 5, title: "Paying Your Affiliates", desc: "Use Pay Now on the Payouts tab or Tipalti Mass Payout; optionally give store credit.", linkId: "faq-payouts" },
            ].map(({ step, title, desc, linkId }) => (
              <div key={step} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20, boxShadow: THEME.shadow }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: THEME.accent, letterSpacing: 1, marginBottom: 6 }}>STEP {step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: THEME.text }}>{title}</h3>
                <p style={{ color: THEME.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{desc}</p>
                <button type="button" onClick={() => scrollToSection(linkId)} style={{ padding: "6px 12px", background: "none", border: `1px solid ${THEME.accent}`, borderRadius: 6, color: THEME.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Learn more →</button>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ sections - accordion */}
        {filteredSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const hasItems = section.items.length > 0;
          return (
            <section
              key={section.id}
              ref={(el) => { sectionRefs.current[section.id] = el; }}
              data-section-id={section.id}
              id={section.id}
              style={{ marginBottom: 32, borderBottom: `1px solid ${THEME.border}`, paddingBottom: 32 }}
            >
              <button
                type="button"
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "16px 20px",
                  background: THEME.card,
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 12,
                  boxShadow: THEME.shadow,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 700, color: THEME.text }}>{section.title}</span>
                <span style={{ color: THEME.textMuted, fontSize: 14 }}>{isExpanded ? "▼" : "▶"}</span>
              </button>
              <div
                className="how-to-use-accordion"
                style={{
                  maxHeight: isExpanded ? 4000 : 0,
                  overflow: "hidden",
                  opacity: isExpanded ? 1 : 0.8,
                }}
              >
                <div style={{ padding: "16px 20px", background: THEME.bgAlt, border: `1px solid ${THEME.border}`, borderTop: "none", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                  {hasItems ? (
                    section.items.map((item, i) => (
                      <div key={i} style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: THEME.text, marginBottom: 6 }}>{item.q}</h4>
                        <p style={{ fontSize: 13, color: THEME.textMuted, lineHeight: 1.6, margin: 0 }}>{renderAnswer(item.a)}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 13, color: THEME.textMuted }}>No matching questions in this section. Try a different search.</p>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {filteredSections.length === 0 && searchQuery.trim() && (
          <p style={{ color: THEME.textMuted, fontSize: 14 }}>No FAQs match your search. Try different keywords.</p>
        )}
      </main>

      {/* Back to top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: THEME.accent,
            color: "#fff",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            cursor: "pointer",
            fontSize: 18,
            zIndex: 50,
          }}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .how-to-use-toc-desktop { display: block !important; }
          .how-to-use-toc-mobile { display: none !important; }
        }
        @media (max-width: 1023px) {
          .how-to-use-toc-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
