import { Activity } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: ["Monitors", "Status pages", "Alerts", "API", "Pricing"],
  },
  {
    title: "Network",
    links: ["Become a node", "Operator docs", "Reputation", "Rewards"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Blog", "Changelog", "Status", "Security"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Contact", "Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 pt-20 pb-10 border-t border-white/5">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
            <span className="font-mono-data font-bold text-lg text-[var(--text-primary)] tracking-tight">
            deping.xyz
          </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Decentralized uptime monitoring powered by a global network of real nodes, settled
              on Solana.
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                {c.title}
              </div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} DePing Labs. All rights reserved.</div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
