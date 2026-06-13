import React, { useState } from "react";
import {
  Coins,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../Common/Button";

const MIN_STAKE = 20;

interface StakingPaymentProps {
  walletBalance: number;
  nodePubkey: string;
  staking: boolean;
  error: string | null;
  onStake: (amount: number) => Promise<string>;
}

type Phase = "idle" | "signing" | "validating" | "done";

export function StakingPayment({
  walletBalance,
  nodePubkey,
  staking,
  error,
  onStake,
}: StakingPaymentProps) {
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleStake() {
    setLocalError(null);
    setSuccess(null);

    const val = parseFloat(amount);

    // 1. Structural Inputs Validations
    if (isNaN(val) || val < MIN_STAKE) {
      setLocalError(`Minimum stake is ${MIN_STAKE} DPNG.`);
      return;
    }

    if (val > walletBalance) {
      setLocalError(`Insufficient balance. Available: ${walletBalance.toFixed(4)} DPNG`);
      return;
    }

    try {
      // 2. Phase 1: Requesting wallet signature interaction
      setPhase("signing");
      
      // Execute transaction. When this resolves, it means the signature 
      // was safely accepted by the wallet provider context.
      const stakePromise = onStake(val);
      
      // 3. Phase 2: Switch context to network propagation immediately after signature confirmation
      setPhase("validating");

      // Wait for the confirmation pipeline to settle on-chain
      await stakePromise;

      // 4. Phase 3: Transaction successfully finalized
      setPhase("done");
      setSuccess(`Successfully staked ${val} DPNG. Validator Activated!`);
    } catch (e: any) {
      // Reset visual state cleanly if user rejects transaction or RPC simulation drops
      setPhase("idle");
      setLocalError(e?.message || "Staking transaction failed.");
    }
  }

  const displayError = localError ?? error;
  const isLoading = staking || phase === "signing" || phase === "validating";

  const phaseLabel: Record<Phase, string> = {
    idle: "Stake & Activate Validator",
    signing: "Awaiting wallet signature...",
    validating: "Verifying on-chain...",
    done: "Validator Activated!",
  };

  return (
    <div className="max-w-md mx-auto space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
          style={{
            background: "rgba(56,189,248,0.08)",
            border: "1px solid rgba(56,189,248,0.2)",
          }}
        >
          <ShieldCheck
            className="w-7 h-7"
            style={{ color: "var(--accent-blue)" }}
          />
        </div>

        <h2
          className="font-mono-data text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Stake to Activate Validator
        </h2>

        <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
          Stake minimum {MIN_STAKE} DPNG to activate validator node.
        </p>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        {/* Info Metrics Table Panel */}
        <div className="space-y-2.5">
          {[
            {
              label: "Node",
              value: nodePubkey ? `${nodePubkey.slice(0, 6)}...${nodePubkey.slice(-6)}` : "Unknown",
              accent: "var(--accent-green)",
            },
            {
              label: "Min Stake",
              value: `${MIN_STAKE} DPNG`,
              accent: "var(--accent-blue)",
            },
            {
              label: "Balance",
              value: `${walletBalance.toFixed(4)} DPNG`,
              accent: "var(--accent-amber)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex justify-between py-2"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                {item.label}
              </span>
              <span
                className="font-mono-data text-sm font-semibold"
                style={{ color: item.accent }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Amount Input */}
        <div>
          <label
            className="block text-xs font-mono-data uppercase mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Stake Amount
          </label>

          <div className="relative">
            <Coins
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: "var(--text-muted)" }}
            />

            <input
              type="number"
              min={MIN_STAKE}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading || phase === "done"}
              placeholder={`${MIN_STAKE}`}
              className="w-full font-mono-data text-sm rounded-lg py-2.5 pl-9 pr-16 bg-white/5 outline-none"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />

            <button
              type="button"
              disabled={isLoading || phase === "done"}
              onClick={() => setAmount(walletBalance.toString())}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-blue)" }}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Progress Tracking Layout Panel */}
        {phase !== "idle" && phase !== "done" && (
          <div
            className="relative h-10 rounded-lg overflow-hidden flex items-center justify-center text-xs font-medium animate-pulse"
            style={{
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.25)",
              color: "var(--accent-blue)",
            }}
          >
            {phaseLabel[phase]}
          </div>
        )}

        {/* Error Notification Context Block */}
        {displayError && (
          <div
            className="flex gap-2 px-3 py-2.5 rounded-lg text-xs items-center"
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "var(--accent-red)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Success Notification Context Block */}
        {success && (
          <div
            className="flex gap-2 px-3 py-2.5 rounded-lg text-xs items-center"
            style={{
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.25)",
              color: "var(--accent-green)",
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Core Submission Trigger Button */}
        <Button
          className="w-full flex items-center justify-center gap-2"
          loading={isLoading}
          disabled={phase === "done"}
          onClick={handleStake}
        >
          <Coins className="w-4 h-4" />
          <span>{phaseLabel[phase]}</span>
          {phase === "idle" && (
            <ChevronRight className="w-4 h-4 ml-auto" />
          )}
        </Button>
      </div>
    </div>
  );
}