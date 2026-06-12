import { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 2431, label: "Active nodes", suffix: "" },
  { value: 87, label: "Countries", suffix: "" },
  { value: 14200, label: "Websites monitored", suffix: "", separator: "," },
  { value: 12.4, label: "Daily checks", suffix: "M", decimals: 1 },
  { value: 99.98, label: "Accuracy", suffix: "%", decimals: 2 },
];

export function StatsBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [start, setStart] = useState(false);
  useEffect(() => { if (inView) setStart(true); }, [inView]);

  return (
    <section ref={ref} className="px-4 sm:px-6 py-12 border-y border-white/5 bg-surface/30">
      <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-5 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="text-center md:text-left"
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-gradient">
              {start && (
                <CountUp
                  end={s.value}
                  decimals={s.decimals ?? 0}
                  duration={2.2}
                  separator={s.separator}
                  suffix={s.suffix}
                />
              )}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
