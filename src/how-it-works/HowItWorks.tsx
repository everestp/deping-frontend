import { motion } from "framer-motion";
import { Globe2, Calendar, Cpu, ShieldCheck, Coins } from "lucide-react";

const steps = [
  { icon: Globe2, title: "Add your website", desc: "Drop a URL into the dashboard. Set check frequency and alert rules." },
  { icon: Calendar, title: "Scheduler creates jobs", desc: "Redis dispatches signed jobs to RabbitMQ across all eligible regions." },
  { icon: Cpu, title: "Global nodes execute", desc: "Independent Rust workers run the check from their physical location." },
  { icon: ShieldCheck, title: "Consensus validation", desc: "Geographically diverse results are cross-verified — outliers rejected." },
  { icon: Coins, title: "Operators earn rewards", desc: "Verified checks settle DPN tokens to operators on Solana mainnet." },
];

export function HowItWorks() {
  return (
    <section className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">How it works</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            From request to <span className="text-gradient-primary">reward</span> in seconds
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="relative glass rounded-2xl p-5 hover:border-white/20 transition-colors group"
            >
              <div className="absolute -top-3 left-5 text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-white/10">
                0{i + 1}
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors">
                <s.icon className="w-5 h-5 text-secondary" />
              </div>
              <div className="font-semibold text-sm">{s.title}</div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
