"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import "shepherd.js/dist/css/shepherd.css";

const STORAGE_PREFIX = "tour-completed-";

export type TourStepConfig = {
  id: string;
  selector: string;
  title: string;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
};

type GuidedTourProps = {
  tourId: string;
  steps: TourStepConfig[];
  /** When true, show subtle pulse on the trigger button (first visit to this tab). */
  pulse?: boolean;
  /** Button label or icon. */
  buttonLabel?: React.ReactNode;
  /** Optional class for the trigger button. */
  className?: string;
  /** Optional inline style for the trigger button. */
  style?: React.CSSProperties;
};

function getCompletedKey(tourId: string): string {
  return `${STORAGE_PREFIX}${tourId}`;
}

export function hasCompletedTour(tourId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getCompletedKey(tourId)) === "true";
}

export function GuidedTour({
  tourId,
  steps,
  pulse = false,
  buttonLabel = "🎓",
  className,
  style,
}: GuidedTourProps) {
  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const activeTourRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    setMounted(true);
    setCompleted(hasCompletedTour(tourId));
  }, [tourId]);

  // Cancel any active tour when tab/tourId or steps change so the new tab's tour can run cleanly
  useEffect(() => {
    if (activeTourRef.current) {
      activeTourRef.current.cancel();
      activeTourRef.current = null;
    }
  }, [tourId, steps]);

  useEffect(() => {
    return () => {
      if (activeTourRef.current) {
        activeTourRef.current.cancel();
        activeTourRef.current = null;
      }
    };
  }, []);

  const startTour = useCallback(async () => {
    if (typeof window === "undefined" || steps.length === 0) return;
    if (activeTourRef.current) {
      activeTourRef.current.cancel();
      activeTourRef.current = null;
    }
    const el = document.querySelector("[data-tour-root]");
    const container = el || document.body;

    const { default: Shepherd } = await import("shepherd.js");
    const { offset } = await import("@floating-ui/dom");
    const existing = container.querySelector(".shepherd-modal-overlay-container");
    if (existing) existing.remove();

    const validSteps = steps.filter((s) => {
      const node = document.querySelector(s.selector);
      return !!node;
    });
    if (validSteps.length === 0) return;

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      exitOnEsc: true,
      keyboardNavigation: true,
      defaultStepOptions: {
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: { enabled: true },
        arrow: true,
        highlightClass: "tour-highlight",
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 8,
        floatingUIOptions: {
          middleware: [offset(16)],
        },
      },
    });

    validSteps.forEach((step, index) => {
      const isLast = index === validSteps.length - 1;
      const isFirst = index === 0;
      tour.addStep({
        id: step.id,
        attachTo: {
          element: step.selector,
          on: step.position || "bottom",
        },
        title: step.title,
        text: step.text,
        buttons: [
          ...(isFirst ? [] : [{ text: "Back", secondary: true, action() { tour.back(); } }]),
          { text: "Skip", secondary: true, action() { tour.cancel(); } },
          {
            text: isLast ? "Finish" : "Next",
            action() {
              if (isLast) tour.complete();
              else tour.next();
            },
          },
        ],
      });
    });

    tour.on("complete", () => {
      if (typeof window !== "undefined") localStorage.setItem(getCompletedKey(tourId), "true");
      setCompleted(true);
      activeTourRef.current = null;
    });
    tour.on("cancel", () => {
      activeTourRef.current = null;
    });

    activeTourRef.current = tour;
    tour.start();
  }, [tourId, steps]);

  const showPulse = pulse && mounted && !completed;

  return (
    <>
      <style>{`
        /* Match site font on all Shepherd elements */
        .shepherd-element,
        .shepherd-element *,
        .shepherd-text,
        .shepherd-header,
        .shepherd-footer,
        .shepherd-button {
          font-family: inherit !important;
        }
        /* Popup container — match site cards */
        .shepherd-element {
          border-radius: 12px !important;
          border: 1px solid #e5e7eb !important;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1) !important;
          overflow: hidden;
          background: #fff !important;
          max-width: 360px;
          padding: 0;
          z-index: 10002;
        }
        /* Remove default Shepherd header background */
        .shepherd-header {
          background: #fff !important;
          padding: 16px 20px 4px !important;
          border-bottom: none !important;
        }
        /* Title — match site heading style */
        .shepherd-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #111827 !important;
          margin: 0 !important;
        }
        /* Body text — match site paragraph style */
        .shepherd-text {
          padding: 8px 20px 16px !important;
          font-size: 14px !important;
          line-height: 1.6 !important;
          color: #374151 !important;
        }
        /* Footer with buttons */
        .shepherd-footer {
          padding: 0 20px 16px !important;
          border-top: none !important;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }
        /* Buttons — match site button styles */
        .shepherd-button {
          border-radius: 8px !important;
          padding: 8px 18px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          border: none !important;
          transition: background 0.15s ease !important;
        }
        /* Primary button (Next / Done) — site accent #1e3a5f */
        .shepherd-button-primary,
        .shepherd-button:not(.shepherd-button-secondary) {
          background: #1e3a5f !important;
          color: #fff !important;
        }
        .shepherd-button-primary:hover,
        .shepherd-button:not(.shepherd-button-secondary):hover {
          background: #254a75 !important;
        }
        /* Secondary button (Skip / Back) */
        .shepherd-button-secondary {
          background: #f3f4f6 !important;
          color: #374151 !important;
        }
        .shepherd-button-secondary:hover {
          background: #e5e7eb !important;
        }
        /* Close X button */
        .shepherd-cancel-icon {
          color: #9ca3af !important;
          font-size: 20px !important;
        }
        .shepherd-cancel-icon:hover {
          color: #374151 !important;
        }
        /* Arrow — match popup (white fill, subtle border) */
        .shepherd-arrow,
        .shepherd-arrow::before {
          background: #fff !important;
        }
        .shepherd-arrow::before {
          border: 1px solid #e5e7eb !important;
        }
        /* Dark overlay with spotlight cutout */
        .shepherd-modal-overlay-container {
          pointer-events: auto;
          z-index: 9997;
        }
        .shepherd-modal-overlay-container path {
          fill: rgba(0, 0, 0, 0.5);
        }
        .shepherd-target {
          position: relative;
          z-index: 10001;
        }
        /* Highlight ring — site accent */
        .tour-highlight {
          box-shadow: 0 0 0 4px rgba(30, 58, 95, 0.5), 0 0 20px rgba(30, 58, 95, 0.3) !important;
          border-radius: 8px;
          position: relative;
          z-index: 10001 !important;
        }
        .tour-trigger-pulse {
          animation: tour-pulse 2s ease-in-out infinite;
        }
        @keyframes tour-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(30, 58, 95, 0.4); }
          50% { opacity: 0.95; }
          75% { box-shadow: 0 0 0 6px rgba(30, 58, 95, 0); }
        }
      `}</style>
      <button
        type="button"
        onClick={startTour}
        title="Walk me through"
        className={className}
        style={{
          minHeight: 44,
          padding: "10px 14px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          color: "#4a5568",
          fontSize: 14,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          ...(showPulse ? { animation: "tour-pulse 2s ease-in-out infinite" } : {}),
          ...style,
        }}
      >
        {buttonLabel}
      </button>
    </>
  );
}

/** Returns step configs for the dashboard tab. Targets use [data-tour="id"]. */
export function getDashboardTourSteps(): TourStepConfig[] {
  return [
    { id: "welcome", selector: '[data-tour="dashboard-welcome"]', title: "Command center", text: "This is your command center. See revenue, clicks, and conversions at a glance.", position: "bottom" },
    { id: "date-range", selector: '[data-tour="date-range-filter"]', title: "Date range", text: "Filter stats by today, this week, this month, this year, or all time.", position: "bottom" },
    { id: "stat-cards", selector: '[data-tour="stat-cards"]', title: "Key metrics", text: "These show your key metrics for the selected period.", position: "bottom" },
    { id: "top-performers", selector: '[data-tour="top-performers"]', title: "Top performers", text: "Your best-performing affiliates ranked by revenue.", position: "top" },
    { id: "top-products", selector: '[data-tour="top-products"]', title: "Top products", text: "See which products generate the most affiliate revenue.", position: "top" },
    { id: "activity-feed", selector: '[data-tour="activity-feed"]', title: "Activity feed", text: "Real-time log of conversions, approvals, tier changes, and payouts.", position: "top" },
    { id: "fraud-alerts", selector: '[data-tour="fraud-alerts"]', title: "Fraud alerts", text: "Click to expand and review any suspicious activity flagged by the system.", position: "bottom" },
    { id: "pending-applications", selector: '[data-tour="pending-applications"]', title: "Pending applications", text: "New affiliate applications waiting for your approval.", position: "bottom" },
  ];
}

export function getAffiliatesTourSteps(): TourStepConfig[] {
  return [
    { id: "search", selector: '[data-tour="affiliates-search"]', title: "Search", text: "Search for any affiliate by name or email. Results filter in real time as you type.", position: "bottom" },
    { id: "sort", selector: '[data-tour="affiliates-sort"]', title: "Sort", text: "Sort your affiliates by newest, most revenue, most sales, or alphabetically.", position: "bottom" },
    { id: "show-archived", selector: '[data-tour="show-archived"]', title: "Show archived", text: "Toggle to see archived affiliates who are no longer active in the program.", position: "bottom" },
    { id: "select-all", selector: '[data-tour="select-all"]', title: "Select all", text: "Select affiliates for bulk actions like archive or delete.", position: "bottom" },
    { id: "affiliates-list", selector: '[data-tour="affiliates-list"]', title: "Affiliate list", text: "All your affiliates appear here. Click any card to expand and see full details, links, notes, and history.", position: "top" },
    { id: "affiliates-card", selector: '[data-tour="affiliates-card"]', title: "Affiliate card", text: "Each card shows name, tier, and quick stats. Click to expand for tracking links, notes, and actions.", position: "top" },
    { id: "affiliates-stats", selector: '[data-tour="affiliates-stats"]', title: "Stats", text: "Quick stats for each affiliate: clicks, sales, revenue, payout. Historical data from CSV imports is included.", position: "left" },
    { id: "sales-recruit-buttons", selector: '[data-tour="sales-recruit-buttons"]', title: "Links", text: "Copy the affiliate's unique tracking link or recruitment link to share with them.", position: "top" },
    { id: "view-as-affiliate", selector: '[data-tour="view-as-affiliate"]', title: "Preview", text: "Preview what this affiliate sees in their portal.", position: "top" },
    { id: "archive-delete", selector: '[data-tour="archive-delete"]', title: "Archive / Delete", text: "Archive hides them from the main list; Delete permanently removes all their data.", position: "top" },
    { id: "bulk-actions", selector: '[data-tour="bulk-actions"]', title: "Bulk actions", text: "When affiliates are selected, use bulk archive or delete here.", position: "bottom" },
  ];
}

export function getConversionsTourSteps(): TourStepConfig[] {
  return [
    { id: "conversions-summary", selector: '[data-tour="conversions-summary"]', title: "Commission totals", text: "See totals for pending, approved, and paid commissions at a glance.", position: "bottom" },
    { id: "conversions-filters", selector: '[data-tour="conversions-filters"]', title: "Filters", text: "Filter conversions by date range and status (pending, approved, or paid).", position: "bottom" },
    { id: "log-sale", selector: '[data-tour="log-sale"]', title: "Log sale", text: "Manually record a sale for an affiliate. Use this when a conversion didn't come through WooCommerce.", position: "bottom" },
    { id: "conversions-table", selector: '[data-tour="conversions-table"]', title: "Conversions table", text: "All conversions appear here. Click a row to expand and see order details, line items, and customer info.", position: "top" },
    { id: "conversions-status", selector: '[data-tour="conversions-status"]', title: "Status", text: "Each conversion moves through pending → approved → paid. Use the action buttons to move them along.", position: "left" },
    { id: "approve-paid", selector: '[data-tour="approve-paid"]', title: "Approve / Mark paid", text: "Approve pending conversions, then mark as paid when you've sent the payout.", position: "left" },
  ];
}

export function getPayoutsTourSteps(): TourStepConfig[] {
  return [
    { id: "mass-payout", selector: '[data-tour="mass-payout"]', title: "Mass payout", text: "Pay all eligible affiliates at once via Tipalti.", position: "bottom" },
    { id: "payouts-summary", selector: '[data-tour="payouts-summary"]', title: "Summary", text: "Overview of unpaid balances, total paid to date, and active affiliate count.", position: "bottom" },
    { id: "payouts-table", selector: '[data-tour="payouts-table"]', title: "Payouts table", text: "Each row shows an affiliate's unpaid balance, paid total, store credit, and payment history.", position: "top" },
    { id: "pay-now", selector: '[data-tour="pay-now"]', title: "Pay now", text: "Pay an individual affiliate. Choose payment method (Tipalti, PayPal, etc.) and add a reference.", position: "top" },
    { id: "store-credit", selector: '[data-tour="store-credit"]', title: "Store credit", text: "Add store credit to an affiliate's account for use on your store.", position: "top" },
    { id: "payment-history", selector: '[data-tour="payment-history"]', title: "Payment history", text: "See past payouts for each affiliate.", position: "top" },
  ];
}

export function getLeaderboardTourSteps(): TourStepConfig[] {
  return [
    { id: "leaderboard-modes", selector: '[data-tour="leaderboard-modes"]', title: "Ranking modes", text: "Switch between This Month, All Time revenue, or Most Recruits to change how affiliates are ranked.", position: "bottom" },
    { id: "leaderboard-top", selector: '[data-tour="leaderboard-top"]', title: "Top performer", text: "Your top performer gets the gold. Revenue includes both live and historical data from CSV imports.", position: "bottom" },
    { id: "leaderboard-metrics", selector: '[data-tour="leaderboard-metrics"]', title: "Metrics", text: "Rankings show total revenue or recruit count depending on the mode you selected.", position: "left" },
    { id: "leaderboard-rankings", selector: '[data-tour="leaderboard-rankings"]', title: "Rankings", text: "Full list of affiliates ranked by the selected metric. See who's driving the most sales.", position: "top" },
  ];
}

export function getImportTourSteps(): TourStepConfig[] {
  return [
    { id: "import-upload", selector: '[data-tour="import-upload"]', title: "Import affiliates", text: "Upload a CSV file to bulk-import new affiliates. The file should include name, email, and optional columns like tier or revenue.", position: "bottom" },
    { id: "import-instructions", selector: '[data-tour="import-instructions"]', title: "Format", text: "Instructions and expected CSV format. You can also paste a list or connect TapAffiliate, GoAffPro, or Tune.", position: "top" },
    { id: "import-column-mapping", selector: '[data-tour="import-column-mapping"]', title: "Column mapping", text: "Match your CSV columns to our database fields (name, email, tier, revenue, etc.) before importing.", position: "top" },
    { id: "import-update", selector: '[data-tour="import-update"]', title: "Update stats", text: "Upload a Conversion Status Report CSV to update existing affiliates with sales data without re-importing everyone.", position: "top" },
    { id: "create-admin-affiliates", selector: '[data-tour="create-admin-affiliates"]', title: "Create admin affiliates", text: "One-click setup for admin team affiliate accounts so they can earn commission too.", position: "top" },
    { id: "import-results", selector: '[data-tour="import-results"]', title: "Results", text: "After import or update, results appear here: how many were imported, updated, skipped, or had errors.", position: "top" },
  ];
}

export function getMlmTourSteps(): TourStepConfig[] {
  return [
    { id: "mlm-structure", selector: '[data-tour="mlm-structure"]', title: "Network structure", text: "Visual tree showing who recruited who. Each level earns a smaller override commission on their downline's sales.", position: "bottom" },
    { id: "mlm-tiers", selector: '[data-tour="mlm-tiers"]', title: "Tiers", text: "Affiliates are shown with their tier (Silver, Gold, Master). Higher tiers earn a larger override on recruits.", position: "top" },
    { id: "mlm-rates", selector: '[data-tour="mlm-rates"]', title: "Rates", text: "Commission rates are set in Settings. This tree shows the network so you can see who earns overrides from whom.", position: "top" },
  ];
}

export function getSettingsLinkTourSteps(): TourStepConfig[] {
  return [
    { id: "settings-link", selector: '[data-tour="settings-link"]', title: "Settings", text: "Customize tier names, commission rates, thresholds, WooCommerce, Tipalti, and email integrations.", position: "bottom" },
  ];
}

/** FAQ tab (dashboard) tour steps. */
export function getFaqTourSteps(): TourStepConfig[] {
  return [
    { id: "faq-search", selector: '[data-tour="faq-search"]', title: "Search", text: "Search for any question or topic. Results filter across all sections and answers.", position: "bottom" },
    { id: "faq-getting-started", selector: '[data-tour="faq-getting-started"]', title: "Getting started", text: "Start here if you're new. These steps get you up and running in a few minutes.", position: "bottom" },
    { id: "faq-sections", selector: '[data-tour="faq-sections"]', title: "FAQ sections", text: "Click any section to expand detailed Q&A. All sections start collapsed so you can scan and open what you need.", position: "top" },
  ];
}

/** Settings page (dashboard/settings) tour steps. */
export function getSettingsPageTourSteps(): TourStepConfig[] {
  return [
    { id: "settings-tiers", selector: '[data-tour="settings-tiers"]', title: "Tier Settings", text: "Configure your commission tiers here. Each tier has a name, a direct commission percentage, and multi-level override percentages (L2 and L3) for downline earnings.", position: "bottom" },
    { id: "settings-tier-row", selector: '[data-tour="settings-tier-row"]', title: "Tier row", text: "Each row is a tier. Commission % is what the affiliate earns on their own sales. L2 % is what they earn from their level 2 recruits' sales, and L3 % from level 3.", position: "top" },
    { id: "settings-add-tier", selector: '[data-tour="settings-add-tier"]', title: "Add Tier", text: "Click here to add a new tier if you need more than three. You can have up to 5 tiers.", position: "bottom" },
    { id: "settings-thresholds", selector: '[data-tour="settings-thresholds"]', title: "Threshold Settings", text: "Set the minimum monthly sales required to qualify for each tier. Affiliates are automatically promoted or demoted based on these thresholds.", position: "bottom" },
    { id: "settings-program", selector: '[data-tour="settings-program"]', title: "Program Settings", text: "Configure your program name, default settings, and other app-wide options.", position: "bottom" },
    { id: "settings-tracking", selector: '[data-tour="settings-tracking"]', title: "Tracking Setup", text: "Set up your tracking links, pixels, and integration settings here.", position: "bottom" },
    { id: "settings-save", selector: '[data-tour="settings-save"]', title: "Save", text: "Click here to save all your settings. Changes apply app-wide and re-evaluate all affiliates.", position: "top" },
  ];
}

export function getPortalTourSteps(): TourStepConfig[] {
  return [
    { id: "portal-dashboard", selector: '[data-tour="portal-dashboard"]', title: "Your dashboard", text: "Your personal affiliate dashboard. See your earnings, clicks, and sales.", position: "bottom" },
    { id: "portal-links", selector: '[data-tour="portal-links"]', title: "Your links", text: "Share your sales link with customers. Share your recruit link to build your team.", position: "bottom" },
    { id: "portal-earnings", selector: '[data-tour="portal-earnings"]', title: "Earnings", text: "Track your commissions and payout history.", position: "bottom" },
    { id: "portal-team", selector: '[data-tour="portal-team"]', title: "Team", text: "See affiliates you've recruited and your network.", position: "bottom" },
  ];
}
