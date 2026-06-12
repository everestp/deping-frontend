import { motion } from "framer-motion";

import { features } from "../data/features";

export function Features() {
  return (
    <section className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Features</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Everything you need for <span className="text-gradient">real uptime</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
              className="group relative glass rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-secondary/0 group-hover:from-primary/5 group-hover:to-secondary/5 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-white/10 flex items-center justify-center mb-4 group-hover:border-accent/40 group-hover:shadow-[0_0_24px_-6px_var(--glow-accent)] transition-all">
                  <f.icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
                </div>
                <div className="font-display font-semibold text-lg">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
