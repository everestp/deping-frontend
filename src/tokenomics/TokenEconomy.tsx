import { motion } from "framer-motion";
import { Building2, Wallet, Cpu, Coins, ArrowDown } from "lucide-react";

const flow = [
  { icon: Building2, label: "Website owner", sub: "Deposits monitoring credits", color: "secondary" },
  { icon: Wallet, label: "Monitoring credits", sub: "Off-chain balance", color: "primary" },
  { icon: Cpu, label: "Reward engine", sub: "Distributes per verified check", color: "primary" },
  { icon: Coins, label: "Node operator", sub: "Accumulates DPN", color: "accent" },
];

export function TokenEconomy() {
  return (
    <section id="token" className="relative px-4 sm:px-6 py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">Token economy</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            A <span className="text-gradient-primary">circular economy</span> for uptime
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Website owners pay for monitoring. Node operators earn DPN tokens settled on Solana
            once a 10-token batch threshold is reached.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-3">
            {flow.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="glass rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-${step.color}/10`}>
                    <step.icon className={`w-5 h-5 text-${step.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold">{step.label}</div>
                    <div className="text-xs text-muted-foreground">{step.sub}</div>
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <div className="flex justify-center py-1">
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative glass rounded-3xl p-8 overflow-hidden"
          >
            <div className="absolute inset-0 opacity-50" style={{ background: "var(--gradient-mesh)" }} />
            <div className="relative">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Reward threshold</div>
              <div className="font-display text-6xl font-bold text-gradient">10 DPN</div>
              <div className="text-sm text-muted-foreground mt-1">batched, then settled on Solana</div>

              <div className="mt-8 space-y-3">
                {[
                  { label: "Settlement time", value: "~400ms" },
                  { label: "Network fee", value: "$0.0001" },
                  { label: "Withdrawal", value: "Any Solana wallet" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <span className="text-sm font-mono font-semibold">{r.value}</span>
                  </div>
                ))}
              </div>

              <motion.div
                className="mt-8 flex items-center justify-center gap-2 text-xs font-mono text-accent"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Settling on Solana mainnet
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
