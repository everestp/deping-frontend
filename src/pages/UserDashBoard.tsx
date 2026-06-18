"use client";

import {
  Coins,
  Loader2,
  RefreshCw,
  Sparkles,
  
  Server,
  Activity,
  ShieldCheck
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMe, UserInfo } from "../api/auth-api"; // Assuming your getMe is here
import { addMonitorPurchasedCredits } from "../api/telegram-api";

// 1. Core Solana & Anchor Context Imports
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "../solana/program/anchor-provider";
import { buyProduct } from "../solana/program/breezo.method";

interface PricingTier {
  id: string;
  name: string;
  credits: number;
  cost: number;
  unit: string;
  badge?: string;
  description: string;
}

const PRICING_TIERS: PricingTier[] = [
  { id: "tier_basic", name: "Basic Plan", credits: 100, cost: 10, unit: "DPNG", description: "Perfect for starter node monitoring." },
  { id: "tier_silver", name: "Silver Package", credits: 1000, cost: 80, unit: "DPNG", badge: "Most Popular", description: "Optimal for multiple infrastructure regions." },
  { id: "tier_gold", name: "Gold Ultimate", credits: 10000, cost: 700, unit: "DPNG", badge: "Best Rate (30% Off)", description: "Enterprise scale for high-availability validation." },
];

const TOKEN_DECIMALS = 1_000_000_000;

export default function UserDashboard() {
  const { connection } = useConnection();
  const walletContext = useAnchorWallet();
  const program = useProgram();

  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [loadingUser, setLoadingUser] = useState(true);

  
  const [selectedTier, setSelectedTier] = useState<string>("tier_silver");
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const user = await getMe();
        setUserInfo(user);
      } catch (err) {
        console.error("Failed loading user info", err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadData();
  }, []);

  const handleBuyCredits = useCallback(async (tier: PricingTier) => {
    if (!walletContext || !program) {
      toast.error("Please link your Solana wallet to execute checkout.");
      return;
    }

    setBuyingId(tier.id);
    const toastId = toast.loading(`Initiating purchase for ${tier.name}...`);
    
    try {
      const amountRaw = new BN(Math.round(tier.cost * TOKEN_DECIMALS));
      
      toast.loading("Awaiting wallet signature...", { id: toastId });
      const sig = await buyProduct(program, amountRaw, walletContext);
      
      toast.loading("Confirming transaction on-chain...", { id: toastId });
      await connection.confirmTransaction(sig, 'finalized');

      toast.loading("Syncing with ledger tracking engines...", { id: toastId });
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await addMonitorPurchasedCredits({ 
        expected_amount: tier.cost * TOKEN_DECIMALS, 
        signature: sig,
        credit_balance: tier.credits
      });
      
      await getMe();
      toast.success(`Successfully acquired ${tier.credits.toLocaleString()} monitor credits!`, { id: toastId, duration: 5000 });
    } catch (e: any) {
      toast.error(`Checkout failed: ${e?.message || "Rejected."}`, { id: toastId });
    } finally {
      setBuyingId(null);
    }
  }, [walletContext, program, connection]);

  const activeTierObj = useMemo(() => PRICING_TIERS.find(t => t.id === selectedTier)!, [selectedTier]);

  if (loadingUser) return <div className="flex items-center justify-center min-h-screen text-[var(--text-primary)]"><Loader2 className="w-8 h-8 animate-spin text-sky-400" /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen text-[var(--text-primary)] space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono font-bold flex items-center gap-2">
            <Server className="w-7 h-7 text-sky-400" />
            Infrastructure Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your node monitoring resources and billing cycles.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400"><ShieldCheck className="w-6 h-6" /></div>
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Account Status</h2>
              <p className="text-sm text-[var(--text-secondary)] font-mono">{userInfo?.email}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Your infrastructure monitoring account is fully provisioned and operational.</p>
            </div>
          </div>

          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-zinc-800 rounded-xl text-zinc-400"><Activity className="w-6 h-6" /></div>
            <div>
              <h3 className="text-sm font-semibold">Wallet Key</h3>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-1 break-all">{userInfo?.wallet_pubkey}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">Monitor Balance</h3>
              </div>
              <button onClick={() => getMe()}  className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUser ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            <div className="space-y-3 font-mono border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{userInfo?.monitor_credit_balance ?? 0}</span>
                <span className="text-xs text-[var(--text-muted)] uppercase">Credits</span>
              </div>
            </div>

            <div className="pt-2">
              <button onClick={() => handleBuyCredits(activeTierObj)} disabled={buyingId !== null} className="w-full py-2.5 bg-white text-black rounded-xl font-mono text-xs font-bold transition-colors flex items-center justify-center gap-2">
                {buyingId === activeTierObj.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
                Purchase Credits ({activeTierObj.cost} {activeTierObj.unit})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" /> Select Provision Tier
            </h4>
            <div className="space-y-2.5">
              {PRICING_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div key={tier.id} onClick={() => setSelectedTier(tier.id)} className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${isSelected ? "bg-sky-500/[0.03] border-sky-500" : "bg-[var(--bg-card)] border-[var(--border-subtle)]"}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-xs font-bold">{tier.name}</span>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1">{tier.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-sky-400">{tier.credits.toLocaleString()} CR</div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">{tier.cost} {tier.unit}</div>
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