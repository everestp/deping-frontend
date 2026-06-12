import { motion } from "framer-motion";
import { ShieldCheck, Globe, KeyRound, Network, ScanSearch, FileCheck2 } from "lucide-react";

const security = [
  { icon: ShieldCheck, title: "Consensus validation", desc: "Multi-region agreement required before any alert fires." },
  { icon: Globe, title: "Geographic diversity scoring", desc: "Jobs preferentially routed to maximize regional coverage." },
  { icon: KeyRound, title: "Node identity verification", desc: "Every worker proves ownership via signed Solana wallet." },
  { icon: Network, title: "Anti-Sybil protection", desc: "Reputation + stake requirements prevent flood attacks." },
  { icon: ScanSearch, title: "Fraud detection", desc: "Statistical outlier detection on every batch of results." },
  { icon: FileCheck2, title: "Signed result payloads", desc: "Every check is Ed25519-signed and tamper-evident." },
];

export function Security() {
  return (
    <section className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Security</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Trust, <span className="text-gradient">verified by math</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {security.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="glass rounded-2xl p-6 hover:border-accent/30 transition-colors"
            >
              <s.icon className="w-7 h-7 text-accent mb-3" strokeWidth={1.6} />
              <div className="font-display font-semibold">{s.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
