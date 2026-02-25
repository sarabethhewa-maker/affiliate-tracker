"use client";

import { useState, useEffect } from "react";

const TIERS: Record<string, { label: string; color: string; bg: string; commission: number; mlm2: number; mlm3: number }> = {
  master: { label: "Master", color: "#f0c040", bg: "#2a2000", commission: 20, mlm2: 5, mlm3: 2 },
  gold:   { label: "Gold",   color: "#e8834a", bg: "#2a1200", commission: 15, mlm2: 4, mlm3: 1.5 },
  silver: { label: "Silver", color: "#9bb4c8", bg: "#0e1820", commission: 10, mlm2: 3, mlm3: 1 },
};

type Affiliate = {
  id: string;
  name: string;
  email: string;
  tier: string;
  status: string;
  parentId: string | null;
  children: Affiliate[];
  clicks: { id: string }[];
  conversions: { id: string; amount: number }[];
  createdAt: string;
};

function TierBadge({ tier }: { tier: string }) {
  const t = TIERS[tier] ?? TIERS.silver;
  return (
    <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.color}40`, borderRadius: 4, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>
      {t.label}
    </span>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 12, padding: "22px 26px", flex: 1, minWidth: 160 }}>
      <div style={{ color: "#5a6a7a", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8 }}>{label}</div>
      <div style={{ color: accent ?? "#e8f0f8", fontSize: 28, fontWeight: 800, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function MLMTree({ affiliates, rootId = null, depth = 0 }: { affiliates: Affiliate[]; rootId?: string | null; depth?: number }) {
  const children = affiliates.filter(a => a.parentId === rootId);
  if (children.length === 0) return null;
  return (
    <div style={{ paddingLeft: depth === 0 ? 0 : 28, borderLeft: depth > 0 ? "2px solid #1e2530" : "none", marginLeft: depth > 0 ? 14 : 0 }}>
      {children.map(aff => {
        const revenue = aff.conversions.reduce((s, c) => s + c.amount, 0);
        return (
          <div key={aff.id} style={{ marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: TIERS[aff.tier]?.bg, border: `2px solid ${TIERS[aff.tier]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: TIERS[aff.tier]?.color }}>
                {aff.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e8f0f8", fontWeight: 600, fontSize: 14 }}>{aff.name}</div>
                <div style={{ color: "#5a6a7a", fontSize: 11 }}>${revenue.toFixed(0)} revenue · {aff.conversions.length} sales</div>
              </div>
              <TierBadge tier={aff.tier} />
              <div style={{ color: "#2a6a4a", fontSize: 11, background: "#0a1a10", border: "1px solid #1a3a20", borderRadius: 4, padding: "2px 8px" }}>L{depth + 1}</div>
            </div>
            <MLMTree affiliates={affiliates} rootId={aff.id} depth={depth + 1} />
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", tier: "silver", parentId: "" });
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");

  const fetchAffiliates = async () => {
    setLoading(true);
    const res = await fetch("/api/affiliates");
    const data = await res.json();
    setAffiliates(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchAffiliates(); }, []);

  const addAffiliate = async () => {
    if (!form.name || !form.email) return;
    await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, parentId: form.parentId || null }),
    });
    setForm({ name: "", email: "", tier: "silver", parentId: "" });
    setShowAdd(false);
    fetchAffiliates();
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/api/ref/${id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const totalRevenue = affiliates.reduce((s, a) => s + a.conversions.reduce((x, c) => x + c.amount, 0), 0);
  const totalClicks = affiliates.reduce((s, a) => s + a.clicks.length, 0);
  const totalConversions = affiliates.reduce((s, a) => s + a.conversions.length, 0);
  const filtered = affiliates.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "affiliates", label: "Affiliates", icon: "◈" },
    { id: "mlm", label: "MLM Tree", icon: "⋔" },
    { id: "payouts", label: "Payouts", icon: "◎" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060a0e", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e8f0f8", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #060a0e; } ::-webkit-scrollbar-thumb { background: #1e2530; border-radius: 3px; }
        input, select { color-scheme: dark; } button { font-family: inherit; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#0a0f14", borderRight: "1px solid #1e2530", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #1a4a8a, #0a2a5a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⬡</div>
            <div>
              <div style={{ color: "#e8f0f8", fontSize: 13, fontWeight: 800 }}>AffiliateOS</div>
              <div style={{ color: "#3a4a5a", fontSize: 10, letterSpacing: 1 }}>TRACKING PLATFORM</div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: tab === n.id ? "#1a2a40" : "none", border: tab === n.id ? "1px solid #1e4070" : "1px solid transparent", color: tab === n.id ? "#4a90d9" : "#5a6a7a", cursor: "pointer", fontSize: 13, fontWeight: tab === n.id ? 700 : 400, textAlign: "left" as const }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ marginTop: "auto", padding: 20, borderTop: "1px solid #1e2530" }}>
          <div style={{ color: "#3a4a5a", fontSize: 10, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const }}>Active</div>
          <div style={{ color: "#4a90d9", fontFamily: "monospace", fontSize: 22, fontWeight: 700 }}>{affiliates.filter(a => a.status === "active").length}</div>
          <div style={{ color: "#3a8a5a", fontSize: 11, marginTop: 2 }}>{affiliates.length} total enrolled</div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "32px 36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#e8f0f8", marginBottom: 4 }}>
                {tab === "dashboard" && "Dashboard"}
                {tab === "affiliates" && "Affiliates"}
                {tab === "mlm" && "MLM Network Tree"}
                {tab === "payouts" && "Payout Overview"}
              </h1>
              <div style={{ color: "#5a6a7a", fontSize: 13 }}>Bio Longevity Labs · Affiliate Program</div>
            </div>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "linear-gradient(135deg, #1a4a8a, #1a6a9a)", border: "none", borderRadius: 10, padding: "11px 20px", color: "#e8f0f8", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              + Add Affiliate
            </button>
          </div>

          {loading && <div style={{ color: "#5a6a7a", textAlign: "center", padding: 60 }}>Loading...</div>}

          {!loading && tab === "dashboard" && (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" as const }}>
                <StatCard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} accent="#f0c040" />
                <StatCard label="Link Clicks" value={totalClicks} accent="#4a90d9" />
                <StatCard label="Conversions" value={totalConversions} accent="#3a8a5a" />
                <StatCard label="Affiliates" value={affiliates.length} accent="#e8834a" />
              </div>
              <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 12, padding: 24 }}>
                <div style={{ color: "#5a6a7a", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 16 }}>Top Performers</div>
                {[...affiliates].sort((a, b) => b.conversions.reduce((s, c) => s + c.amount, 0) - a.conversions.reduce((s, c) => s + c.amount, 0)).slice(0, 5).map((aff, i) => {
                  const rev = aff.conversions.reduce((s, c) => s + c.amount, 0);
                  return (
                    <div key={aff.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #1e2530" : "none" }}>
                      <div style={{ width: 22, color: "#3a4a5a", fontSize: 12, fontWeight: 700 }}>#{i + 1}</div>
                      <div style={{ flex: 1, color: "#e8f0f8", fontSize: 13 }}>{aff.name}</div>
                      <TierBadge tier={aff.tier} />
                      <div style={{ color: "#f0c040", fontFamily: "monospace", fontSize: 13 }}>${rev.toLocaleString()}</div>
                    </div>
                  );
                })}
                {affiliates.length === 0 && <div style={{ color: "#3a4a5a", fontSize: 13, textAlign: "center", padding: 20 }}>No affiliates yet — add your first one!</div>}
              </div>
            </>
          )}

          {!loading && tab === "affiliates" && (
            <>
              <input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: "100%", marginBottom: 16, background: "#0d1117", border: "1px solid #1e2530", borderRadius: 8, padding: "10px 14px", color: "#e8f0f8", fontSize: 13, outline: "none" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map(aff => {
                  const rev = aff.conversions.reduce((s, c) => s + c.amount, 0);
                  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/ref/${aff.id}`;
                  return (
                    <div key={aff.id} style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 10, padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: "50%", background: TIERS[aff.tier]?.bg, border: `2px solid ${TIERS[aff.tier]?.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: TIERS[aff.tier]?.color }}>{aff.name.charAt(0)}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                            <span style={{ color: "#e8f0f8", fontWeight: 700, fontSize: 14 }}>{aff.name}</span>
                            <TierBadge tier={aff.tier} />
                          </div>
                          <div style={{ color: "#4a6a8a", fontSize: 11, fontFamily: "monospace" }}>{link}</div>
                        </div>
                        <div style={{ display: "flex", gap: 20, textAlign: "center" as const }}>
                          {[["Clicks", aff.clicks.length, "#4a90d9"], ["Sales", aff.conversions.length, "#3a8a5a"], ["Revenue", `$${rev.toFixed(0)}`, "#f0c040"]].map(([l, v, c]) => (
                            <div key={String(l)}>
                              <div style={{ color: String(c), fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>{String(v)}</div>
                              <div style={{ color: "#3a4a5a", fontSize: 10 }}>{String(l)}</div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => copyLink(aff.id)}
                          style={{ background: copied === aff.id ? "#1a3a20" : "#1a2a40", border: `1px solid ${copied === aff.id ? "#3a8a5a" : "#1e4070"}`, borderRadius: 6, padding: "6px 12px", color: copied === aff.id ? "#3a8a5a" : "#4a90d9", cursor: "pointer", fontSize: 11 }}>
                          {copied === aff.id ? "✓ Copied" : "Copy Link"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div style={{ color: "#3a4a5a", fontSize: 13, textAlign: "center", padding: 40 }}>No affiliates found</div>}
              </div>
            </>
          )}

          {!loading && tab === "mlm" && (
            <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 12, padding: 28 }}>
              <div style={{ color: "#5a6a7a", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 20 }}>Network Hierarchy</div>
              <MLMTree affiliates={affiliates} rootId={null} depth={0} />
              {affiliates.length === 0 && <div style={{ color: "#3a4a5a", fontSize: 13, textAlign: "center", padding: 40 }}>No affiliates yet</div>}
            </div>
          )}

          {!loading && tab === "payouts" && (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" as const }}>
                <StatCard label="Total Owed" value={`$${affiliates.reduce((s, a) => s + a.conversions.reduce((x, c) => x + c.amount, 0) * (TIERS[a.tier]?.commission ?? 10) / 100, 0).toFixed(2)}`} accent="#f0c040" />
                <StatCard label="Active Affiliates" value={affiliates.filter(a => a.status === "active").length} accent="#3a8a5a" />
              </div>
              <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 12, overflow: "hidden" }}>
                {affiliates.map((aff, i) => {
                  const t = TIERS[aff.tier] ?? TIERS.silver;
                  const rev = aff.conversions.reduce((s, c) => s + c.amount, 0);
                  const direct = rev * t.commission / 100;
                  const mlmKids = affiliates.filter(c => c.parentId === aff.id);
                  const mlm = mlmKids.reduce((s, c) => s + c.conversions.reduce((x, cv) => x + cv.amount, 0) * t.mlm2 / 100, 0);
                  return (
                    <div key={aff.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 100px 110px", padding: "14px 20px", borderBottom: i < affiliates.length - 1 ? "1px solid #1e2530" : "none", alignItems: "center" }}>
                      <div style={{ color: "#e8f0f8", fontSize: 13 }}>{aff.name}<br /><span style={{ color: "#3a4a5a", fontSize: 11 }}>{aff.email}</span></div>
                      <div><TierBadge tier={aff.tier} /></div>
                      <div style={{ color: "#4a90d9", fontFamily: "monospace", fontSize: 13 }}>{t.commission}%</div>
                      <div style={{ color: "#8a9aa8", fontFamily: "monospace", fontSize: 13 }}>${rev.toFixed(0)}</div>
                      <div style={{ color: "#f0c040", fontFamily: "monospace", fontSize: 13 }}>${direct.toFixed(2)}</div>
                      <div style={{ color: mlm > 0 ? "#3a8a5a" : "#3a4a5a", fontFamily: "monospace", fontSize: 13 }}>+${mlm.toFixed(2)}</div>
                    </div>
                  );
                })}
                {affiliates.length === 0 && <div style={{ color: "#3a4a5a", fontSize: 13, textAlign: "center", padding: 40 }}>No data yet</div>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Affiliate Modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#0d1117", border: "1px solid #1e2530", borderRadius: 16, padding: 32, width: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ color: "#e8f0f8", fontSize: 18, fontWeight: 700 }}>Add Affiliate</div>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", color: "#5a6a7a", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {[["Name", "name", "text"], ["Email", "email", "email"]].map(([label, key, type]) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={{ color: "#5a6a7a", fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>{label}</label>
                <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", background: "#060a0e", border: "1px solid #1e2530", borderRadius: 8, padding: "10px 14px", color: "#e8f0f8", fontSize: 14, outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#5a6a7a", fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Tier</label>
              <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                style={{ width: "100%", background: "#060a0e", border: "1px solid #1e2530", borderRadius: 8, padding: "10px 14px", color: "#e8f0f8", fontSize: 14, outline: "none" }}>
                {Object.entries(TIERS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.commission}%)</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: "#5a6a7a", fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1 }}>Recruited By</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                style={{ width: "100%", background: "#060a0e", border: "1px solid #1e2530", borderRadius: 8, padding: "10px 14px", color: "#e8f0f8", fontSize: 14, outline: "none" }}>
                <option value="">— None —</option>
                {affiliates.map(a => <option key={a.id} value={a.id}>{a.name} ({TIERS[a.tier]?.label})</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px 0", background: "none", border: "1px solid #1e2530", borderRadius: 8, color: "#5a6a7a", cursor: "pointer" }}>Cancel</button>
              <button onClick={addAffiliate} style={{ flex: 2, padding: "11px 0", background: "#1a4a8a", border: "none", borderRadius: 8, color: "#e8f0f8", cursor: "pointer", fontWeight: 700 }}>Add Affiliate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
