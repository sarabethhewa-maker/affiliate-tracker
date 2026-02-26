"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Tooltip from "../components/Tooltip";
import { useSettings, resolveTierKey } from "../contexts/SettingsContext";

function getCurrentMonthRevenue(conversions: { amount: number; createdAt: string }[]): number {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  return conversions
    .filter(c => { const d = new Date(c.createdAt); return d.getFullYear() === y && d.getMonth() === m; })
    .reduce((s, c) => s + c.amount, 0);
}

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  sidebar: "#f1f5f9",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  accentLight: "#3a7ca5",
  success: "#0d7a3d",
  successBg: "#dcfce7",
  warning: "#b45309",
  warningBg: "#fef3c7",
  error: "#b91c1c",
  errorBg: "#fee2e2",
  overlay: "rgba(0,0,0,0.4)",
};

type ConversionRow = {
  id: string;
  amount: number;
  status: string;
  product: string | null;
  orderId: string | null;
  source: string | null;
  paidAt: string | null;
  createdAt: string;
  affiliate: { id: string; name: string; email: string; tier: string };
};

type Affiliate = {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  state?: string | null;
  referralCode?: string | null;
  parentId: string | null;
  tipaltiPayeeId?: string | null;
  tipaltiStatus?: string | null;
  notes?: string | null;
  children: Affiliate[];
  clicks: { id: string; createdAt?: string }[];
  conversions: { id: string; amount: number; status?: string; product?: string | null; createdAt: string }[];
  payouts?: { id: string; amount: number; method?: string; note?: string | null; paidAt: string; tipaltiRefCode?: string | null; payoutStatus?: string | null }[];
  createdAt: string;
};

type ActivityLogEntry = { id: string; type: string; message: string; affiliateId: string | null; createdAt: string };

const PAYMENT_METHODS = [
  { value: "tipalti", label: "Pay via Tipalti" },
  { value: "paypal", label: "PayPal" },
  { value: "venmo_zelle", label: "Venmo / Zelle" },
  { value: "ach", label: "Bank Transfer (ACH)" },
  { value: "other", label: "Other" },
] as const;

function TierBadge({ tier, showTooltip = false, TIERS }: { tier: string; showTooltip?: boolean; TIERS: Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }> }) {
  const key = resolveTierKey(tier, Object.keys(TIERS).length);
  const t = TIERS[key] ?? Object.values(TIERS)[0];
  if (!t) return null;
  const badge = (
    <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}40`, borderRadius: 4, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>
      {t.label}
    </span>
  );
  if (showTooltip) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {badge}
        <Tooltip text={`Tier based on monthly volume. This tier earns ${t.commission}% on sales; L2 override ${t.mlm2}%, L3 ${t.mlm3}%.`} />
      </span>
    );
  }
  return badge;
}

function StatCard({ label, value, accent, tooltip }: { label: string; value: string | number; accent?: string; tooltip?: string }) {
  return (
    <div className="admin-stat-card" style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: "22px 26px", flex: 1, minWidth: 160 }}>
      <div style={{ color: THEME.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div style={{ color: accent ?? THEME.text, fontSize: 28, fontWeight: 800, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pending: { bg: THEME.successBg, color: THEME.success },
    approved: { bg: "#dbeafe", color: THEME.accentLight },
    paid: { bg: "#ede9fe", color: "#6d28d9" },
    active: { bg: THEME.successBg, color: THEME.success },
    rejected: { bg: THEME.errorBg, color: THEME.error },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}60`, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const }}>
      {status}
    </span>
  );
}

function VolumeProgressBar({ monthlyRevenue, nextThreshold, progress }: { monthlyRevenue: number; nextThreshold: number | null; progress: number }) {
  if (nextThreshold === null) return <span style={{ color: THEME.warning, fontSize: 11 }}>At top tier</span>;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: THEME.textMuted, marginBottom: 2 }}>
        <span>${monthlyRevenue.toFixed(0)} / ${nextThreshold} this month</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div style={{ height: 6, background: THEME.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${THEME.accent}, ${THEME.success})`, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function HowToUseContent({ theme }: { theme: typeof THEME }) {
  const card = { background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 24, marginBottom: 20 };
  const heading = { color: theme.text, fontSize: 18, fontWeight: 700, marginBottom: 12, display: "flex" as const, alignItems: "center" as const, gap: 10 };
  const body = { color: theme.textMuted, fontSize: 14, lineHeight: 1.6 };
  const faqQ = { color: theme.text, fontWeight: 600, fontSize: 14, marginBottom: 6 };
  const faqA = { color: theme.textMuted, fontSize: 13, marginBottom: 16 };
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: "#e0f2fe", border: `1px solid ${theme.accent}40`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <p style={{ color: theme.text, fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          <strong>All program rules</strong> like tier names, commission rates, and thresholds can be customized in <strong><Link href="/settings" style={{ color: theme.accent }}>Settings</Link></strong> — no code required.
        </p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>🚀</span> Getting Started</h2>
        <p style={body}>Add your first affiliate from the dashboard: click <strong style={{ color: theme.text }}>+ Add Affiliate</strong>, enter name and email, choose tier and optionally who recruited them. You can also share the <strong style={{ color: theme.accent }}>/join</strong> link so people can apply on their own (no login required). Approve or reject applications from the <strong>Affiliates</strong> tab — see &quot;Pending Approvals&quot; at the top.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>📋</span> Public Affiliate Signup (/join)</h2>
        <p style={body}>The public page at <strong>/join</strong> lets anyone apply to become an affiliate without logging in. They fill in name, email, optional phone and social handle, how they heard about you, and an optional referral code (recruiter&apos;s affiliate ID). Submissions are created with status <strong>pending</strong>. In the Affiliates tab, use <strong>Approve</strong> to activate them and send the welcome email (and assign them under the recruiter if they used a referral code), or <strong>Reject</strong> to remove the application entirely.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>📊</span> Understanding Tiers</h2>
        <p style={body}>Commission is based on <strong style={{ color: theme.text }}>monthly sales volume</strong>. Default tiers: Silver, Gold, Master (you can rename and change rates in Settings). Tiers update automatically each month. The progress bar on each affiliate shows how close they are to the next tier.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>⚙️</span> Customizing Your Program</h2>
        <div style={body}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: theme.text }}>How to change tier names:</strong> Go to Settings → Tier Settings. Click the name field next to any tier and type a new name. Hit Save. The new name will appear everywhere in the dashboard immediately.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: theme.text }}>How to change commission percentages:</strong> In Settings → Tier Settings, update the % fields for each tier. You can set the direct commission rate and the MLM override rates for level 2 and level 3 recruits separately.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: theme.text }}>How to add a new tier:</strong> Click &quot;Add Tier&quot; in Settings → Tier Settings. Give it a name, set the commission rates and the monthly sales threshold required to reach it.</p>
          <p style={{ marginBottom: 12 }}><strong style={{ color: theme.text }}>How to change thresholds:</strong> In Settings → Threshold Settings, update the dollar amount required for each tier. Affiliates will be automatically moved up or down based on their current month&apos;s sales.</p>
          <p style={{ marginBottom: 0 }}><strong style={{ color: theme.text }}>How to change program settings:</strong> In Settings → Program Settings you can update your program name, website, admin email for notifications, and how long tracking cookies last.</p>
        </div>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>🌐</span> How MLM Works</h2>
        <p style={body}>When one affiliate recruits another, they earn an override on the recruit&apos;s sales. Example: <strong>Darlene</strong> recruits <strong>Elliot</strong>. Elliot makes a $500 sale and earns his tier commission (e.g. 10% = $50). Darlene earns a Level 2 bonus (e.g. 3% of $500 = $15). The MLM Tree tab shows the full network of who recruited who.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>🔗</span> Tracking Links</h2>
        <p style={body}>Each affiliate has two links: a <strong style={{ color: theme.text }}>sales link</strong> (for customers) and a <strong style={{ color: theme.text }}>recruit link</strong> (sends signups to /join with their referral code). Copy from the Affiliates tab. Clicks on the sales link are recorded. When a customer buys, log the sale in Conversion Status or via + Log Sale.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>💰</span> Recording Sales</h2>
        <p style={body}>Go to <strong>Conversion Status</strong> and click <strong>+ Log Sale</strong>. Select the affiliate, enter the sale amount, optional date and note. The conversion is created as &quot;pending&quot; — you can Approve it, then Mark paid when you&apos;ve sent the payout. This updates the affiliate&apos;s revenue and their volume-based tier.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>💳</span> Paying Affiliates</h2>
        <p style={body}>On the <strong>Payouts</strong> tab you see unpaid vs paid balance per affiliate. Click <strong>Pay Now</strong> to open a modal: amount is pre-filled, choose payment method (PayPal, Venmo/Zelle, Bank Transfer), add a reference, then Confirm. The payout is recorded and approved conversions are marked paid.</p>
      </div>
      <div style={card}>
        <h2 style={heading}><span style={{ fontSize: 20 }}>❓</span> FAQs</h2>
        <div style={body}>
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

type TierConfig = Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }>;

function MLMTree({ affiliates, rootId = null, depth = 0, TIERS, getVolumeTier }: { affiliates: Affiliate[]; rootId?: string | null; depth?: number; TIERS: TierConfig; getVolumeTier: (rev: number) => { tierKey: string; rate: number; nextThreshold: number | null; progress: number } }) {
  const children = affiliates.filter(a => a.parentId === rootId && a.status === "active");
  const parent = rootId ? affiliates.find(a => a.id === rootId) : null;
  const parentVol = parent ? getVolumeTier(getCurrentMonthRevenue(parent.conversions)) : null;
  const referrerPct = parentVol ? (TIERS[parentVol.tierKey]?.mlm2 ?? 3) : 0;
  if (children.length === 0) return null;
  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 28, borderLeft: depth > 0 ? `2px solid ${THEME.border}` : "none", marginLeft: depth > 0 ? 14 : 0 }}>
      {depth > 0 && parent && (
        <div style={{ color: THEME.textMuted, fontSize: 10, marginBottom: 4, marginLeft: 12 }}>↑ {parent.name} earns {referrerPct}% of these affiliates&apos; sales</div>
      )}
      {children.map(aff => {
        const revenue = aff.conversions.reduce((s, c) => s + c.amount, 0);
        const vol = getVolumeTier(getCurrentMonthRevenue(aff.conversions));
        return (
          <div key={aff.id} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: TIERS[vol.tierKey]?.bg, border: `2px solid ${TIERS[vol.tierKey]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: TIERS[vol.tierKey]?.color }}>
                {aff.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: THEME.text, fontWeight: 600, fontSize: 14 }}>{aff.name}</div>
                <div style={{ color: THEME.textMuted, fontSize: 11 }}>${revenue.toFixed(0)} revenue · {aff.conversions.length} sales{depth > 0 && parent ? ` · referrer gets ${referrerPct}%` : ""}</div>
              </div>
              <TierBadge tier={vol.tierKey} TIERS={TIERS} />
              <div style={{ color: THEME.success, fontSize: 11, background: THEME.successBg, border: `1px solid ${THEME.success}40`, borderRadius: 4, padding: "2px 8px" }}>L{depth + 1}</div>
            </div>
            <MLMTree affiliates={affiliates} rootId={aff.id} depth={depth + 1} TIERS={TIERS} getVolumeTier={getVolumeTier} />
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const { settings, TIERS, getVolumeTier } = useSettings();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [tab, setTab] = useState("how-to-use");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", tier: "0", parentId: "", state: "" });
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
  const [copiedRecruit, setCopiedRecruit] = useState("");
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convStatus, setConvStatus] = useState("");
  const [convDateFrom, setConvDateFrom] = useState("");
  const [convDateTo, setConvDateTo] = useState("");
  const [showLogSale, setShowLogSale] = useState(false);
  const [logSaleForm, setLogSaleForm] = useState({ affiliateId: "", amount: "", product: "", note: "", date: "" });
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalData, setPayModalData] = useState<{ affId: string; affName: string; amount: number; tipaltiStatus?: string | null } | null>(null);
  const [payForm, setPayForm] = useState({ method: "paypal" as string, note: "" });
  const [lastPayRef, setLastPayRef] = useState<string | null>(null);
  const [showMassPayoutModal, setShowMassPayoutModal] = useState(false);
  const [massPayoutSelected, setMassPayoutSelected] = useState<Set<string>>(new Set());
  const [massPayoutSending, setMassPayoutSending] = useState(false);
  const [massPayoutResults, setMassPayoutResults] = useState<{ affiliateId: string; success: boolean; error?: string }[] | null>(null);
  const [tipaltiInviting, setTipaltiInviting] = useState<string | null>(null);
  const [tipaltiRefreshing, setTipaltiRefreshing] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateRangeFilter, setDateRangeFilter] = useState<"today" | "week" | "month" | "year" | "all">("month");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [highlightedAffiliateId, setHighlightedAffiliateId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [alerts, setAlerts] = useState<{ id: string; affiliateId: string; type: string; message: string; createdAt: string }[]>([]);
  const [leaderboardMode, setLeaderboardMode] = useState<"month" | "all" | "recruits">("month");
  const [calcSales, setCalcSales] = useState(5000);
  const [calcShareCopied, setCalcShareCopied] = useState(false);

  const getDateRange = useCallback((): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    if (dateRangeFilter === "today") {
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (dateRangeFilter === "week") {
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (dateRangeFilter === "month") {
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    if (dateRangeFilter === "year") {
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    start.setTime(0);
    return { start, end };
  }, [dateRangeFilter]);

  const inDateRange = useCallback((d: Date, range: { start: Date; end: Date }) => {
    const t = d.getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
  }, []);

  const fetchAffiliates = async () => {
    setLoading(true);
    const res = await fetch("/api/affiliates");
    const data = await res.json();
    setAffiliates(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const fetchActivity = useCallback(async () => {
    const res = await fetch("/api/activity");
    if (res.ok) {
      const data = await res.json();
      setActivityLogs(Array.isArray(data) ? data : []);
    }
  }, []);

  const fetchConversions = useCallback(async () => {
    setConvLoading(true);
    const params = new URLSearchParams();
    if (convStatus) params.set("status", convStatus);
    if (convDateFrom) params.set("from", convDateFrom);
    if (convDateTo) params.set("to", convDateTo);
    const res = await fetch("/api/conversions?" + params.toString());
    const data = await res.json();
    setConversions(Array.isArray(data) ? data : []);
    setConvLoading(false);
  }, [convStatus, convDateFrom, convDateTo]);

  useEffect(() => { fetchAffiliates(); }, []);
  useEffect(() => { if (tab === "conversions") fetchConversions(); }, [tab, fetchConversions]);
  useEffect(() => { if (tab === "dashboard") fetchActivity(); }, [tab, fetchActivity]);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/alerts");
    if (res.ok) {
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    }
  }, []);
  useEffect(() => { if (tab === "dashboard") fetchAlerts(); }, [tab, fetchAlerts]);

  useEffect(() => {
    const mq = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)");
    if (!mq) return;
    const on = () => setIsMobile(true);
    const off = () => setIsMobile(false);
    setIsMobile(mq.matches);
    mq.addEventListener("change", (e) => (e.matches ? on() : off()));
    return () => { mq.removeEventListener("change", on); mq.removeEventListener("change", off); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
        if (!searchOpen) setSearchQuery("");
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setExportDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const updateConversionStatus = async (id: string, status: string) => {
    await fetch("/api/conversions/" + id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchConversions();
    fetchAffiliates();
  };

  const addAffiliate = async () => {
    if (!form.name || !form.email) return;
    await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentId: form.parentId || null, state: form.state || null }),
    });
    setForm({ name: "", email: "", tier: "0", parentId: "", state: "" });
    setShowAdd(false);
    fetchAffiliates();
  };

  const approveAffiliate = async (id: string) => {
    await fetch("/api/affiliates/" + id + "/approve", { method: "POST" });
    fetchAffiliates();
  };

  const rejectAffiliate = async (id: string) => {
    await fetch("/api/affiliates/" + id + "/reject", { method: "POST" });
    fetchAffiliates();
  };

  const logSale = async () => {
    if (!logSaleForm.affiliateId || !logSaleForm.amount) return;
    await fetch("/api/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        affiliateId: logSaleForm.affiliateId,
        amount: Number(logSaleForm.amount),
        product: logSaleForm.product || null,
        note: logSaleForm.note || null,
        createdAt: logSaleForm.date ? new Date(logSaleForm.date).toISOString() : undefined,
      }),
    });
    setLogSaleForm({ affiliateId: "", amount: "", product: "", note: "", date: "" });
    setShowLogSale(false);
    fetchConversions();
    fetchAffiliates();
  };

  const openPayModal = (affId: string, affName: string, amount: number, tipaltiStatus?: string | null) => {
    setPayModalData({ affId, affName, amount, tipaltiStatus });
    setPayForm({ method: tipaltiStatus === "active" ? "tipalti" : "paypal", note: "" });
    setShowPayModal(true);
  };

  const confirmPayModal = async () => {
    if (!payModalData) return;
    const res = await fetch("/api/affiliates/" + payModalData.affId + "/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: payModalData.amount, method: payForm.method, note: payForm.note || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.tipaltiRefCode) setLastPayRef(data.tipaltiRefCode);
    setTimeout(() => setLastPayRef(null), 8000);
    setShowPayModal(false);
    setPayModalData(null);
    fetchAffiliates();
    if (tab === "conversions") fetchConversions();
  };

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem("hasSeenTour");
    if (seen !== "true") setTourStep(0);
  }, []);

  const copyLink = (id: string) => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/api/ref/${id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };
  const copyRecruitLink = (code: string) => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/join?ref=${code}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedRecruit(code);
    setTimeout(() => setCopiedRecruit(""), 2000);
  };

  const range = getDateRange();
  const totalRevenue = affiliates.reduce((s, a) => s + a.conversions.filter((c) => inDateRange(new Date(c.createdAt), range)).reduce((x, c) => x + c.amount, 0), 0);
  const totalClicks = affiliates.reduce((s, a) => s + a.clicks.filter((c) => inDateRange(new Date((c as { createdAt?: string }).createdAt ?? 0), range)).length, 0);
  const totalConversions = affiliates.reduce((s, a) => s + a.conversions.filter((c) => inDateRange(new Date(c.createdAt), range)).length, 0);
  const filtered = affiliates.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));
  const searchFiltered = searchQuery.trim()
    ? affiliates.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          a.email.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const saveNotes = async (affId: string, notes: string) => {
    setSavingNotesId(affId);
    try {
      await fetch("/api/affiliates/" + affId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });
      fetchAffiliates();
    } finally {
      setSavingNotesId(null);
    }
  };

  const relativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)} minutes ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
    return d.toLocaleDateString();
  };

  const NAV = [
    { id: "how-to-use", label: "How to Use", icon: "?", tooltip: "Quick guide: getting started, tiers, MLM, links, sales, payouts, and public signup." },
    { id: "dashboard", label: "Dashboard", icon: "▦", tooltip: "Your overview. See total revenue, clicks, conversions and top performers at a glance." },
    { id: "conversions", label: "Conversion Status", icon: "◉", tooltip: "A conversion is recorded when a customer makes a purchase through the affiliate's link. Approve and mark paid here." },
    { id: "affiliates", label: "Affiliates", icon: "◈", tooltip: "Manage all your affiliates here. Add new ones, copy their tracking links, and see their stats." },
    { id: "mlm", label: "MLM Tree", icon: "⋔", tooltip: "Shows the full network of who recruited who. Each level earns a smaller override commission." },
    { id: "leaderboard", label: "Leaderboard", icon: "🏆", tooltip: "Top affiliates by sales this month. Gold, silver, bronze for top 3." },
    { id: "payouts", label: "Payouts", icon: "◎", tooltip: "Track what each affiliate has earned and log when you've paid them." },
    { id: "calculator", label: "Calculator", icon: "🧮", tooltip: "Estimate earnings by sales volume and recruits." },
    { id: "states", label: "By State", icon: "▤", tooltip: "Breakdown of affiliates by state. Flagged if a state has more than 2 Master affiliates." },
  ];

  const pendingAffiliates = affiliates.filter(a => a.status === "pending");
  const activeAffiliates = affiliates.filter(a => a.status === "active");
  const byState = activeAffiliates.reduce((acc, a) => {
    const st = a.state || "—";
    if (!acc[st]) acc[st] = [];
    acc[st].push(a);
    return acc;
  }, {} as Record<string, Affiliate[]>);
  const topTierKey = settings.tiers.length ? String(settings.tiers.length - 1) : "0";
  const stateMasterCount: Record<string, number> = {};
  Object.entries(byState).forEach(([st, list]) => {
    stateMasterCount[st] = list.filter(a => getVolumeTier(getCurrentMonthRevenue(a.conversions)).tierKey === topTierKey).length;
  });
  const statesOverTwoMasters = Object.entries(stateMasterCount).filter(([, n]) => n > 2).map(([st]) => st);

  const convPending = conversions.filter(c => c.status === "pending");
  const convApproved = conversions.filter(c => c.status === "approved");
  const convPaid = conversions.filter(c => c.status === "paid");
  const affiliateVolumeRates: Record<string, number> = {};
  conversions.forEach(c => {
    const aid = c.affiliate.id;
    const d = new Date(c.createdAt);
    const now = new Date();
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      affiliateVolumeRates[aid] = (affiliateVolumeRates[aid] || 0) + c.amount;
    }
  });
  const commission = (c: ConversionRow) => (c.amount * getVolumeTier(affiliateVolumeRates[c.affiliate.id] || 0).rate) / 100;
  const setDateRange = (preset: "today" | "week" | "month") => {
    const now = new Date();
    if (preset === "today") {
      setConvDateFrom(now.toISOString().slice(0, 10));
      setConvDateTo(now.toISOString().slice(0, 10));
    } else if (preset === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      setConvDateFrom(d.toISOString().slice(0, 10));
      setConvDateTo(now.toISOString().slice(0, 10));
    } else {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      setConvDateFrom(d.toISOString().slice(0, 10));
      setConvDateTo(now.toISOString().slice(0, 10));
    }
  };

  const TOUR_STEPS = [
    { text: "Welcome to AffiliateOS — this is your command center for Bio Longevity Labs' affiliate program. Start with How to Use for a quick guide.", highlight: null },
    { text: "Your overview. See total revenue, clicks, conversions and top performers at a glance.", highlight: "dashboard" },
    { text: "Manage all your affiliates here. Add new ones, copy their tracking links, and see their stats.", highlight: "affiliates" },
    { text: "See the full network hierarchy — who recruited who and at what level.", highlight: "mlm" },
    { text: "Track commissions owed and log payments when you pay out affiliates.", highlight: "payouts" },
    { text: "You're all set! Add your first affiliate to get started.", highlight: "add", action: "add" },
  ];

  const finishTour = () => {
    setTourStep(null);
    if (typeof window !== "undefined") localStorage.setItem("hasSeenTour", "true");
  };

  const goTourNext = () => {
    if (tourStep === null) return;
    const next = tourStep + 1;
    if (next >= TOUR_STEPS.length) finishTour();
    else {
      setTourStep(next);
      const h = TOUR_STEPS[next]?.highlight;
      if (h === "how-to-use") setTab("how-to-use");
      else if (h === "dashboard") setTab("dashboard");
      else if (h === "affiliates") setTab("affiliates");
      else if (h === "mlm") setTab("mlm");
      else if (h === "payouts") setTab("payouts");
    }
  };

  const goTourBack = () => {
    if (tourStep !== null && tourStep > 0) setTourStep(tourStep - 1);
  };

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: THEME.text, display: "flex" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .92; } }`}</style>
      {/* Tour re-trigger */}
      <button
        onClick={() => setTourStep(0)}
        style={{ position: "fixed", bottom: 20, left: 20, width: 36, height: 36, borderRadius: "50%", background: THEME.card, border: `1px solid ${THEME.border}`, color: THEME.textMuted, cursor: "pointer", fontSize: 16, zIndex: 90 }}
        title="Show tour again"
      >
        ?
      </button>

      {/* CMD+K Search modal */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, zIndex: 400, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh", padding: 24 }} onClick={() => setSearchOpen(false)}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, width: "100%", maxWidth: 480, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Search affiliates by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{ width: "100%", padding: "14px 18px", border: "none", borderBottom: `1px solid ${THEME.border}`, borderRadius: "12px 12px 0 0", fontSize: 15, outline: "none", background: THEME.card, color: THEME.text }}
            />
            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {searchFiltered.length === 0 ? (
                <div style={{ padding: 24, color: THEME.textMuted, textAlign: "center" }}>{searchQuery.trim() ? "No results found" : "Type to search..."}</div>
              ) : (
                searchFiltered.slice(0, 10).map((aff) => {
                  const rev = aff.conversions.reduce((s, c) => s + c.amount, 0);
                  const vol = getVolumeTier(getCurrentMonthRevenue(aff.conversions));
                  return (
                    <button
                      key={aff.id}
                      type="button"
                      className="admin-touch-btn"
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", border: "none", borderBottom: `1px solid ${THEME.border}`, background: highlightedAffiliateId === aff.id ? "#e0f2fe" : "transparent", cursor: "pointer", textAlign: "left", minHeight: 44 }}
                      onClick={() => {
                        setTab("affiliates");
                        setSearch(aff.name);
                        setHighlightedAffiliateId(aff.id);
                        setSearchOpen(false);
                        setTimeout(() => setHighlightedAffiliateId(null), 2000);
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: TIERS[vol.tierKey]?.bg, border: `2px solid ${TIERS[vol.tierKey]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: TIERS[vol.tierKey]?.color, flexShrink: 0 }}>{aff.name.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: THEME.text, fontWeight: 600, fontSize: 14 }}>{aff.name}</div>
                        <div style={{ color: THEME.textMuted, fontSize: 12 }}>{aff.email}</div>
                      </div>
                      <TierBadge tier={vol.tierKey} TIERS={TIERS} />
                      <div style={{ color: THEME.warning, fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>${rev.toLocaleString()}</div>
                    </button>
                  );
                })
              )}
            </div>
            <div style={{ padding: 8, borderTop: `1px solid ${THEME.border}`, color: THEME.textMuted, fontSize: 11 }}>Esc to close</div>
          </div>
        </div>
      )}

      {tourStep !== null && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 100 }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, maxWidth: 420, width: "90%" }}>
            <p style={{ color: THEME.text, fontSize: 15, lineHeight: 1.5, marginBottom: 20 }}>{TOUR_STEPS[tourStep]?.text}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
              <div>
                {tourStep > 0 && <button onClick={goTourBack} style={{ padding: "8px 16px", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 6, color: THEME.textMuted, cursor: "pointer", fontSize: 13 }}>Back</button>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={finishTour} style={{ padding: "8px 16px", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 6, color: THEME.textMuted, cursor: "pointer", fontSize: 13 }}>Skip</button>
                {TOUR_STEPS[tourStep]?.action === "add" ? (
                  <button onClick={() => { setShowAdd(true); finishTour(); }} style={{ padding: "8px 20px", background: THEME.accent, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Add Affiliate</button>
                ) : (
                  <button onClick={goTourNext} style={{ padding: "8px 20px", background: THEME.accent, border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Next</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${THEME.bg}; } ::-webkit-scrollbar-thumb { background: ${THEME.border}; border-radius: 3px; }
        input, select { color-scheme: light; } button { font-family: inherit; }
        @media (max-width: 767px) {
          .admin-sidebar { position: fixed; left: 0; top: 0; height: 100vh; z-index: 200; transform: translateX(-100%); transition: transform 0.2s ease; width: 260px; }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-main { margin-left: 0 !important; }
          .admin-stat-card { flex: 1 1 100% !important; min-width: 100% !important; }
          .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .admin-add-modal-mobile { width: 100% !important; max-width: 100% !important; height: 100% !important; max-height: 100% !important; border-radius: 0 !important; }
        }
        .admin-touch-btn { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: THEME.overlay, zIndex: 199 }}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <div className={sidebarOpen ? "admin-sidebar open" : "admin-sidebar"} style={{ width: 220, background: THEME.sidebar, borderRight: `1px solid ${THEME.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ marginBottom: 32 }}>
            <Image src="/biolongevity-logo.png" alt="Bio Longevity Labs" width={180} height={46} style={{ width: "auto", height: 40, objectFit: "contain", marginBottom: 8 }} />
            <div style={{ color: THEME.textMuted, fontSize: 10, letterSpacing: 1 }}>AFFILIATEOS · TRACKING</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }} data-tour="nav">
            {NAV.map(n => (
              <button key={n.id} onClick={() => { setTab(n.id); if (isMobile) setSidebarOpen(false); }} data-tour={n.id === "dashboard" ? "nav-dashboard" : n.id === "affiliates" ? "nav-affiliates" : n.id === "mlm" ? "nav-mlm" : n.id === "payouts" ? "nav-payouts" : undefined}
                className="admin-touch-btn"
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: tab === n.id ? "#e0f2fe" : "none", border: tab === n.id ? `1px solid ${THEME.accentLight}` : "1px solid transparent", color: tab === n.id ? THEME.accent : THEME.textMuted, cursor: "pointer", fontSize: 13, fontWeight: tab === n.id ? 700 : 400, textAlign: "left" as const, minHeight: 44 }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
                <Tooltip text={n.tooltip} />
              </button>
            ))}
          </nav>
        </div>
        <div style={{ marginTop: "auto", padding: 20, borderTop: `1px solid ${THEME.border}` }}>
          <Link href="/settings" style={{ display: "block", color: THEME.textMuted, fontSize: 12, marginBottom: 8, textDecoration: "none" }}>Settings</Link>
          <Link href="/how-to-use" style={{ display: "block", color: THEME.textMuted, fontSize: 12, marginBottom: 12, textDecoration: "none" }}>How to Use (full page)</Link>
          <div style={{ color: THEME.textMuted, fontSize: 10, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const }}>Active</div>
          <div style={{ color: THEME.accentLight, fontFamily: "monospace", fontSize: 22, fontWeight: 700 }}>{affiliates.filter(a => a.status === "active").length}</div>
          <div style={{ color: THEME.success, fontSize: 11, marginTop: 2 }}>{affiliates.length} total enrolled</div>
        </div>
      </div>

      {/* Main */}
      <div className="admin-main" style={{ flex: 1, overflowY: "auto", marginLeft: 0 }}>
        <div style={{ padding: "32px 36px" }}>
          {/* Hamburger (mobile) */}
          {isMobile && (
            <button type="button" onClick={() => setSidebarOpen(true)} className="admin-touch-btn" style={{ position: "absolute", left: 16, top: 24, zIndex: 99, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", color: THEME.text }} aria-label="Open menu">
              ☰
            </button>
          )}
          {lastPayRef && (
            <div style={{ marginBottom: 16, padding: 12, background: "#dcfce7", border: "1px solid #0d7a3d", borderRadius: 8, color: THEME.success, fontSize: 13 }}>
              Tipalti payment submitted. Reference: <strong>{lastPayRef}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, flexWrap: "wrap", gap: 16, paddingTop: isMobile ? 48 : 0 }}>
            <div>
              <Image src="/biolongevity-logo.png" alt="Bio Longevity Labs" width={200} height={51} style={{ width: "auto", height: 36, objectFit: "contain", marginBottom: 10 }} />
              <h1 style={{ fontSize: 26, fontWeight: 800, color: THEME.text, marginBottom: 4 }}>
                {tab === "how-to-use" && "How to Use"}
                {tab === "dashboard" && "Dashboard"}
                {tab === "conversions" && "Conversion Status"}
                {tab === "affiliates" && "Affiliates"}
                {tab === "mlm" && "MLM Network Tree"}
                {tab === "leaderboard" && "Leaderboard"}
                {tab === "payouts" && "Payout Overview"}
                {tab === "calculator" && "Commission Calculator"}
                {tab === "states" && "Affiliates by State"}
              </h1>
              <div style={{ color: THEME.textMuted, fontSize: 13 }}>Affiliate Program</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setSearchOpen(true)} className="admin-touch-btn" style={{ minHeight: 44, padding: "10px 14px", background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textMuted, fontSize: 12, cursor: "pointer" }} title="Quick search (⌘K)">⌘K</button>
              {tab === "conversions" && (
                <button onClick={() => setShowLogSale(true)} className="admin-touch-btn"
                  style={{ minHeight: 44, background: `linear-gradient(135deg, ${THEME.success}, #0d9a4d)`, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  + Log Sale
                </button>
              )}
              {tab === "affiliates" && (
                <div style={{ position: "relative" }}>
                  <button type="button" onClick={() => setExportDropdownOpen((o) => !o)} className="admin-touch-btn"
                    style={{ minHeight: 44, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: "11px 20px", color: THEME.text, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    Export ▾
                  </button>
                  {exportDropdownOpen && (
                    <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 220 }}>
                      <a href="/api/export/affiliates" download="affiliates.csv" className="admin-touch-btn" style={{ display: "block", padding: "12px 16px", minHeight: 44, color: THEME.text, textDecoration: "none", fontSize: 13, borderBottom: `1px solid ${THEME.border}` }} onClick={() => setExportDropdownOpen(false)}>Export Affiliates</a>
                      <a href="/api/export/conversions" download="conversions.csv" className="admin-touch-btn" style={{ display: "block", padding: "12px 16px", minHeight: 44, color: THEME.text, textDecoration: "none", fontSize: 13, borderBottom: `1px solid ${THEME.border}` }} onClick={() => setExportDropdownOpen(false)}>Export Conversions</a>
                      <a href="/api/export/payouts" download="payouts.csv" className="admin-touch-btn" style={{ display: "block", padding: "12px 16px", minHeight: 44, color: THEME.text, textDecoration: "none", fontSize: 13 }} onClick={() => setExportDropdownOpen(false)}>Export Payouts</a>
                    </div>
                  )}
                </div>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} data-tour="add-affiliate">
                <button onClick={() => setShowAdd(true)} className="admin-touch-btn"
                  style={{ minHeight: 44, background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentLight})`, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                  + Add Affiliate
                </button>
                <Tooltip text="Add a new affiliate manually. You can assign their tier and who recruited them." />
              </span>
            </div>
          </div>

          {loading && tab !== "conversions" && <div style={{ color: THEME.textMuted, textAlign: "center", padding: 60 }}>Loading...</div>}
          {convLoading && tab === "conversions" && <div style={{ color: THEME.textMuted, textAlign: "center", padding: 60 }}>Loading conversions...</div>}

          {tab === "how-to-use" && (
            <HowToUseContent theme={THEME} />
          )}

          {!loading && tab === "dashboard" && (
            <>
              {alerts.length > 0 && (
                <div style={{ background: "#fef3c7", border: "1px solid #b45309", borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 10 }}>⚠️ Alerts</div>
                  {alerts.map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(180,83,9,0.3)", flexWrap: "wrap" }}>
                      <span style={{ flex: 1, fontSize: 13 }}>{a.message}</span>
                      <span style={{ fontSize: 11, color: "#92400e" }}>{new Date(a.createdAt).toLocaleString()}</span>
                      <button type="button" onClick={async () => { await fetch("/api/alerts/" + a.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dismissed: true }) }); fetchAlerts(); }} style={{ padding: "4px 10px", background: "#fff", border: "1px solid #b45309", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Dismiss</button>
                      <button type="button" onClick={() => { setTab("affiliates"); setSearch(affiliates.find(x => x.id === a.affiliateId)?.name ?? ""); setHighlightedAffiliateId(a.affiliateId); setAlerts(prev => prev.filter(x => x.id !== a.id)); }} style={{ padding: "4px 10px", background: "#b45309", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Investigate</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const, alignItems: "center" }}>
                <span style={{ color: THEME.textMuted, fontSize: 12, fontWeight: 600, marginRight: 8 }}>Period:</span>
                {(["today", "week", "month", "year", "all"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="admin-touch-btn"
                    onClick={() => setDateRangeFilter(key)}
                    style={{
                      minHeight: 44,
                      padding: "10px 16px",
                      borderRadius: 8,
                      border: `1px solid ${dateRangeFilter === key ? THEME.accentLight : THEME.border}`,
                      background: dateRangeFilter === key ? "#e0f2fe" : THEME.card,
                      color: dateRangeFilter === key ? THEME.accent : THEME.text,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: dateRangeFilter === key ? 700 : 400,
                    }}
                  >
                    {key === "today" ? "Today" : key === "week" ? "This Week" : key === "month" ? "This Month" : key === "year" ? "This Year" : "All Time"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" as const }} data-tour="dashboard">
                <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} accent="#f0c040" />
                <StatCard label="Link Clicks" value={totalClicks} accent="#4a90d9" tooltip="Every time someone clicks this affiliate's unique tracking link, it's recorded here." />
                <StatCard label="Conversions" value={totalConversions} accent="#3a8a5a" tooltip="A conversion is recorded when a customer makes a purchase through the affiliate's link." />
                <StatCard label="Affiliates" value={affiliates.length} accent="#e8834a" />
              </div>
              <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ color: THEME.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 16 }}>Top Performers (by revenue in period)</div>
                {[...activeAffiliates]
                  .map((a) => ({ aff: a, rev: a.conversions.filter((c) => inDateRange(new Date(c.createdAt), range)).reduce((s, c) => s + c.amount, 0) }))
                  .sort((a, b) => b.rev - a.rev)
                  .slice(0, 5)
                  .map(({ aff: aff, rev }, i) => {
                  const vol = getVolumeTier(getCurrentMonthRevenue(aff.conversions));
                  return (
                    <div key={aff.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? `1px solid ${THEME.border}` : "none" }}>
                      <div style={{ width: 22, color: THEME.textMuted, fontSize: 12, fontWeight: 700 }}>#{i + 1}</div>
                      <div style={{ flex: 1, color: THEME.text, fontSize: 13 }}>{aff.name}{aff.state ? ` (${aff.state})` : ""}</div>
                      <TierBadge tier={vol.tierKey} showTooltip TIERS={TIERS} />
                      <div style={{ color: THEME.warning, fontFamily: "monospace", fontSize: 13 }}>${rev.toLocaleString()}</div>
                    </div>
                  );
                })}
                {activeAffiliates.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>No affiliates yet — add your first one!</div>}
              </div>
              {/* Activity feed */}
              <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24, marginTop: 24 }}>
                <div style={{ color: THEME.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 16 }}>Activity</div>
                {activityLogs.length === 0 ? (
                  <div style={{ color: THEME.textMuted, fontSize: 13 }}>No recent activity.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {activityLogs.map((log) => {
                      const icon = log.type === "conversion" ? "💰" : log.type === "affiliate_approved" ? "✨" : log.type === "tier_upgrade" ? "⬆️" : "💳";
                      return (
                        <li key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: `1px solid ${THEME.border}` }}>
                          <span style={{ fontSize: 18 }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: THEME.text, fontSize: 13 }}>{log.message}</span>
                            <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 2 }}>{relativeTime(log.createdAt)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {pendingAffiliates.length > 0 && (
                <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}60`, borderRadius: 12, padding: 20, marginTop: 20 }}>
                  <div style={{ color: THEME.warning, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Pending applications ({pendingAffiliates.length})</div>
                  {pendingAffiliates.slice(0, 5).map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: `1px solid ${THEME.border}` }}>
                      <span style={{ color: THEME.text }}>{a.name}</span>
                      <span style={{ color: THEME.textMuted, fontSize: 12 }}>{a.email}</span>
                      <button onClick={() => approveAffiliate(a.id)} style={{ padding: "4px 10px", background: "#1a3a20", border: "none", borderRadius: 4, color: "#3a8a5a", cursor: "pointer", fontSize: 11 }}>Approve</button>
                      <button onClick={() => rejectAffiliate(a.id)} style={{ padding: "4px 10px", background: "#2a1a1a", border: "none", borderRadius: 4, color: "#8a5a5a", cursor: "pointer", fontSize: 11 }}>Reject</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && tab === "conversions" && !convLoading && (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" as const }}>
                <StatCard label="Pending" value={`$${convPending.reduce((s, c) => s + commission(c), 0).toFixed(2)}`} accent="#7a9a6a" />
                <StatCard label="Approved" value={`$${convApproved.reduce((s, c) => s + commission(c), 0).toFixed(2)}`} accent="#4a90d9" />
                <StatCard label="Paid" value={`$${convPaid.reduce((s, c) => s + commission(c), 0).toFixed(2)}`} accent="#8a7aca" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 20, alignItems: "center" }}>
                <span style={{ color: "#5a6a7a", fontSize: 12, fontWeight: 600 }}>Date:</span>
                {(["today", "week", "month"] as const).map(p => (
                  <button key={p} onClick={() => setDateRange(p)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${THEME.border}`, background: THEME.card, color: THEME.text, cursor: "pointer", fontSize: 12 }}>{p === "today" ? "Today" : p === "week" ? "Last 7 days" : "Last 30 days"}</button>
                ))}
                <input type="date" value={convDateFrom} onChange={e => setConvDateFrom(e.target.value)} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "6px 10px", color: THEME.text, fontSize: 12 }} />
                <span style={{ color: THEME.textMuted }}>→</span>
                <input type="date" value={convDateTo} onChange={e => setConvDateTo(e.target.value)} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "6px 10px", color: THEME.text, fontSize: 12 }} />
                <span style={{ color: THEME.textMuted, fontSize: 12, marginLeft: 8 }}>Status:</span>
                <select value={convStatus} onChange={e => setConvStatus(e.target.value)} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 6, padding: "6px 10px", color: THEME.text, fontSize: 12 }}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div className="admin-table-wrap" style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 90px 90px 100px 1fr", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${THEME.border}`, fontWeight: 700, fontSize: 11, color: THEME.textMuted, textTransform: "uppercase" as const, letterSpacing: 1, minWidth: 640 }}>
                  <div>Affiliate</div>
                  <div>Product</div>
                  <div>Source</div>
                  <div>Sale</div>
                  <div>Commission</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {conversions.map(c => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 90px 90px 100px 1fr", gap: 12, padding: "14px 20px", borderBottom: `1px solid ${THEME.border}`, alignItems: "center", minWidth: 640 }}>
                    <div>
                      <div style={{ color: THEME.text, fontSize: 13, fontWeight: 600 }}>{c.affiliate.name}</div>
                      <div style={{ color: THEME.textMuted, fontSize: 11 }}>{c.affiliate.email}</div>
                    </div>
                    <div style={{ color: THEME.textMuted, fontSize: 12 }}>{c.product || "—"}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ background: (c.source === "woocommerce" ? "#dcfce7" : "#e0f2fe"), color: (c.source === "woocommerce" ? THEME.success : THEME.accentLight), border: `1px solid ${(c.source === "woocommerce" ? THEME.success : THEME.accentLight)}60`, borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 700, width: "fit-content" }}>
                        {c.source === "woocommerce" ? "WOO" : "MANUAL"}
                      </span>
                      {c.source === "woocommerce" && c.orderId && (
                        settings.wcStoreUrl
                          ? <a href={`${settings.wcStoreUrl.replace(/\/$/, "")}/wp-admin/post.php?post=${c.orderId}&action=edit`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: THEME.accentLight }}>#{c.orderId}</a>
                          : <span style={{ fontSize: 11, color: THEME.textMuted }}>#{c.orderId}</span>
                      )}
                    </div>
                    <div style={{ color: THEME.warning, fontFamily: "monospace", fontSize: 13 }}>${c.amount.toFixed(2)}</div>
                    <div style={{ color: THEME.accentLight, fontFamily: "monospace", fontSize: 13 }}>${commission(c).toFixed(2)}</div>
                    <div><StatusBadge status={c.status} /></div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {c.status === "pending" && (
                        <button onClick={() => updateConversionStatus(c.id, "approved")} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#dbeafe", color: THEME.accentLight, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
                      )}
                      {c.status === "approved" && (
                        <button onClick={() => updateConversionStatus(c.id, "paid")} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: "#ede9fe", color: "#6d28d9", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Mark paid</button>
                      )}
                      {c.status === "paid" && c.paidAt && <span style={{ color: THEME.textMuted, fontSize: 11 }}>Paid {new Date(c.paidAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
                {conversions.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 40 }}>No conversions in this range</div>}
              </div>
            </>
          )}

          {!loading && tab === "affiliates" && (
            <>
              {pendingAffiliates.length > 0 && (
                <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}60`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ color: THEME.warning, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Pending Approvals ({pendingAffiliates.length}) — approve to send welcome email & links; reject removes the application</div>
                  {pendingAffiliates.map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${THEME.border}`, flexWrap: "wrap" as const }}>
                      <span style={{ color: THEME.text, fontWeight: 600 }}>{a.name}</span>
                      <span style={{ color: THEME.textMuted, fontSize: 12 }}>{a.email}</span>
                      <button onClick={() => approveAffiliate(a.id)} style={{ padding: "6px 12px", background: THEME.successBg, border: "none", borderRadius: 6, color: THEME.success, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
                      <button onClick={() => rejectAffiliate(a.id)} style={{ padding: "6px 12px", background: THEME.errorBg, border: "none", borderRadius: 6, color: THEME.error, cursor: "pointer", fontSize: 11 }}>Reject</button>
                    </div>
                  ))}
                </div>
              )}
              <input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", marginBottom: 16, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 13, outline: "none" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(aff => {
                  const rev = aff.conversions.reduce((s, c) => s + c.amount, 0);
                  const monthlyRev = getCurrentMonthRevenue(aff.conversions);
                  const vol = getVolumeTier(monthlyRev);
                  const salesLink = `${typeof window !== "undefined" ? window.location.origin : ""}/api/ref/${aff.id}`;
                  const recruitLink = aff.referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/join?ref=${aff.referralCode}` : null;
                  const parent = aff.parentId ? affiliates.find(a => a.id === aff.parentId) : null;
                  const parentVol = parent ? getVolumeTier(getCurrentMonthRevenue(parent.conversions)) : null;
                  const referrerPct = parentVol ? (TIERS[parentVol.tierKey]?.mlm2 ?? 3) : 0;
                  const referralRevenue = affiliates.filter(c => c.parentId === aff.id).reduce((s, c) => s + c.conversions.reduce((x, cv) => x + cv.amount, 0), 0);
                  const myEarnFromReferrals = referralRevenue * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100;
                  return (
                    <div key={aff.id} style={{ background: highlightedAffiliateId === aff.id ? "#e0f2fe" : THEME.card, border: `2px solid ${highlightedAffiliateId === aff.id ? THEME.accentLight : THEME.border}`, borderRadius: 10, padding: "16px 20px", transition: "border 0.2s, background 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" as const }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: TIERS[vol.tierKey]?.bg, border: `2px solid ${TIERS[vol.tierKey]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: TIERS[vol.tierKey]?.color, flexShrink: 0 }}>{aff.name.charAt(0)}</div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" as const }}>
                            <span style={{ color: THEME.text, fontWeight: 700, fontSize: 14 }}>{aff.name}</span>
                            <TierBadge tier={vol.tierKey} TIERS={TIERS} />
                            {aff.status !== "active" && <StatusBadge status={aff.status} />}
                            {aff.state && <span style={{ color: THEME.textMuted, fontSize: 11 }}>{aff.state}</span>}
                          </div>
                          <div style={{ color: THEME.accentLight, fontSize: 11, fontFamily: "monospace", marginBottom: 2 }}>Sales: {salesLink}</div>
                          {recruitLink && <div style={{ color: THEME.accentLight, fontSize: 11, fontFamily: "monospace", marginBottom: 4 }}>Recruit: {recruitLink}</div>}
                          <VolumeProgressBar monthlyRevenue={monthlyRev} nextThreshold={vol.nextThreshold} progress={vol.progress} />
                          {parent && (
                            <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 4 }}>
                              Referred by <span style={{ color: THEME.text, fontWeight: 600 }}>{parent.name}</span> — they earn <span style={{ color: THEME.success, fontWeight: 700 }}>{referrerPct}%</span> of this affiliate&apos;s sales {rev > 0 ? `($${(rev * referrerPct / 100).toFixed(2)})` : ""}
                            </div>
                          )}
                          {aff.children?.length > 0 && (
                            <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 2 }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                Signed up {aff.children.length} referral{aff.children.length !== 1 ? "s" : ""} — you earn {(TIERS[vol.tierKey]?.mlm2 ?? 3)}% of their sales = <span style={{ color: THEME.warning, fontFamily: "monospace" }}>${myEarnFromReferrals.toFixed(2)}</span>
                                <Tooltip text="When someone this affiliate recruited makes a sale, this affiliate earns a bonus override commission." />
                              </span>
                            </div>
                          )}
                          <div style={{ marginTop: 12 }}>
                            <div style={{ color: THEME.textMuted, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                              {aff.notes ? "📝" : "✏️"} Private notes
                            </div>
                            <textarea
                              key={`notes-${aff.id}-${(aff.notes ?? "").slice(0, 20)}`}
                              placeholder="e.g. Met at conference, referred by Bobby..."
                              defaultValue={aff.notes ?? ""}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v !== (aff.notes ?? "")) saveNotes(aff.id, v);
                              }}
                              style={{ width: "100%", minHeight: 60, padding: "8px 10px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 6, fontSize: 12, color: THEME.text, outline: "none", resize: "vertical" }}
                            />
                            {savingNotesId === aff.id && <span style={{ fontSize: 11, color: THEME.textMuted }}>Saving…</span>}
                          </div>
                          <div style={{ marginTop: 12, padding: 10, background: THEME.bg, borderRadius: 8, fontSize: 12 }}>
                            <div style={{ color: THEME.textMuted, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 1 }}>Payout Setup</div>
                            {!aff.tipaltiPayeeId && (
                              <button
                                disabled={!!tipaltiInviting}
                                onClick={async () => {
                                  setTipaltiInviting(aff.id);
                                  try {
                                    await fetch("/api/affiliates/" + aff.id + "/tipalti-invite", { method: "POST" });
                                    fetchAffiliates();
                                  } finally { setTipaltiInviting(null); }
                                }}
                                style={{ padding: "6px 12px", background: THEME.accentLight, color: "#fff", border: "none", borderRadius: 6, cursor: tipaltiInviting ? "not-allowed" : "pointer", fontSize: 11 }}
                              >
                                {tipaltiInviting === aff.id ? "Sending…" : "Invite to Tipalti"}
                              </button>
                            )}
                            {aff.tipaltiStatus === "pending" && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #b4530960", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>Awaiting bank details</span>
                                <button
                                  disabled={!!tipaltiRefreshing}
                                  onClick={async () => {
                                    setTipaltiRefreshing(aff.id);
                                    try {
                                      await fetch("/api/affiliates/" + aff.id + "/tipalti-status");
                                      fetchAffiliates();
                                    } finally { setTipaltiRefreshing(null); }
                                    }
                                  }
                                  style={{ padding: "2px 8px", fontSize: 10, background: "none", border: `1px solid ${THEME.border}`, borderRadius: 4, cursor: tipaltiRefreshing ? "not-allowed" : "pointer" }}
                                >
                                  {tipaltiRefreshing === aff.id ? "…" : "Refresh"}
                                </button>
                              </span>
                            )}
                            {aff.tipaltiStatus === "active" && (
                              <span style={{ background: "#dcfce7", color: THEME.success, border: "1px solid #0d7a3d60", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>Ready to pay</span>
                            )}
                            {aff.tipaltiStatus === "blocked" && (
                              <span style={{ background: "#fee2e2", color: THEME.error, border: "1px solid #b91c1c60", borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>Blocked</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 20, textAlign: "center" as const }}>
                          {[["Clicks", aff.clicks.length, THEME.accentLight], ["Sales", aff.conversions.length, THEME.success], ["Revenue", `$${rev.toFixed(0)}`, THEME.warning]].map(([l, v, c]) => (
                            <div key={String(l)}>
                              <div style={{ color: String(c), fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>{String(v)}</div>
                              <div style={{ color: THEME.textMuted, fontSize: 10 }}>{String(l)}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                          <button onClick={() => copyLink(aff.id)} style={{ background: copied === aff.id ? THEME.successBg : "#dbeafe", border: `1px solid ${copied === aff.id ? THEME.success : THEME.accentLight}`, borderRadius: 6, padding: "6px 12px", color: copied === aff.id ? THEME.success : THEME.accentLight, cursor: "pointer", fontSize: 11 }}>{copied === aff.id ? "✓ Copied" : "Sales link"}</button>
                          {recruitLink && <button onClick={() => copyRecruitLink(aff.referralCode!)} style={{ background: copiedRecruit === aff.referralCode ? THEME.successBg : "#dbeafe", border: `1px solid ${copiedRecruit === aff.referralCode ? THEME.success : THEME.accentLight}`, borderRadius: 6, padding: "6px 12px", color: copiedRecruit === aff.referralCode ? THEME.success : THEME.accentLight, cursor: "pointer", fontSize: 11 }}>{copiedRecruit === aff.referralCode ? "✓ Copied" : "Recruit link"}</button>}
                          <Link href={`/portal?preview=${aff.id}`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", background: "#ede9fe", border: "1px solid #6d28d9", borderRadius: 6, color: "#6d28d9", cursor: "pointer", fontSize: 11, textDecoration: "none" }}>View as Affiliate</Link>
                          {aff.status === "pending" && (
                            <>
                              <button onClick={() => approveAffiliate(aff.id)} style={{ padding: "6px 12px", background: THEME.successBg, border: "none", borderRadius: 6, color: THEME.success, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Approve</button>
                              <button onClick={() => rejectAffiliate(aff.id)} style={{ padding: "6px 12px", background: THEME.errorBg, border: "none", borderRadius: 6, color: THEME.error, cursor: "pointer", fontSize: 11 }}>Reject</button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 40 }}>No affiliates found</div>}
              </div>
            </>
          )}

          {!loading && tab === "mlm" && (
            <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 28 }} data-tour="mlm-content">
              <div style={{ color: THEME.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>Network Hierarchy <Tooltip text="Shows the full network of who recruited who. Each level earns a smaller override commission." /></div>
              <MLMTree affiliates={affiliates} rootId={null} depth={0} TIERS={TIERS} getVolumeTier={getVolumeTier} />
              {affiliates.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 40 }}>No affiliates yet</div>}
            </div>
          )}

          {!loading && tab === "leaderboard" && (() => {
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const ranked =
              leaderboardMode === "month"
                ? [...activeAffiliates]
                    .map((a) => ({
                      aff: a,
                      sales: a.conversions.filter((c) => new Date(c.createdAt) >= thisMonthStart).reduce((s, c) => s + c.amount, 0),
                      total: a.conversions.reduce((s, c) => s + c.amount, 0),
                      recruits: a.children?.length ?? 0,
                    }))
                    .sort((a, b) => b.sales - a.sales)
                : leaderboardMode === "all"
                  ? [...activeAffiliates]
                      .map((a) => ({
                        aff: a,
                        sales: a.conversions.filter((c) => new Date(c.createdAt) >= thisMonthStart).reduce((s, c) => s + c.amount, 0),
                        total: a.conversions.reduce((s, c) => s + c.amount, 0),
                        recruits: a.children?.length ?? 0,
                      }))
                      .sort((a, b) => b.total - a.total)
                  : [...activeAffiliates]
                      .map((a) => ({
                        aff: a,
                        sales: a.conversions.filter((c) => new Date(c.createdAt) >= thisMonthStart).reduce((s, c) => s + c.amount, 0),
                        total: a.conversions.reduce((s, c) => s + c.amount, 0),
                        recruits: a.children?.length ?? 0,
                      }))
                      .sort((a, b) => b.recruits - a.recruits);
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                  {(["month", "all", "recruits"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setLeaderboardMode(m)} className="admin-touch-btn"
                      style={{ minHeight: 44, padding: "10px 18px", borderRadius: 8, border: `1px solid ${leaderboardMode === m ? THEME.accentLight : THEME.border}`, background: leaderboardMode === m ? "#e0f2fe" : THEME.card, color: leaderboardMode === m ? THEME.accent : THEME.text, cursor: "pointer", fontSize: 13, fontWeight: leaderboardMode === m ? 700 : 400 }}>
                      {m === "month" ? "This Month" : m === "all" ? "All Time" : "Most Recruits"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ranked.map((r, i) => {
                    const vol = getVolumeTier(getCurrentMonthRevenue(r.aff.conversions));
                    const isTop3 = i < 3;
                    const medal = medals[i];
                    return (
                      <div
                        key={r.aff.id}
                        style={{
                          background: isTop3 ? (i === 0 ? "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)" : i === 1 ? "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)" : "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)") : THEME.card,
                          border: `2px solid ${isTop3 ? (i === 0 ? "#eab308" : i === 1 ? "#94a3b8" : "#ea580c") : THEME.border}`,
                          borderRadius: 12,
                          padding: isTop3 ? 24 : 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          animation: isTop3 ? "pulse 2s ease-in-out infinite" : undefined,
                        }}
                      >
                        <div style={{ width: isTop3 ? 48 : 36, fontSize: isTop3 ? 28 : 18, fontWeight: 800, color: THEME.textMuted, flexShrink: 0 }}>{isTop3 ? medal : `#${i + 1}`}</div>
                        <div style={{ width: isTop3 ? 56 : 42, height: isTop3 ? 56 : 42, borderRadius: "50%", background: TIERS[vol.tierKey]?.bg, border: `2px solid ${TIERS[vol.tierKey]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isTop3 ? 22 : 16, fontWeight: 800, color: TIERS[vol.tierKey]?.color, flexShrink: 0 }}>{r.aff.name.charAt(0)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: isTop3 ? 18 : 14, color: THEME.text }}>{r.aff.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                            <TierBadge tier={vol.tierKey} TIERS={TIERS} />
                            <span style={{ color: THEME.textMuted, fontSize: 12 }}>{leaderboardMode === "month" ? `$${r.sales.toLocaleString()} this month` : leaderboardMode === "all" ? `$${r.total.toLocaleString()} total` : `${r.recruits} recruits`}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: THEME.warning, fontFamily: "monospace", fontSize: isTop3 ? 20 : 16, fontWeight: 800 }}>${(leaderboardMode === "month" ? r.sales : r.total).toLocaleString()}</div>
                          <div style={{ color: THEME.textMuted, fontSize: 11 }}>{r.recruits} recruits</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {ranked.length === 0 && <div style={{ color: THEME.textMuted, textAlign: "center", padding: 40 }}>No affiliates yet</div>}
              </div>
            );
          })()}

          {!loading && tab === "payouts" && (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" as const, alignItems: "center" }}>
                <button
                  onClick={() => {
                    setMassPayoutResults(null);
                    const withBalance = activeAffiliates.filter(a => {
                      const vol = getVolumeTier(getCurrentMonthRevenue(a.conversions));
                      const approvedCommission = a.conversions.filter((c: { status?: string }) => c.status === "approved").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                      const mlmKids = activeAffiliates.filter(c => c.parentId === a.id);
                      const mlmApproved = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status === "approved").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                      return approvedCommission + mlmApproved > 0;
                    });
                    setMassPayoutSelected(new Set(withBalance.filter(a => a.tipaltiStatus === "active").map(a => a.id)));
                    setShowMassPayoutModal(true);
                  }}
                  style={{ padding: "10px 18px", background: "#6d28d9", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  Mass Payout
                </button>
              </div>
              <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" as const }}>
                <StatCard label="Unpaid (pending + approved)" value={`$${activeAffiliates.reduce((s, a) => {
                  const vol = getVolumeTier(getCurrentMonthRevenue(a.conversions));
                  const unpaid = a.conversions.filter((c: { status?: string }) => c.status !== "paid").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                  const mlmKids = activeAffiliates.filter(c => c.parentId === a.id);
                  const mlmUnpaid = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status !== "paid").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                  return s + unpaid + mlmUnpaid;
                }, 0).toFixed(2)}`} accent="#f0c040" />
                <StatCard label="Total paid (history)" value={`$${activeAffiliates.reduce((s, a) => s + (a.payouts?.reduce((x, p) => x + p.amount, 0) ?? 0), 0).toFixed(2)}`} accent="#8a7aca" />
                <StatCard label="Active Affiliates" value={activeAffiliates.length} accent="#3a8a5a" />
              </div>
              <div className="admin-table-wrap" style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 90px 90px 120px 100px", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${THEME.border}`, fontWeight: 700, fontSize: 11, color: THEME.textMuted, textTransform: "uppercase" as const, minWidth: 640 }}>
                  <div>Affiliate</div><div>State</div><div>Rate</div><div>Unpaid</div><div>Paid</div><div>History</div><div></div>
                </div>
                {activeAffiliates.map((aff, i) => {
                  const vol = getVolumeTier(getCurrentMonthRevenue(aff.conversions));
                  const unpaidConv = aff.conversions.filter((c: { status?: string }) => c.status !== "paid").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                  const mlmKids = activeAffiliates.filter(c => c.parentId === aff.id);
                  const mlm = mlmKids.reduce((s, c) => s + c.conversions.filter((cv: { status?: string }) => cv.status !== "paid").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                  const approvedCommission = aff.conversions.filter((c: { status?: string }) => c.status === "approved").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                  const mlmApproved = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status === "approved").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                  const totalUnpaid = unpaidConv + mlm;
                  const totalPaid = aff.payouts?.reduce((x, p) => x + p.amount, 0) ?? 0;
                  const payNowAmount = approvedCommission + mlmApproved;
                  return (
                    <div key={aff.id} style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 90px 90px 120px 100px", gap: 12, padding: "14px 20px", borderBottom: i < activeAffiliates.length - 1 ? `1px solid ${THEME.border}` : "none", alignItems: "center", minWidth: 640 }}>
                      <div style={{ color: THEME.text, fontSize: 13 }}>{aff.name}<br /><span style={{ color: THEME.textMuted, fontSize: 11 }}>{aff.email}</span></div>
                      <div style={{ color: THEME.textMuted, fontSize: 12 }}>{aff.state || "—"}</div>
                      <div><TierBadge tier={vol.tierKey} showTooltip TIERS={TIERS} /><span style={{ color: THEME.accentLight, fontSize: 11, marginLeft: 4 }}>{vol.rate}%</span></div>
                      <div style={{ color: THEME.warning, fontFamily: "monospace", fontSize: 13 }}>${totalUnpaid.toFixed(2)}</div>
                      <div style={{ color: "#6d28d9", fontFamily: "monospace", fontSize: 13 }}>${totalPaid.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: THEME.textMuted }}>
                        {aff.payouts?.length ? aff.payouts.slice(0, 3).map(p => (
                          <div key={p.id}>${p.amount.toFixed(0)} {PAYMENT_METHODS.find(m => m.value === p.method)?.label ?? p.method} {new Date(p.paidAt).toLocaleDateString()}</div>
                        )) : "—"}
                      </div>
                      <div>
                        {payNowAmount > 0 && <button onClick={() => openPayModal(aff.id, aff.name, payNowAmount, aff.tipaltiStatus)} style={{ padding: "4px 10px", background: "#ede9fe", border: "none", borderRadius: 4, color: "#6d28d9", cursor: "pointer", fontSize: 11 }}>Pay Now</button>}
                      </div>
                    </div>
                  );
                })}
                {activeAffiliates.length === 0 && <div style={{ color: THEME.textMuted, fontSize: 13, textAlign: "center", padding: 40 }}>No data yet</div>}
              </div>
            </>
          )}

          {!loading && tab === "states" && (
            <>
              {statesOverTwoMasters.length > 0 && (
                <div style={{ background: THEME.warningBg, border: `1px solid ${THEME.warning}`, borderRadius: 12, padding: 16, marginBottom: 20, color: THEME.warning }}>
                  <strong>States with more than 2 Master affiliates:</strong> {statesOverTwoMasters.join(", ")} — Bobby wants 1–2 per state max.
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
                {Object.entries(byState).sort(([a], [b]) => (a === "—" ? 1 : 0) - (b === "—" ? 1 : 0) || a.localeCompare(b)).map(([state, list]) => (
                  <div key={state} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 16, minWidth: 180 }}>
                    <div style={{ color: THEME.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{state}</div>
                    <div style={{ color: THEME.text, fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{list.length}</div>
                    <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 4 }}>{settings.tiers.length ? settings.tiers[settings.tiers.length - 1]?.name : "Top"} tier: {list.filter(a => getVolumeTier(getCurrentMonthRevenue(a.conversions)).tierKey === topTierKey).length}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && tab === "calculator" && (() => {
            const vol = getVolumeTier(calcSales);
            const direct = (calcSales * vol.rate) / 100;
            const mlm2Rate = TIERS[vol.tierKey]?.mlm2 ?? 3;
            const mlmOverride = 5 * calcSales * (mlm2Rate / 100);
            const totalMonthly = direct + mlmOverride;
            const totalAnnual = totalMonthly * 12;
            const shareText = `I could earn $${totalMonthly.toFixed(0)}/month with the BLL affiliate program. Join using my link: ${settings.websiteUrl || "[your link]"}`;
            return (
              <div style={{ maxWidth: 560 }}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ color: THEME.textMuted, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Estimated monthly sales</label>
                  <input type="range" min={0} max={20000} step={100} value={calcSales} onChange={e => setCalcSales(Number(e.target.value))}
                    style={{ width: "100%", accentColor: THEME.accent }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: THEME.textMuted }}><span>$0</span><span style={{ fontFamily: "monospace", color: THEME.text, fontWeight: 700 }}>${calcSales.toLocaleString()}</span><span>$20,000</span></div>
                </div>
                <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>Your tier at this volume</div>
                  <TierBadge tier={vol.tierKey} TIERS={TIERS} /> <span style={{ color: THEME.accentLight, marginLeft: 6 }}>{vol.rate}% direct</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>Direct commission</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: THEME.warning, fontFamily: "monospace" }}>${direct.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: THEME.textMuted }}>per month</div>
                  </div>
                  <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 11, color: THEME.textMuted, marginBottom: 4 }}>MLM override (5 recruits)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: THEME.accentLight, fontFamily: "monospace" }}>${mlmOverride.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: THEME.textMuted }}>{mlm2Rate}% × 5 × ${calcSales.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ background: THEME.card, border: `2px solid ${THEME.accentLight}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: THEME.textMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4 }}>Total estimated monthly</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: THEME.text, fontFamily: "monospace" }}>${totalMonthly.toFixed(2)}</div>
                  <div style={{ fontSize: 13, color: THEME.textMuted, marginTop: 4 }}>Annual projection: <strong style={{ color: THEME.text }}>${totalAnnual.toLocaleString()}</strong></div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: THEME.textMuted, fontWeight: 700, marginBottom: 8 }}>Breakdown</div>
                  <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: 12, fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span>At ${calcSales.toLocaleString()}/month sales with 5 recruits each doing ${calcSales.toLocaleString()}:</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Your direct ({vol.rate}%)</span><span style={{ fontFamily: "monospace" }}>${direct.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Level 2 overrides ({mlm2Rate}% × 5 × ${calcSales.toLocaleString()})</span><span style={{ fontFamily: "monospace" }}>${mlmOverride.toFixed(2)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${THEME.border}`, fontWeight: 700 }}><span>Total</span><span style={{ fontFamily: "monospace" }}>${totalMonthly.toFixed(2)}/mo, ${totalAnnual.toLocaleString()}/yr</span></div>
                  </div>
                </div>
                <button type="button" onClick={async () => { await navigator.clipboard.writeText(shareText); setCalcShareCopied(true); setTimeout(() => setCalcShareCopied(false), 2000); }}
                  style={{ padding: "10px 20px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {calcShareCopied ? "Copied!" : "Share this calculation"}
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Pay Now Modal */}
      {showPayModal && payModalData && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 32, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ color: THEME.text, fontSize: 18, fontWeight: 700 }}>Pay Now — {payModalData.affName}</div>
              <button onClick={() => { setShowPayModal(false); setPayModalData(null); }} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Amount ($)</label>
              <input type="number" step="0.01" value={payModalData.amount} readOnly
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Payment method</label>
              <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }}>
                {(payModalData.tipaltiStatus === "active" ? PAYMENT_METHODS : PAYMENT_METHODS.filter(m => m.value !== "tipalti")).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Reference / Note (e.g. transaction ID)</label>
              <input type="text" placeholder="Optional" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setShowPayModal(false); setPayModalData(null); }} style={{ flex: 1, padding: "11px 0", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textMuted, cursor: "pointer" }}>Cancel</button>
              <button onClick={confirmPayModal} style={{ flex: 2, padding: "11px 0", background: "#6d28d9", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Payout Modal */}
      {showMassPayoutModal && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 32, width: 560, maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ color: THEME.text, fontSize: 18, fontWeight: 700 }}>Mass Payout via Tipalti</div>
              <button onClick={() => { setShowMassPayoutModal(false); setMassPayoutResults(null); }} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ color: THEME.textMuted, fontSize: 13, marginBottom: 16 }}>Select affiliates to pay. Only those with Tipalti &quot;Ready to pay&quot; and unpaid balance are listed.</p>
            {!massPayoutResults ? (
              <>
                <div style={{ maxHeight: 320, overflowY: "auto", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 16 }}>
                  {activeAffiliates.filter(a => {
                    const vol = getVolumeTier(getCurrentMonthRevenue(a.conversions));
                    const approvedCommission = a.conversions.filter((c: { status?: string }) => c.status === "approved").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                    const mlmKids = activeAffiliates.filter(c => c.parentId === a.id);
                    const mlmApproved = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status === "approved").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                    return approvedCommission + mlmApproved > 0;
                  }).map(aff => {
                    const vol = getVolumeTier(getCurrentMonthRevenue(aff.conversions));
                    const approvedCommission = aff.conversions.filter((c: { status?: string }) => c.status === "approved").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0);
                    const mlmKids = activeAffiliates.filter(c => c.parentId === aff.id);
                    const mlmApproved = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status === "approved").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0);
                    const amountOwed = approvedCommission + mlmApproved;
                    const canPay = aff.tipaltiStatus === "active";
                    return (
                      <div key={aff.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${THEME.border}` }}>
                        <input
                          type="checkbox"
                          checked={massPayoutSelected.has(aff.id)}
                          onChange={e => setMassPayoutSelected(prev => { const n = new Set(prev); if (e.target.checked) n.add(aff.id); else n.delete(aff.id); return n; })}
                          disabled={!canPay}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: THEME.text, fontSize: 13, fontWeight: 600 }}>{aff.name}</div>
                          <div style={{ color: THEME.textMuted, fontSize: 11 }}>${amountOwed.toFixed(2)} owed · {aff.tipaltiStatus === "active" ? "Ready" : aff.tipaltiStatus === "pending" ? "Awaiting details" : aff.tipaltiStatus ?? "Not set up"}</div>
                        </div>
                        {!canPay && <span style={{ fontSize: 11, color: THEME.textMuted }}>—</span>}
                      </div>
                    );
                  })}
                  {activeAffiliates.filter(a => { const vol = getVolumeTier(getCurrentMonthRevenue(a.conversions)); const approvedCommission = a.conversions.filter((c: { status?: string }) => c.status === "approved").reduce((x: number, c: { amount: number }) => x + c.amount * vol.rate / 100, 0); const mlmKids = activeAffiliates.filter(c => c.parentId === a.id); const mlmApproved = mlmKids.reduce((s2, c) => s2 + c.conversions.filter((cv: { status?: string }) => cv.status === "approved").reduce((x: number, cv: { amount: number }) => x + cv.amount * (TIERS[vol.tierKey]?.mlm2 ?? 3) / 100, 0), 0); return approvedCommission + mlmApproved > 0; }).length === 0 && <div style={{ padding: 24, color: THEME.textMuted, textAlign: "center" }}>No affiliates with unpaid balance</div>}
                </div>
                {massPayoutSending && <div style={{ marginBottom: 16, height: 6, background: THEME.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: "40%", height: "100%", background: THEME.accentLight, borderRadius: 3, animation: "pulse 1s ease infinite" }} /></div>}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => { setShowMassPayoutModal(false); setMassPayoutResults(null); }} style={{ padding: "10px 20px", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textMuted, cursor: "pointer" }}>Cancel</button>
                  <button
                    disabled={massPayoutSending || massPayoutSelected.size === 0}
                    onClick={async () => {
                      setMassPayoutSending(true);
                      try {
                        const res = await fetch("/api/tipalti/mass-payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ affiliateIds: [...massPayoutSelected] }) });
                        const data = await res.json().catch(() => ({}));
                        setMassPayoutResults((data.results ?? []).map((r: { affiliateId: string; success: boolean; error?: string }) => ({ affiliateId: r.affiliateId, success: r.success, error: r.error })));
                        if (data.results?.length) fetchAffiliates();
                      } finally { setMassPayoutSending(false); }
                    }}
                    style={{ padding: "10px 20px", background: massPayoutSelected.size === 0 || massPayoutSending ? "#cbd5e1" : "#6d28d9", color: "#fff", border: "none", borderRadius: 8, cursor: massPayoutSelected.size === 0 || massPayoutSending ? "not-allowed" : "pointer", fontWeight: 700 }}
                  >
                    Send All Payments
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  {massPayoutResults.map((r, i) => {
                    const aff = activeAffiliates.find(a => a.id === r.affiliateId);
                    return (
                      <div key={r.affiliateId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: i < massPayoutResults.length - 1 ? `1px solid ${THEME.border}` : "none" }}>
                        <span style={{ color: r.success ? THEME.success : THEME.error, fontWeight: 700 }}>{r.success ? "✓" : "✗"}</span>
                        <span style={{ color: THEME.text, fontSize: 13 }}>{aff?.name ?? r.affiliateId}</span>
                        {r.error && <span style={{ color: THEME.textMuted, fontSize: 11 }}>{r.error}</span>}
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => { setShowMassPayoutModal(false); setMassPayoutResults(null); }} style={{ padding: "10px 20px", background: THEME.border, border: "none", borderRadius: 8, cursor: "pointer" }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Log Sale Modal */}
      {showLogSale && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 32, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ color: THEME.text, fontSize: 18, fontWeight: 700 }}>Log Sale / Conversion</div>
              <button onClick={() => setShowLogSale(false)} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Affiliate</label>
              <select value={logSaleForm.affiliateId} onChange={e => setLogSaleForm(f => ({ ...f, affiliateId: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }}>
                <option value="">— Select —</option>
                {affiliates.map(a => <option key={a.id} value={a.id}>{a.name} ({a.email})</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Sale amount ($)</label>
              <input type="number" step="0.01" value={logSaleForm.amount} onChange={e => setLogSaleForm(f => ({ ...f, amount: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Date</label>
              <input type="date" value={logSaleForm.date} onChange={e => setLogSaleForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Product / Program (optional)</label>
              <input type="text" placeholder="e.g. BLL, Live, Membership" value={logSaleForm.product} onChange={e => setLogSaleForm(f => ({ ...f, product: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Note (optional)</label>
              <input type="text" placeholder="Internal note" value={logSaleForm.note} onChange={e => setLogSaleForm(f => ({ ...f, note: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowLogSale(false)} style={{ flex: 1, padding: "11px 0", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textMuted, cursor: "pointer" }}>Cancel</button>
              <button onClick={logSale} style={{ flex: 2, padding: "11px 0", background: THEME.success, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Log Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Affiliate Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: THEME.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: isMobile ? 0 : 24 }}>
          <div className={isMobile ? "admin-add-modal-mobile" : ""} style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 16, padding: 32, width: 440, maxHeight: isMobile ? "100%" : "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ color: THEME.text, fontSize: 18, fontWeight: 700 }}>Add Affiliate</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: THEME.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {[["Name", "name", "text"], ["Email", "email", "email"]].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>{label}</label>
                <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Tier</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }}>
                {Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.commission}%)</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>State / Region</label>
              <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. CA, TX"
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: THEME.textMuted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Recruited By (referrer)</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                style={{ width: "100%", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", color: THEME.text, fontSize: 14, outline: "none" }}>
                <option value="">— None —</option>
                {activeAffiliates.map(a => { const v = getVolumeTier(getCurrentMonthRevenue(a.conversions)); return <option key={a.id} value={a.id}>{a.name} ({TIERS[v.tierKey]?.label ?? v.tierKey} — earns {TIERS[v.tierKey]?.mlm2 ?? 3}% of their sales)</option>; })}
              </select>
              <div style={{ color: THEME.textMuted, fontSize: 11, marginTop: 6 }}>Who signed them up? That person gets an override % of this affiliate&apos;s sales (see Settings for tier rates).</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px 0", background: "none", border: `1px solid ${THEME.border}`, borderRadius: 8, color: THEME.textMuted, cursor: "pointer" }}>Cancel</button>
              <button onClick={addAffiliate} style={{ flex: 2, padding: "11px 0", background: THEME.accent, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700 }}>Add Affiliate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
