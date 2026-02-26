"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import PortalLanding from "./PortalLanding";
import PendingScreen from "./PendingScreen";

type MeResponse =
  | { noApplication: true; email?: string }
  | { pending: true; message?: string; applicationDetails?: { name: string; email: string; createdAt: string } }
  | { rejected?: true; email?: string }
  | { affiliate: { status: string }; [key: string]: unknown };

export default function PortalGate() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const res = await fetch("/api/me/affiliate");
    const text = await res.text();
    let json: MeResponse;
    try {
      json = text ? (JSON.parse(text) as MeResponse) : {};
    } catch {
      json = {};
    }
    setMe(json);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setMe(null);
      setLoading(false);
      return;
    }
    fetchMe().finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, fetchMe]);

  useEffect(() => {
    if (!me || !("affiliate" in me) || !me.affiliate) return;
    const aff = me.affiliate as { status: string };
    if (aff.status === "active") {
      router.replace("/portal/dashboard");
    }
  }, [me, router]);

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", fontFamily: "'DM Sans', sans-serif", color: "#4a5568" }}>
        Loading…
      </div>
    );
  }

  // Not signed in → Stage 1: landing
  if (!isSignedIn) {
    return <PortalLanding />;
  }

  // Signed in, no application → Stage 3: landing + prefill + auto-open modal
  if (me && "noApplication" in me && me.noApplication) {
    return <PortalLanding prefilledEmail={typeof me.email === "string" ? me.email : ""} autoOpenModal />;
  }

  // Signed in, rejected → same as no application (can re-apply)
  if (me && "rejected" in me && me.rejected) {
    return <PortalLanding prefilledEmail={typeof me.email === "string" ? me.email : ""} autoOpenModal />;
  }

  // Signed in, pending → Stage 2: waiting screen only
  if (me && "pending" in me && me.pending && me.applicationDetails) {
    const ad = me.applicationDetails as { name: string; email: string; createdAt: string };
    return (
      <PendingScreen
        name={ad.name}
        email={ad.email}
        createdAt={ad.createdAt}
      />
    );
  }

  // Fallback (e.g. still loading me): show loading
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fa", fontFamily: "'DM Sans', sans-serif", color: "#4a5568" }}>
      Loading…
    </div>
  );
}
