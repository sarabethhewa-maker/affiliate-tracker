"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Papa from "papaparse";

const THEME = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1a1a1a",
  textMuted: "#4a5568",
  accent: "#1e3a5f",
  success: "#0d7a3d",
  successBg: "#dcfce7",
  warning: "#b45309",
  warningBg: "#fef3c7",
  error: "#b91c1c",
  errorBg: "#fee2e2",
};

const COLUMN_OPTIONS = [
  "Name",
  "Email",
  "Phone",
  "Social Handle",
  "Website URL",
  "Coupon Code",
  "Tier",
  "Gross Conversions",
  "Approved Conversions",
  "Rejected Conversions",
  "Pending Conversions",
  "Total Revenue",
  "Total Payout",
  "Commission Rate",
  "Skip",
] as const;

const CSV_TEMPLATE =
  "name,email,phone,social_handle,website_url,coupon_code,tier,gross_conversions,approved_conversions,rejected_conversions,pending_conversions,net_revenue,net_payout,commission_rate\nJane Doe,jane@example.com,(555) 123-4567,@jane,https://example.com,JANE15,silver,50,42,5,3,5000.00,500.00,10\n";

type ImportRow = {
  name: string;
  email?: string;
  tier?: string;
  phone?: string;
  socialHandle?: string;
  websiteUrl?: string;
  couponCode?: string;
  grossConversions?: number;
  approvedConversions?: number;
  rejectedConversions?: number;
  pendingConversions?: number;
  totalRevenue?: number;
  totalPayout?: number;
  commissionRate?: number;
  referred_by_email?: string;
  notes?: string;
};

/** Column mapping: display label (matches COLUMN_OPTIONS) or "skip". */
type ColumnMapping = (typeof COLUMN_OPTIONS)[number];

type ImportLogEntry = {
  id: string;
  method: string;
  totalCount: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  createdAt: string;
};

export default function ImportAffiliatesTab({ onImport }: { onImport: () => void }) {
  const [method, setMethod] = useState<"csv" | "paste" | "tapaffiliate" | "goaffpro" | "tune">("csv");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<"active" | "pending">("active");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    updated: number;
    skipped: number;
    errors: number;
    summary?: {
      tierBreakdown?: { silver: number; gold: number; master: number };
      totalHistoricalRevenue?: number;
      totalHistoricalPayouts?: number;
      skippedReasons?: { row: number; reason: string }[];
    };
  } | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [pasteParsed, setPasteParsed] = useState<ImportRow[]>([]);
  const [pasteTier, setPasteTier] = useState("0");
  const [tapApiKey, setTapApiKey] = useState("");
  const [tapAffiliates, setTapAffiliates] = useState<ImportRow[]>([]);
  const [tapConnected, setTapConnected] = useState(false);
  const [goToken, setGoToken] = useState("");
  const [goAffiliates, setGoAffiliates] = useState<ImportRow[]>([]);
  const [goConnected, setGoConnected] = useState(false);
  const [tuneApiKey, setTuneApiKey] = useState("");
  const [tuneNetworkId, setTuneNetworkId] = useState("");
  const [tuneAffiliates, setTuneAffiliates] = useState<ImportRow[]>([]);
  const [tuneConnected, setTuneConnected] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLogEntry[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [autoDetectionRan, setAutoDetectionRan] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImportLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/import-log");
      if (res.ok) {
        const data = await res.json();
        setImportLogs(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const runImport = useCallback(
    async (rows: ImportRow[], importMethod: string) => {
      setImporting(true);
      setImportResult(null);
      try {
        const res = await fetch("/api/affiliates/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliates: rows,
            skipDuplicates,
            updateExisting,
            defaultStatus,
            method: importMethod,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setImportResult({
            imported: data.imported ?? 0,
            updated: data.updated ?? 0,
            skipped: data.skipped ?? 0,
            errors: data.errors ?? 0,
            summary: data.summary ?? undefined,
          });
          onImport();
          loadImportLogs();
        } else {
          setImportResult({ imported: 0, updated: 0, skipped: 0, errors: 1 });
        }
      } catch {
        setImportResult({ imported: 0, updated: 0, skipped: 0, errors: 1 });
      } finally {
        setImporting(false);
      }
    },
    [skipDuplicates, updateExisting, defaultStatus, onImport, loadImportLogs]
  );

  const methods: { id: typeof method; label: string }[] = [
    { id: "csv", label: "CSV Upload" },
    { id: "paste", label: "Paste List" },
    { id: "tapaffiliate", label: "TapAffiliate" },
    { id: "goaffpro", label: "GoAffPro" },
    { id: "tune", label: "Tune (HasOffers)" },
  ];

  const mapCsvToRows = useCallback((): ImportRow[] => {
    const num = (raw: string) => parseFloat(raw.replace(/[$,]/g, "")) || 0;
    const int = (raw: string) => Math.floor(num(raw)) || 0;
    return csvRows
      .map((row) => {
        const out: Record<string, string | number | undefined> = {};
        csvHeaders.forEach((h) => {
          const mapped = columnMap[h] || "Skip";
          if (mapped === "Skip") return;
          const raw = row[h] != null ? String(row[h]).trim() : "";
          if (mapped !== "Name" && raw === "") return;
          if (mapped === "Name") out.name = raw;
          else if (mapped === "Email") out.email = raw;
          else if (mapped === "Tier") out.tier = raw;
          else if (mapped === "Phone") out.phone = raw;
          else if (mapped === "Social Handle") out.socialHandle = raw;
          else if (mapped === "Website URL") out.websiteUrl = raw;
          else if (mapped === "Coupon Code") out.couponCode = raw;
          else if (mapped === "Gross Conversions") out.grossConversions = int(raw);
          else if (mapped === "Approved Conversions") out.approvedConversions = int(raw);
          else if (mapped === "Rejected Conversions") out.rejectedConversions = int(raw);
          else if (mapped === "Pending Conversions") out.pendingConversions = int(raw);
          else if (mapped === "Total Revenue") out.totalRevenue = num(raw);
          else if (mapped === "Total Payout") out.totalPayout = num(raw);
          else if (mapped === "Commission Rate") out.commissionRate = num(raw.replace(/%/g, ""));
        });
        if (!out.name || String(out.name).trim() === "") return null;
        return out as ImportRow;
      })
      .filter(Boolean) as ImportRow[];
  }, [csvRows, csvHeaders, columnMap]);

  const importableCount = mapCsvToRows().length;

  const parsePaste = useCallback(() => {
    const lines = pasteText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const out: ImportRow[] = [];
    for (const line of lines) {
      let name = "";
      let email = "";
      const matchAngle = line.match(/^(.+?)\s*<([^>]+)>$/);
      if (matchAngle) {
        name = matchAngle[1].trim();
        email = matchAngle[2].trim();
      } else {
        const parts = line.split(/[\t,]/).map((p) => p.trim());
        if (parts.length >= 2) {
          name = parts[0];
          email = parts[1];
        } else if (parts.length === 1 && parts[0].includes("@")) {
          email = parts[0];
          name = email.split("@")[0];
        }
      }
      if (email) out.push({ name: name || email, email, tier: pasteTier });
    }
    setPasteParsed(out);
    return out;
  }, [pasteText, pasteTier]);

  const getPasteParsedNow = useCallback((): ImportRow[] => {
    const lines = pasteText.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const out: ImportRow[] = [];
    for (const line of lines) {
      let name = "";
      let email = "";
      const matchAngle = line.match(/^(.+?)\s*<([^>]+)>$/);
      if (matchAngle) {
        name = matchAngle[1].trim();
        email = matchAngle[2].trim();
      } else {
        const parts = line.split(/[\t,]/).map((p) => p.trim());
        if (parts.length >= 2) {
          name = parts[0];
          email = parts[1];
        } else if (parts.length === 1 && parts[0].includes("@")) {
          email = parts[0];
          name = email.split("@")[0];
        }
      }
      if (email) out.push({ name: name || email, email, tier: pasteTier });
    }
    return out;
  }, [pasteText, pasteTier]);

  const handleCsvFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) return;
    setCsvFile(file);
    setImportResult(null);
    setAutoDetectionRan(false);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = (results.data as Record<string, string>[]) || [];
        const isRowEmpty = (r: Record<string, string>) =>
          Object.keys(r).length === 0 || Object.values(r).every((v) => String(v).trim() === "");
        const rows = rawRows.filter((r) => !isRowEmpty(r));
        const headers = rows.length ? Object.keys(rows[0]) : [];
        setCsvRows(rows);
        setCsvHeaders(headers);
        const lower = (s: string) => s.trim().toLowerCase().replace(/_/g, " ");
        const autoMap: Record<string, string> = {};
        const used = new Set<string>();
        const assign = (header: string, option: string) => {
          if (!used.has(option)) {
            autoMap[header] = option;
            used.add(option);
          } else {
            autoMap[header] = "Skip";
          }
        };
        headers.forEach((h) => {
          const l = lower(h);
          if (l === "offer" || l === "program") {
            autoMap[h] = "Skip";
            return;
          }
          if (l === "rejected" || l === "approved") {
            autoMap[h] = "Skip";
            return;
          }
          if (l === "gross_conversions" || l === "gross conversions") {
            assign(h, "Gross Conversions");
            return;
          }
          if (l === "approved_conversions" || l === "approved conversions") {
            assign(h, "Approved Conversions");
            return;
          }
          if (l === "rejected_conversions" || l === "rejected conversions") {
            assign(h, "Rejected Conversions");
            return;
          }
          if (l === "pending_conversions" || l === "pending conversions") {
            assign(h, "Pending Conversions");
            return;
          }
          if (["net_payout", "total_payout", "total payout", "payout"].some((a) => l === a || l.includes(a))) {
            assign(h, "Total Payout");
            return;
          }
          if (["net_revenue", "total_revenue", "total revenue", "revenue"].some((a) => l === a || l.includes(a))) {
            assign(h, "Total Revenue");
            return;
          }
          if (["affiliate", "name", "affiliate_name", "affiliate name"].some((a) => l === a || l.includes(a))) {
            assign(h, "Name");
            return;
          }
          if (l === "email" || l.includes("email")) {
            assign(h, "Email");
            return;
          }
          if (l === "phone" || l.includes("phone")) {
            assign(h, "Phone");
            return;
          }
          if (["social_handle", "social handle", "social", "handle"].some((a) => l === a || l.includes(a))) {
            assign(h, "Social Handle");
            return;
          }
          if (["website_url", "website url", "website"].some((a) => l === a || l.includes(a))) {
            assign(h, "Website URL");
            return;
          }
          if (["coupon_code", "coupon code", "coupon"].some((a) => l === a || l.includes(a))) {
            assign(h, "Coupon Code");
            return;
          }
          if (l === "tier" || l === "level") {
            assign(h, "Tier");
            return;
          }
          if (["commission_rate", "commission rate", "rate"].some((a) => l === a || l.includes(a))) {
            assign(h, "Commission Rate");
            return;
          }
          autoMap[h] = "Skip";
        });
        setColumnMap(autoMap);
        setAutoDetectionRan(true);
      },
    });
  };

  const connectTap = async () => {
    try {
      const res = await fetch("https://api.tapfiliate.com/1.6/affiliates/", {
        headers: { "Api-Key": tapApiKey },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? data?.affiliates ?? [];
      const rows: ImportRow[] = list.map((a: { firstname?: string; lastname?: string; email?: string; meta_data?: string }) => ({
        name: [a.firstname, a.lastname].filter(Boolean).join(" ") || (a.email ?? ""),
        email: a.email ?? "",
        notes: a.meta_data ?? undefined,
      })).filter((r: ImportRow) => r.email);
      setTapAffiliates(rows);
      setTapConnected(true);
    } catch {
      setTapAffiliates([]);
      setTapConnected(false);
    }
  };

  const connectGo = async () => {
    try {
      const res = await fetch("https://api.goaffpro.com/v1/admin/affiliates", {
        headers: { Authorization: `Bearer ${goToken}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? data?.affiliates ?? [];
      const tierMap: Record<string, string> = { master: "2", gold: "1", silver: "0" };
      const rows: ImportRow[] = list.map((a: { name?: string; email?: string; level?: string }) => ({
        name: a.name ?? a.email ?? "",
        email: a.email ?? "",
        tier: a.level ? (tierMap[String(a.level).toLowerCase()] ?? "0") : undefined,
      })).filter((r: ImportRow) => r.email);
      setGoAffiliates(rows);
      setGoConnected(true);
    } catch {
      setGoAffiliates([]);
      setGoConnected(false);
    }
  };

  const connectTune = async () => {
    try {
      const url = `https://${tuneNetworkId}.api.hasoffers.com/Apiv3/json?Method=Affiliate.findAll&api_key=${encodeURIComponent(tuneApiKey)}`;
      const res = await fetch(url);
      const data = await res.json();
      const list = data?.response?.data?.data ?? [];
      const rows: ImportRow[] = (Object.values(list) as { first_name?: string; last_name?: string; email?: string }[])
        .map((a) => ({
          name: [a.first_name, a.last_name].filter(Boolean).join(" ") || (a.email ?? ""),
          email: a.email ?? "",
        }))
        .filter((r) => !!r.email) as ImportRow[];
      setTuneAffiliates(rows);
      setTuneConnected(true);
    } catch {
      setTuneAffiliates([]);
      setTuneConnected(false);
    }
  };

  const downloadTemplate = () => {
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(CSV_TEMPLATE);
    a.download = "affiliates-template.csv";
    a.click();
  };

  useEffect(() => {
    loadImportLogs();
  }, [loadImportLogs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${method === m.id ? THEME.accent : THEME.border}`,
              background: method === m.id ? "#e0f2fe" : THEME.card,
              color: method === m.id ? THEME.accent : THEME.text,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: method === m.id ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        {method === "csv" && (
          <>
            {autoDetectionRan && csvHeaders.length > 0 && (
              <div style={{ background: "#fef9c7", border: "1px solid #eab308", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#713f12" }}>
                We auto-detected column mappings from your CSV. Please review before importing.
              </div>
            )}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>CSV Upload</h3>
            <div
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = THEME.bg; }}
              onDragLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.style.background = "transparent"; const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f); }}
              style={{ border: `2px dashed ${THEME.border}`, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 16 }}
            >
              <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
              <p style={{ color: THEME.textMuted, marginBottom: 8 }}>Drag and drop a CSV file here, or</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "8px 16px", background: "#1a4a8a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Browse files</button>
              {csvFile && <p style={{ marginTop: 12, color: THEME.text, fontSize: 13 }}>{csvFile.name} ({csvRows.length} rows)</p>}
            </div>
            {csvHeaders.length > 0 && (
              <>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: THEME.text }}>Match your columns to our fields</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px 24px", alignItems: "center", marginBottom: 16, maxWidth: 560 }}>
                  {csvHeaders.map((h) => {
                    const mapped = columnMap[h] || "Skip";
                    const isMapped = mapped !== "Skip";
                    return (
                      <React.Fragment key={h}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text }}>{h}</span>
                          {isMapped && <span style={{ color: THEME.success, fontSize: 14 }} aria-hidden>✓</span>}
                          {!isMapped && <span style={{ background: THEME.border, color: THEME.textMuted, fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>Skip</span>}
                        </div>
                        <select value={mapped} onChange={(e) => setColumnMap((m) => ({ ...m, [h]: e.target.value }))} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${THEME.border}`, fontSize: 13, background: THEME.card, color: THEME.text, minWidth: 180 }}>
                          {COLUMN_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div style={{ background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: THEME.text }}>
                  {importableCount} affiliates will be imported. {Math.max(0, csvRows.length - importableCount)} will be skipped (missing name or empty row).
                </div>
                <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                        {csvHeaders.slice(0, 6).map((h) => <th key={h} style={{ textAlign: "left", padding: 8 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                          {csvHeaders.slice(0, 6).map((h) => <td key={h} style={{ padding: 8 }}>{row[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {method === "paste" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Paste List</h3>
            <textarea
              placeholder={`Paste one affiliate per line.\nFormats accepted:\nJohn Smith, john@email.com\njohn@email.com\nJohn Smith <john@email.com>`}
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setPasteParsed([]); }}
              onBlur={parsePaste}
              style={{ width: "100%", minHeight: 120, padding: 12, border: `1px solid ${THEME.border}`, borderRadius: 8, fontSize: 13, fontFamily: "inherit", marginBottom: 12 }}
            />
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: THEME.textMuted, marginRight: 8 }}>Tier for all:</label>
              <select value={pasteTier} onChange={(e) => { setPasteTier(e.target.value); parsePaste(); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${THEME.border}` }}>
                <option value="0">Silver</option>
                <option value="1">Gold</option>
                <option value="2">Master</option>
              </select>
            </div>
            {pasteParsed.length > 0 && (
              <p style={{ marginBottom: 12, fontSize: 13, color: THEME.text }}>Parsed {pasteParsed.length} affiliates. <button type="button" onClick={parsePaste} style={{ color: THEME.accent, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>Refresh</button></p>
            )}
          </>
        )}

        {method === "tapaffiliate" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>TapAffiliate Import</h3>
            <input type="password" placeholder="TapAffiliate API key" value={tapApiKey} onChange={(e) => setTapApiKey(e.target.value)} style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 12 }} />
            <button type="button" onClick={connectTap} style={{ padding: "8px 16px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Connect</button>
            {tapConnected && <p style={{ marginTop: 12, color: THEME.text }}>Found {tapAffiliates.length} affiliates.</p>}
          </>
        )}

        {method === "goaffpro" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>GoAffPro Import</h3>
            <input type="password" placeholder="GoAffPro access token" value={goToken} onChange={(e) => setGoToken(e.target.value)} style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 12 }} />
            <button type="button" onClick={connectGo} style={{ padding: "8px 16px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Connect</button>
            {goConnected && <p style={{ marginTop: 12, color: THEME.text }}>Found {goAffiliates.length} affiliates.</p>}
          </>
        )}

        {method === "tune" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Tune (HasOffers) Import</h3>
            <input type="text" placeholder="Network ID" value={tuneNetworkId} onChange={(e) => setTuneNetworkId(e.target.value)} style={{ width: "100%", maxWidth: 200, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 8 }} />
            <input type="password" placeholder="Tune API key" value={tuneApiKey} onChange={(e) => setTuneApiKey(e.target.value)} style={{ width: "100%", maxWidth: 400, padding: "10px 12px", border: `1px solid ${THEME.border}`, borderRadius: 8, marginBottom: 12 }} />
            <button type="button" onClick={connectTune} style={{ padding: "8px 16px", background: THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Connect</button>
            {tuneConnected && <p style={{ marginTop: 12, color: THEME.text }}>Found {tuneAffiliates.length} affiliates.</p>}
          </>
        )}

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${THEME.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: THEME.text }}>Options</p>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}><input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} /> Skip duplicates</label>
          <label style={{ display: "block", marginBottom: 6, fontSize: 13 }}><input type="checkbox" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} /> Update existing affiliates if email matches</label>
          <div style={{ marginBottom: 8 }}>
            <span style={{ marginRight: 8, fontSize: 13 }}>Set all imported as:</span>
            <label style={{ marginRight: 12 }}><input type="radio" name="status" checked={defaultStatus === "active"} onChange={() => setDefaultStatus("active")} /> Active</label>
            <label><input type="radio" name="status" checked={defaultStatus === "pending"} onChange={() => setDefaultStatus("pending")} /> Pending</label>
          </div>
        </div>

        {method === "csv" && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={downloadTemplate} style={{ padding: "8px 16px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Download CSV template</button>
            <button
              type="button"
              disabled={importing || importableCount === 0}
              onClick={() => runImport(mapCsvToRows(), "csv")}
              style={{ padding: "8px 16px", background: importing ? THEME.textMuted : THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: importing ? "not-allowed" : "pointer", fontSize: 13 }}
            >
              {importing ? "Importing…" : `Import Now (${importableCount} affiliates)`}
            </button>
          </div>
        )}
        {method === "paste" && (
          <button type="button" disabled={importing} onClick={() => { const rows = getPasteParsedNow(); if (rows.length) runImport(rows, "paste"); }} style={{ marginTop: 16, padding: "8px 16px", background: importing ? THEME.textMuted : THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: importing ? "not-allowed" : "pointer", fontSize: 13 }}>
            {importing ? "Importing…" : `Import ${getPasteParsedNow().length} affiliates`}
          </button>
        )}
        {method === "tapaffiliate" && tapAffiliates.length > 0 && (
          <button type="button" disabled={importing} onClick={() => runImport(tapAffiliates, "tapaffiliate")} style={{ marginTop: 16, padding: "8px 16px", background: importing ? THEME.textMuted : THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: importing ? "not-allowed" : "pointer", fontSize: 13 }}>
            {importing ? "Importing…" : "Import All"}
          </button>
        )}
        {method === "goaffpro" && goAffiliates.length > 0 && (
          <button type="button" disabled={importing} onClick={() => runImport(goAffiliates, "goaffpro")} style={{ marginTop: 16, padding: "8px 16px", background: importing ? THEME.textMuted : THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: importing ? "not-allowed" : "pointer", fontSize: 13 }}>
            {importing ? "Importing…" : "Import All"}
          </button>
        )}
        {method === "tune" && tuneAffiliates.length > 0 && (
          <button type="button" disabled={importing} onClick={() => runImport(tuneAffiliates, "tune")} style={{ marginTop: 16, padding: "8px 16px", background: importing ? THEME.textMuted : THEME.accent, color: "#fff", border: "none", borderRadius: 8, cursor: importing ? "not-allowed" : "pointer", fontSize: 13 }}>
            {importing ? "Importing…" : "Import All"}
          </button>
        )}

        {importing && <div style={{ marginTop: 16, height: 6, background: THEME.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: "40%", height: "100%", background: THEME.accent, animation: "pulse 1s ease infinite" }} /></div>}
        {importResult && (
          <div style={{ marginTop: 16, padding: 20, background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: THEME.text, marginBottom: 16 }}>Import complete</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
              <span style={{ color: THEME.success, fontWeight: 700, fontSize: 15 }}>{importResult.imported} imported</span>
              <span style={{ color: THEME.textMuted, fontSize: 14 }}>{importResult.updated} updated</span>
              <span style={{ color: THEME.warning, fontSize: 14 }}>{importResult.skipped} skipped</span>
              <span style={{ color: importResult.errors ? THEME.error : THEME.textMuted, fontSize: 14 }}>{importResult.errors} errors</span>
            </div>
            {importResult.summary && (
              <>
                {importResult.summary.tierBreakdown && (
                  <div style={{ marginBottom: 10, padding: "12px 14px", background: "#f8f9fa", borderRadius: 8, fontSize: 13, color: THEME.text }}>
                    <strong>Tier breakdown:</strong> {importResult.summary.tierBreakdown.silver ?? 0} Silver, {importResult.summary.tierBreakdown.gold ?? 0} Gold, {importResult.summary.tierBreakdown.master ?? 0} Master
                  </div>
                )}
                {((importResult.summary.totalHistoricalRevenue ?? 0) > 0 || (importResult.summary.totalHistoricalPayouts ?? 0) > 0) && (
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 12 }}>
                    {(importResult.summary.totalHistoricalRevenue ?? 0) > 0 && (
                      <div style={{ fontSize: 13, color: THEME.text }}><strong>Total revenue imported:</strong> ${importResult.summary.totalHistoricalRevenue!.toLocaleString()}</div>
                    )}
                    {(importResult.summary.totalHistoricalPayouts ?? 0) > 0 && (
                      <div style={{ fontSize: 13, color: THEME.text }}><strong>Total payouts imported:</strong> ${importResult.summary.totalHistoricalPayouts!.toLocaleString()}</div>
                    )}
                  </div>
                )}
                {importResult.summary.skippedReasons && importResult.summary.skippedReasons.length > 0 && (
                  <div style={{ marginTop: 12, fontSize: 12, color: THEME.textMuted }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Skipped rows:</div>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {importResult.summary.skippedReasons.slice(0, 10).map((s, i) => (
                        <li key={i}>Row {s.row}: {s.reason}</li>
                      ))}
                      {importResult.summary.skippedReasons.length > 10 && <li>… and {importResult.summary.skippedReasons.length - 10} more</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <button type="button" onClick={() => setShowInstructions(!showInstructions)} style={{ padding: "8px 16px", background: THEME.bg, border: `1px solid ${THEME.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
        {showInstructions ? "Hide" : "How to export from your current platform"}
      </button>
      {showInstructions && (
        <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>TapAffiliate</h4>
          <ol style={{ marginBottom: 16, paddingLeft: 20, fontSize: 13, color: THEME.textMuted }}>
            <li>Log into TapAffiliate</li><li>Go to Affiliates → All Affiliates</li><li>Click Export at the top right</li><li>Select CSV format</li><li>Download and upload here</li>
          </ol>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>GoAffPro</h4>
          <ol style={{ marginBottom: 16, paddingLeft: 20, fontSize: 13, color: THEME.textMuted }}>
            <li>Log into GoAffPro admin</li><li>Go to Affiliates section</li><li>Click the Export button</li><li>Choose CSV</li><li>Download and upload here</li>
          </ol>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Tune</h4>
          <ol style={{ marginBottom: 16, paddingLeft: 20, fontSize: 13, color: THEME.textMuted }}>
            <li>Log into Tune dashboard</li><li>Go to Affiliates → Manage Affiliates</li><li>Click Export</li><li>Select all fields</li><li>Download CSV and upload here</li>
          </ol>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>General</h4>
          <ul style={{ paddingLeft: 20, fontSize: 13, color: THEME.textMuted }}>
            <li>CSV must have at least name and email columns</li>
            <li>Tier column: master, gold, or silver</li>
            <li>Include referred_by_email for referral relationships</li>
            <li>All emails must be unique</li>
          </ul>
        </div>
      )}

      <div style={{ background: THEME.card, border: `1px solid ${THEME.border}`, borderRadius: 12, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: THEME.text }}>Recent Imports</h3>
        {importLogs.length === 0 ? (
          <p style={{ color: THEME.textMuted, fontSize: 13 }}>No imports yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ textAlign: "left", padding: 8 }}>Date</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Method</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Total</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Imported</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Skipped</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Errors</th>
                </tr>
              </thead>
              <tbody>
                {importLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <td style={{ padding: 8 }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 8 }}>{log.method}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{log.totalCount}</td>
                    <td style={{ padding: 8, textAlign: "right", color: THEME.success }}>{log.importedCount}</td>
                    <td style={{ padding: 8, textAlign: "right", color: THEME.warning }}>{log.skippedCount}</td>
                    <td style={{ padding: 8, textAlign: "right", color: log.errorCount ? THEME.error : THEME.textMuted }}>{log.errorCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
