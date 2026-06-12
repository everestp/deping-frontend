import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid,
} from "recharts";

const uptimeData = Array.from({ length: 30 }, (_, i) => ({
  d: i + 1,
  latency: 30 + Math.round(Math.random() * 60 + (i % 7 === 0 ? 40 : 0)),
}));

const regionData = [
  { region: "NA", checks: 2840 },
  { region: "EU", checks: 3120 },
  { region: "ASIA", checks: 4210 },
  { region: "SA", checks: 980 },
  { region: "AF", checks: 540 },
  { region: "OC", checks: 720 },
];

const tabs = ["Overview", "Monitors", "Analytics", "Nodes", "Rewards"];

export function DashboardPreview() {
  const [active, setActive] = useState("Overview");
  return (
    <section className="relative px-4 sm:px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-secondary font-semibold">Dashboard</div>
          <h2 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            One pane of glass for <span className="text-gradient">global uptime</span>
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl glass-strong overflow-hidden shadow-2xl"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-black/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-xs font-mono text-muted-foreground bg-background/60 rounded-md px-3 py-1 border border-white/5">
                app.deping.network/dashboard
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-3 border-b border-white/5 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`px-3 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap ${
                  active === t
                    ? "text-foreground border-b-2 border-secondary -mb-px"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { label: "Uptime", value: "99.98%", trend: "+0.02%", color: "text-accent" },
              { label: "Avg latency", value: "42ms", trend: "-3ms", color: "text-secondary" },
              { label: "Incidents", value: "0", trend: "7d clean", color: "text-foreground" },
            ].map((s) => (
              <div key={s.label} className="bg-surface/60 border border-white/5 rounded-xl p-4">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`mt-1 font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{s.trend}</div>
              </div>
            ))}

            <div className="lg:col-span-2 bg-surface/60 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium">Latency (last 30 days)</div>
                <div className="text-[10px] font-mono text-muted-foreground">ms</div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={uptimeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.74 0.14 210)" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="oklch(0.74 0.14 210)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                    <XAxis dataKey="d" stroke="oklch(0.7 0 0)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.7 0 0)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.025 270 / 0.95)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                    />
                    <Area type="monotone" dataKey="latency" stroke="oklch(0.74 0.14 210)" strokeWidth={2} fill="url(#lat)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-surface/60 border border-white/5 rounded-xl p-4">
              <div className="text-xs font-medium mb-2">Checks by region</div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                    <XAxis dataKey="region" stroke="oklch(0.7 0 0)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="oklch(0.7 0 0)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.025 270 / 0.95)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    />
                    <Bar dataKey="checks" fill="oklch(0.55 0.25 295)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-3 bg-surface/60 border border-white/5 rounded-xl p-4">
              <div className="text-xs font-medium mb-3">Recent activity</div>
              <div className="space-y-2 font-mono text-[11px]">
                {[
                  { t: "12:42:08", e: "openai.com checked from 142 nodes — 200 OK · 38ms", c: "text-accent" },
                  { t: "12:42:01", e: "stripe.com checked from 138 nodes — 200 OK · 51ms", c: "text-accent" },
                  { t: "12:41:55", e: "Reward batch settled · 124 operators · 1,240 DPN", c: "text-secondary" },
                  { t: "12:41:48", e: "New worker joined · region=Lagos · uptime=99.94%", c: "text-muted-foreground" },
                ].map((row, i) => (
                  <div key={i} className="flex gap-3 py-1 border-b border-white/5 last:border-0">
                    <span className="text-muted-foreground shrink-0">{row.t}</span>
                    <span className={row.c}>{row.e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
