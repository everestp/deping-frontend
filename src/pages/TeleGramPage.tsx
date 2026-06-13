"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Coins,
  Shield,
  Loader2,
  Bell,
  RefreshCw,
  Sparkles,
  Zap,
  Globe
} from "lucide-react";
import {
  initiateTelegramLink,
  addPurchasedCredits,
  toggleMonitorNotification,
  useCreditStatus,
  type LinkTelegramResponse
} from "../api/telegram-api";

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface Monitor {
  id: string;
  target_url: string;
  is_notifications_enabled: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  credits: number;
  cost: number;
  unit: string;
  badge?: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PRICING_TIERS: PricingTier[] = [
  {
    id: "tier_basic",
    name: "Basic Plan",
    credits: 100,
    cost: 10,
    unit: "DPNG",
    description: "Perfect for basic node tracking alerts.",
  },
  {
    id: "tier_silver",
    name: "Silver Package",
    credits: 1000,
    cost: 80,
    unit: "DPNG",
    badge: "Most Popular",
    description: "Optimized value structure for multiple active regions.",
  },
  {
    id: "tier_gold",
    name: "Gold Ultimate",
    credits: 10000,
    cost: 700,
    unit: "DPNG",
    badge: "Best Rate (30% Off)",
    description: "Enterprise scale for large distributed network validation.",
  },
];

export default function TelegramPage({ 
  monitors = [],
  telegramUser = null 
}: { 
  monitors?: Monitor[];
  telegramUser?: {
    is_verified: boolean;
    telegram_username?: string;
    verification_code?: string;
  } | null;
}) {
  // ─── Core Ledger Hooks ─────────────────────────────────────────────────────
  const { data: credits, refetch: refetchCredits, loading: loadingCredits } = useCreditStatus();

  // ─── Component Input States ────────────────────────────────────────────────
  const [username, setUsername] = useState(telegramUser?.telegram_username || "");
  const [linkData, setLinkData] = useState<LinkTelegramResponse | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("tier_silver");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // ─── Multi-Monitor Subscription Map ────────────────────────────────────────
  const [monitorToggles, setMonitorToggles] = useState<Record<string, boolean>>(() =>
    monitors.reduce((acc, m) => ({ ...acc, [m.id]: m.is_notifications_enabled }), {})
  );

  // ─── Active Verification Status Memo ───────────────────────────────────────
  const verification = useMemo(() => {
    return {
      isVerified: telegramUser?.is_verified || true,
      activeUser: telegramUser?.telegram_username || linkData?.bot_username || "everest",
      pendingCode: linkData?.verification_code || telegramUser?.verification_code || null
    };
  }, [telegramUser, linkData]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleInitiateLink = useCallback(async () => {
    if (!username.trim()) return;
    setLoadingLink(true);
    try {
      const formatted = username.startsWith("@") ? username : `@${username}`;
      const data = await initiateTelegramLink(formatted);
      setLinkData(data);
    } catch (e) {
      console.error("Link initiation failed:", e);
    } finally {
      setLoadingLink(false);
    }
  }, [username]);

  const handleToggle = useCallback(async (monitorId: string) => {
    const current = monitorToggles[monitorId] ?? false;
    try {
      await toggleMonitorNotification(monitorId, !current);
      setMonitorToggles(prev => ({ ...prev, [monitorId]: !current }));
    } catch (e) {
      console.error("Toggle failed", e);
    }
  }, [monitorToggles]);

  const handleBuyCredits = useCallback(async (tier: PricingTier) => {
    setBuyingId(tier.id);
    try {
      // Mocking transaction signature structure - replace with active anchor wallet / web3 instructions here
      const signature = `sig_spl_${Math.random().toString(36).substring(2)}${Date.now()}`;
      
      await addPurchasedCredits({ 
        amount: tier.credits, 
        tx_signature: signature 
      });
      
      await refetchCredits();
    } catch (e) {
      console.error("Credit routing failure:", e);
    } finally {
      setBuyingId(null);
    }
  }, [refetchCredits]);

  const activeTierObj = useMemo(() => 
    PRICING_TIERS.find(t => t.id === selectedTier)!, 
    [selectedTier]
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen text-[var(--text-primary)] space-y-8 animate-fade-in-up">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold flex items-center gap-2">
            <Send className="w-7 h-7 text-sky-400" />
            Telegram Node Console
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Configure automated multi-region worker telemetry dispatch hooks via Solana networks.
          </p>
        </div>

        {/* Dynamic Badge Module */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono self-start md:self-auto ${
          verification.isVerified 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          {verification.isVerified ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Verified Account: {verification.activeUser}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Unverified / No Account Linked</span>
            </>
          )}
        </div>
      </div>

      {/* Main Framework Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Hand: Controls & Subscriptions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Conditional Identity Layer */}
          {verification.isVerified ? (
            <div className="p-6 bg-[var(--bg-card)] border border-emerald-500/20 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-semibold text-base">Telegram Routing Engine Connected</h2>
                <p className="text-xs text-[var(--text-muted)] max-w-lg">
                  Worker health signals are currently authenticated and active for your user channel handle. To change target destinations, contact developer support.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-sky-400" />
                <h2 className="font-semibold">Link Your Telegram Channel</h2>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Register your account profile to initiate the cryptographic handshake sequence needed for two-packet telemetry processing.
              </p>

              <div className="flex gap-2 max-w-md">
                <input
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm outline-none font-mono focus:border-sky-500 transition-colors"
                  placeholder="@yourusername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loadingLink}
                />
                <button
                  onClick={handleInitiateLink}
                  disabled={loadingLink || !username.trim()}
                  className="px-4 py-2 bg-sky-500 text-black text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2"
                >
                  {loadingLink && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loadingLink ? "Generating..." : "Generate Handshake"}
                </button>
              </div>

              {verification.pendingCode && (
                <div className="p-4 bg-sky-500/5 rounded-xl border border-sky-500/20 space-y-2 animate-fade-in-up">
                  <span className="text-xs font-mono text-sky-400 font-semibold block">Handshake Action Required:</span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Send the following validation transaction command to your dispatch endpoint boot channel:
                  </p>
                  <div className="p-2.5 bg-black/40 rounded-md font-mono text-xs text-sky-400 flex items-center justify-between border border-white/5">
                    <span>/verify {verification.pendingCode}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alert Toggles Subsection */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-sky-400" />
                <h2 className="font-semibold">Alert Subscriptions</h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-2 py-0.5 border border-[var(--border-subtle)] rounded bg-black/20">
                Two-Packet Rules Applied
              </span>
            </div>

            {monitors.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
                No telemetry endpoints detected. Register nodes to subscribe to updates.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)] mt-2">
                {monitors.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-3.5 hover:bg-white/[0.01] px-1 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      <span className="text-xs font-mono truncate text-[var(--text-secondary)]">
                        {m.target_url.replace(/^https?:\/\//, "")}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggle(m.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                        monitorToggles[m.id] ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-all absolute top-1 ${
                        monitorToggles[m.id] ? "left-6" : "left-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Hand Sidebar: Token Ledgers & Core Pricing Packages */}
        <div className="space-y-6">
          
          {/* Credit Account Ledger Profile */}
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Available Balances</h3>
              </div>
              <button
                onClick={() => refetchCredits()}
                disabled={loadingCredits}
                className="p-1.5 rounded hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-sky-400 disabled:opacity-40"
                title="Synchronize chain stats"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCredits ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold tracking-tight">
                  {credits?.total_credits_left ?? 0}
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Credits</span>
              </div>
              
              {/* Usage Tier Progress Rows */}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-2 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Free Daily Quota Used:</span>
                  <span className="text-[var(--text-secondary)]">{credits?.free_credits_used ?? 0} / 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Daily Reset Boundary:</span>
                  <span className="text-[var(--text-secondary)] truncate max-w-[120px]">
                    {credits?.free_reset_date ? new Date(credits.free_reset_date).toLocaleDateString() : "UTC Midnight"}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro-Checkout Panel Dynamic Trigger */}
            <div className="pt-2">
              <button
                onClick={() => handleBuyCredits(activeTierObj)}
                disabled={buyingId !== null}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                {buyingId === activeTierObj.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Coins className="w-3.5 h-3.5" />
                )}
                Authorize Checkout ({activeTierObj.cost} {activeTierObj.unit})
              </button>
            </div>
          </div>

          {/* Interactive Pricing Engine Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Select Provision Tier
            </h4>
            
            <div className="space-y-2.5">
              {PRICING_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected 
                        ? "bg-sky-500/[0.03] border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.05)]" 
                        : "bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{tier.name}</span>
                          {tier.badge && (
                            <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal">
                          {tier.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-sky-400">
                          {tier.credits.toLocaleString()} <span className="text-[10px] font-normal text-[var(--text-muted)]">CR</span>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                          {tier.cost} {tier.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}