"use client";

import { motion } from "framer-motion";
import { Check, Send } from "lucide-react";
import { Button } from "../ui/button";

export const TELEGRAM_PLANS = [
  { 
    id: "tele_starter", 
    name: "Starter Alerts", 
    credits: 100, 
    cost: 10, 
    unit: "DPNG", 
    highlighted: false,
    description: "Quick notifications for hobby projects.",
    features: ["500 Telegram alerts", "Instant delivery", "No expiry"] 
  },
  { 
    id: "tele_pro", 
    name: "Pro Messenger", 
    credits: 1000, 
    cost: 80, 
    unit: "DPNG", 
    highlighted: true,
    badge: "Most Popular",
    description: "High-volume notifications for teams.",
    features: ["5,000 Telegram alerts", "Priority routing", "Webhook integration"] 
  },
  { 
    id: "tele_ent", 
    name: "Enterprise Push", 
    credits: 10000, 
    cost: 700, 
    unit: "DPNG", 
    highlighted: false,
    description: "Unlimited scale for mission-critical alerts.",
    features: ["50,000 Telegram alerts", "Custom alert logic", "Dedicated support"] 
  },
];

export function TelegramPricing() {
  return (
    <section className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Telegram Extensions</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Scale your <span className="text-gradient">notification reach</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {TELEGRAM_PLANS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-3xl p-7 ${
                p.highlighted
                  ? "glass-strong border-primary/40 shadow-[0_0_60px_-15px_var(--glow-primary)]"
                  : "glass"
              }`}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-gradient-to-r from-primary to-secondary text-white">
                  {p.badge || "Most Popular"}
                </div>
              )}

              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Send className="w-5 h-5 text-blue-400" />
              </div>

              <div className="font-display font-semibold text-lg">{p.name}</div>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>

              <div className="mt-6 flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight">{p.credits.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm uppercase">Alerts</span>
                </div>
                <div className="text-blue-400 font-mono text-sm mt-1 font-bold">
                  {p.cost} {p.unit}
                </div>
              </div>

              <Button
                className={`mt-6 w-full ${
                  p.highlighted
                    ? "bg-gradient-to-r from-primary to-secondary border-0 text-white hover:opacity-90"
                    : "bg-surface-elevated hover:bg-surface-elevated/70 border border-white/10 text-foreground"
                }`}
              >
                Get {p.credits.toLocaleString()} Alerts
              </Button>

              <ul className="mt-7 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}