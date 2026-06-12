import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { pricingPlans } from "../data/pricing";
import { Button } from "../ui/button";


export function Pricing() {
  return (
    <section id="pricing" className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Pricing</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Pay only for <span className="text-gradient">what you monitor</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {pricingPlans.map((p, i) => (
            <motion.div
              key={p.name}
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
                  Most popular
                </div>
              )}
              <div className="font-display font-semibold text-lg">{p.name}</div>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold tracking-tight">{p.price}</span>
                {p.period && <span className="text-muted-foreground text-sm">{p.period}</span>}
              </div>
              <Button
                className={`mt-6 w-full ${
                  p.highlighted
                    ? "bg-gradient-to-r from-primary to-secondary border-0 text-white hover:opacity-90"
                    : "bg-surface-elevated hover:bg-surface-elevated/70 border border-white/10 text-foreground"
                }`}
              >
                {p.cta}
              </Button>
              <ul className="mt-7 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
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
