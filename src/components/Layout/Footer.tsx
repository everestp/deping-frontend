import React from 'react';
import { Zap, Github, Twitter, ExternalLink } from 'lucide-react';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="glass border-t border-[var(--border-subtle)] mt-auto">
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span className="font-mono-data font-semibold text-gradient-brand">deping.xyz</span>
            <span className="text-[var(--text-muted)] text-sm">
              — Decentralized Network Intelligence
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[var(--text-muted)]">
            <a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-1">
              Docs <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-1">
              API <ExternalLink className="w-3 h-3" />
            </a>
            <a href="#" className="hover:text-sky-400 transition-colors">
              Status
            </a>
            <a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-1">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="hover:text-sky-400 transition-colors flex items-center gap-1">
              <Twitter className="w-4 h-4" />
            </a>
          </div>

          <p className="text-xs text-[var(--text-muted)] font-mono-data">
            &copy; {year} deping.xyz — All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
