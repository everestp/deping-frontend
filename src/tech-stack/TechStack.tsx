import { motion } from "framer-motion";

const tech = [
  "Rust", "Tokio", "gRPC", "Go", "Gin", "RabbitMQ", "Redis",
  "PostgreSQL", "Kubernetes", "Prometheus", "Grafana", "Solana", "Anchor",
];

export function TechStack() {
  return (
    <section className="relative px-4 sm:px-6 py-24 border-y border-white/5 bg-surface/20">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Built on</div>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight">
            A production-grade open-source stack
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {tech.map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              whileHover={{ y: -2 }}
              className="glass px-4 py-2 rounded-full text-sm font-mono hover:border-secondary/40 hover:shadow-[0_0_20px_-6px_var(--glow-secondary)] transition-all cursor-default"
            >
              {t}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
