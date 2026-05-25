"use client";

import { useState, useCallback } from "react";
import {
  initiateTelegramLink,
  addPurchasedCredits,
  toggleMonitorNotification,
  useCreditStatus,
  type LinkTelegramResponse
} from "../api/telegram-api";

interface Monitor {
  id: string;
  target_url: string;
  is_notifications_enabled: boolean;
}

export default function TelegramPage({ monitors = [] }: { monitors?: Monitor[] }) {
  // 1. Data & State
  const { data: credits, refetch: refetchCredits, loading: loadingCredits } = useCreditStatus();

  const [username, setUsername] = useState("");
  const [linkData, setLinkData] = useState<LinkTelegramResponse | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);

  const [monitorToggles, setMonitorToggles] = useState<Record<string, boolean>>(() =>
    monitors.reduce((acc, m) => ({ ...acc, [m.id]: m.is_notifications_enabled }), {})
  );

  // 2. Handlers
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

  const handleBuyCredits = useCallback(async () => {
    try {
      await addPurchasedCredits({ amount: 100, tx_signature: `sig_${Date.now()}` });
      await refetchCredits();
    } catch (e) {
      console.error("Purchase failed", e);
    }
  }, [refetchCredits]);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Telegram Notifications</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)]">
            <h2 className="font-semibold mb-4">Link Your Account</h2>
            <input
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg p-3 mb-4 outline-none focus:border-sky-500"
              placeholder="@yourusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              onClick={handleInitiateLink}
              disabled={loadingLink}
              className="px-6 py-2 bg-sky-500 text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loadingLink ? "Generating..." : "Generate Code"}
            </button>
            {linkData && (
              <div className="mt-4 p-4 bg-black/20 rounded-lg font-mono text-sm border border-sky-500/20">
                Send to bot: <span className="text-sky-400">/verify {linkData.verification_code}</span>
              </div>
            )}
          </div>

          <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)]">
            <h2 className="font-semibold mb-6">Alert Subscriptions</h2>
            {monitors.map((m) => (
              <div key={m.id} className="flex justify-between py-4 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-sm font-mono">{m.target_url.replace(/^https?:\/\//, "")}</span>
                <button
                  onClick={() => handleToggle(m.id)}
                  className={`w-12 h-6 rounded-full transition-colors ${monitorToggles[m.id] ? 'bg-green-500' : 'bg-gray-500'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${monitorToggles[m.id] ? 'ml-6.5 translate-x-0' : 'ml-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Credits</h3>
            <button
              onClick={() => refetchCredits()}
              disabled={loadingCredits}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              <svg className={`w-4 h-4 ${loadingCredits ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p className="text-3xl font-bold mb-6">{credits?.total_credits_left ?? 0}</p>
          <button
            onClick={handleBuyCredits}
            className="w-full py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors"
          >
            Buy 100 Credits
          </button>
        </div>
      </div>
    </div>
  );
}
