"use client";

import { useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

const TIERS = [
  { name: "Bronze", rate: "7.5%", threshold: "Starting Tier", gradient: "from-amber-900/40 to-amber-800/20", border: "border-amber-700/30", accent: "text-amber-400" },
  { name: "Silver", rate: "10%", threshold: "$1,000 Revenue", gradient: "from-slate-600/40 to-slate-700/20", border: "border-slate-500/30", accent: "text-slate-300" },
  { name: "Gold", rate: "12.5%", threshold: "$2,000 Revenue", gradient: "from-yellow-800/40 to-yellow-700/20", border: "border-yellow-600/30", accent: "text-yellow-400" },
  { name: "Master", rate: "20%", threshold: "$5,000 Revenue", featured: true, gradient: "from-blue-700/40 to-blue-600/20", border: "border-blue-500/50", accent: "text-blue-400" },
];

const STEPS = [
  { num: "01", title: "Apply & Get Approved", desc: "Submit your application and get verified within 24 hours. No upfront costs or inventory required." },
  { num: "02", title: "Share Your Link", desc: "Get your unique tracking link and start sharing with your audience across any channel." },
  { num: "03", title: "Earn & Level Up", desc: "Earn commissions on every sale and auto-advance through tiers as your revenue grows." },
];

const BENEFITS = [
  { icon: "flask", title: "Science-Backed Products", desc: "99%+ purity, 3rd-party tested peptides and longevity compounds that practically sell themselves." },
  { icon: "chart", title: "Real-Time Dashboard", desc: "Track clicks, conversions, revenue, and payouts — all in a polished dashboard built for affiliates." },
  { icon: "bolt", title: "Auto Tier Upgrades", desc: "Hit revenue milestones and automatically unlock higher commission rates. No manual requests." },
  { icon: "network", title: "Sub-Affiliate Network", desc: "Build a team and earn overrides on your recruits' sales — two levels deep (L2 + L3)." },
  { icon: "wallet", title: "Competitive Payouts", desc: "Up to 20% commission with transparent tracking and on-time payments." },
  { icon: "shield", title: "Trusted Founders", desc: "Built by Jay Campbell & Hunter Williams — leaders in peptide science and longevity optimization." },
];

function BenefitIcon({ type }: { type: string }) {
  const cls = "w-5 h-5 stroke-[#2563eb]";
  switch (type) {
    case "flask":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M10 3v6.5L4 20h16L14 9.5V3" /><path d="M8.5 14h7" /></svg>;
    case "chart":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" /></svg>;
    case "bolt":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
    case "network":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><path d="M12 8v3M7.5 17.2L10.5 11M16.5 17.2L13.5 11" /></svg>;
    case "wallet":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><circle cx="16" cy="14" r="1" /></svg>;
    case "shield":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5.25-3.5 9.74-8 11-4.5-1.26-8-5.75-8-11V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg>;
    default:
      return null;
  }
}

export default function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = "1";
            (entry.target as HTMLElement).style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--landing-bg)", color: "var(--landing-text)", fontFamily: "'Inter', 'DM Sans', system-ui, -apple-system, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "var(--landing-nav-bg)", borderBottom: "1px solid var(--landing-nav-border)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Biolongevity Labs" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-semibold rounded-lg transition"
              style={{ color: "var(--landing-login-text)", border: "1px solid var(--landing-login-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--landing-login-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Affiliate Login
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition"
              style={{ background: "#2563eb" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              Join Program
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--landing-hero-gradient)" }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-8 rounded-full text-xs font-semibold tracking-wider uppercase" style={{ background: "rgba(37,99,235,0.12)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.2)" }}>
            Biolongevity Labs Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            Earn Up to{" "}
            <span style={{ color: "#2563eb" }}>20%</span>{" "}
            Promoting Premium Peptides
          </h1>
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--landing-text-muted)" }}>
            Join hundreds of affiliates earning industry-leading commissions on science-backed
            longevity products trusted by thousands of customers worldwide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/register"
              className="px-8 py-3.5 text-white font-bold rounded-lg transition text-base w-full sm:w-auto text-center"
              style={{ background: "#2563eb", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              Become an Affiliate
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 font-semibold rounded-lg transition text-base w-full sm:w-auto text-center"
              style={{ color: "var(--landing-text)", border: "1px solid var(--landing-login-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--landing-login-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Sign In
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["310+ Active Affiliates", "20% Top Commission", "150+ Products", "4 Reward Tiers"].map((stat) => (
              <span
                key={stat}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: "var(--landing-pill-bg)", border: "1px solid var(--landing-pill-border)", color: "var(--landing-pill-text)" }}
              >
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* COMMISSION TIERS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            data-reveal
            className="text-3xl md:text-4xl font-bold text-center mb-4"
            style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            Commission Tiers
          </h2>
          <p
            data-reveal
            className="text-center mb-14 max-w-xl mx-auto"
            style={{ color: "var(--landing-text-muted)", opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            Four tiers with automatic upgrades as your revenue grows. Start earning from day one.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                data-reveal
                className="relative rounded-xl p-6"
                style={{
                  opacity: 0,
                  transform: "translateY(24px)",
                  transition: `opacity 0.7s ease ${i * 0.1}s, transform 0.7s ease ${i * 0.1}s`,
                  background: tier.featured
                    ? "linear-gradient(to bottom, rgba(37,99,235,0.18), rgba(37,99,235,0.06))"
                    : "var(--landing-card-bg)",
                  border: tier.featured
                    ? "1px solid rgba(37,99,235,0.4)"
                    : `1px solid var(--landing-tier-default-border)`,
                  ...(tier.featured ? { boxShadow: "0 0 40px rgba(37,99,235,0.2), inset 0 1px 0 rgba(37,99,235,0.15)" } : {}),
                }}
              >
                {tier.featured && (
                  <span
                    className="absolute -top-3 left-1/2 text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{ transform: "translateX(-50%)", background: "#2563eb" }}
                  >
                    BEST
                  </span>
                )}
                <div className="text-sm font-semibold mb-2" style={{ color: tier.featured ? "var(--landing-tier-master)" : tier.name === "Bronze" ? "var(--landing-tier-bronze)" : tier.name === "Silver" ? "var(--landing-tier-silver)" : "var(--landing-tier-gold)" }}>
                  {tier.name}
                </div>
                <div className="text-4xl font-extrabold mb-1">{tier.rate}</div>
                <div className="text-sm" style={{ color: "var(--landing-text-muted)" }}>commission</div>
                <div className="mt-4 pt-4 text-sm" style={{ borderTop: `1px solid var(--landing-card-border)`, color: "var(--landing-text-muted)" }}>
                  {tier.threshold}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6" style={{ background: "var(--landing-section-alt)" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            data-reveal
            className="text-3xl md:text-4xl font-bold text-center mb-14"
            style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                data-reveal
                className="text-center"
                style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s` }}
              >
                <div
                  className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center font-bold text-lg"
                  style={{ background: "var(--landing-step-bg)", border: "1px solid var(--landing-step-border)", color: "#2563eb" }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--landing-text-muted)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY JOIN */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2
            data-reveal
            className="text-3xl md:text-4xl font-bold text-center mb-4"
            style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            Why Join
          </h2>
          <p
            data-reveal
            className="text-center mb-14 max-w-xl mx-auto"
            style={{ color: "var(--landing-text-muted)", opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            Everything you need to build a profitable affiliate business in the longevity space.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                data-reveal
                className="rounded-xl p-6 transition-colors"
                style={{
                  opacity: 0,
                  transform: "translateY(24px)",
                  transition: `opacity 0.7s ease ${i * 0.08}s, transform 0.7s ease ${i * 0.08}s, border-color 0.2s ease`,
                  background: "var(--landing-card-bg)",
                  border: "1px solid var(--landing-card-border)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--landing-card-border-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--landing-card-border)")}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "var(--landing-step-bg)", border: "1px solid rgba(37,99,235,0.15)" }}
                >
                  <BenefitIcon type={b.icon} />
                </div>
                <h3 className="font-bold mb-2">{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--landing-text-muted)" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6" style={{ background: "var(--landing-section-alt)" }}>
        <div
          data-reveal
          className="max-w-2xl mx-auto text-center"
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="mb-10" style={{ color: "var(--landing-text-muted)" }}>
            Apply now and start earning commissions on premium longevity products.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 text-white font-bold rounded-lg transition text-base w-full sm:w-auto text-center"
              style={{ background: "#2563eb", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              Apply Now
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 font-semibold rounded-lg transition text-base w-full sm:w-auto text-center"
              style={{ color: "var(--landing-text)", border: "1px solid var(--landing-login-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--landing-login-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              Affiliate Login
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid var(--landing-footer-border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Biolongevity Labs" className="h-6 w-auto opacity-60" />
            <span className="text-sm" style={{ color: "var(--landing-text-muted)" }}>&copy; {new Date().getFullYear()} F2 Nutrition LLC</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: "var(--landing-text-muted)" }}>
            <a href="https://biolongevitylabs.com" target="_blank" rel="noopener noreferrer" className="transition" style={{ color: "var(--landing-text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--landing-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--landing-text-muted)")}>Main Site</a>
            <a href="https://biolongevitylabs.com/policies/terms-of-service" target="_blank" rel="noopener noreferrer" className="transition" style={{ color: "var(--landing-text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--landing-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--landing-text-muted)")}>Terms</a>
            <a href="https://biolongevitylabs.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="transition" style={{ color: "var(--landing-text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--landing-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--landing-text-muted)")}>Privacy</a>
            <Link href="/dashboard" className="transition" style={{ color: "var(--landing-text-muted)" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--landing-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--landing-text-muted)")}>Admin Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
