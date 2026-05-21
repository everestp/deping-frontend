import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Globe, Shield, Zap, ArrowRight, CheckCircle, TrendingUp, Server } from 'lucide-react';
import { Button } from '../components/Common/Button';
import { Card } from '../components/Common/Card';
import { useInterval } from '../hooks/useInterval';

const STAT_TARGETS = [
  { label: 'Active Nodes', value: 2847, suffix: '+', color: 'text-sky-400' },
  { label: 'Checks / Min', value: 142000, suffix: '', color: 'text-emerald-400' },
  { label: 'Avg Latency', value: 38, suffix: 'ms', color: 'text-amber-400' },
  { label: 'Uptime SLA', value: 99.94, suffix: '%', color: 'text-sky-400' },
];

const FEATURES = [
  {
    icon: <Globe className="w-5 h-5 text-sky-400" />,
    title: 'Global Node Fleet',
    description: 'Distributed monitoring agents across 6 continents, powered by a decentralized Rust CLI worker mesh.',
  },
  {
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    title: 'On-Chain Settlement',
    description: 'Micro-rewards are verified and settled directly to your Solana wallet via $UPT token transfers.',
  },
  {
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    title: 'Real-Time Telemetry',
    description: 'Sub-second latency streams with zero-latency event pipelines through Go-Chi backend architecture.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-sky-400" />,
    title: 'Reward Analytics',
    description: 'Track accumulated off-chain earnings, claim milestones, and on-chain settlement history.',
  },
];

const TICKER_LINES = [
  'Node US-East-1 → api.example.com → 28ms [200 OK]',
  'Node EU-Central-2 → status.solana.com → 45ms [200 OK]',
  'Node AP-South-1 → rpc.mainnet.xyz → 91ms [200 OK]',
  'Node US-West-1 → api.coingecko.com → 62ms [200 OK]',
  'Node SA-East-1 → ping.deping.xyz → 33ms [200 OK]',
];

export default function Home() {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [nodeCount, setNodeCount] = useState(2847);

  useInterval(() => {
    setTickerIndex((p) => (p + 1) % TICKER_LINES.length);
    setNodeCount((p) => p + Math.floor(Math.random() * 3));
  }, 2800);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(56,182,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,182,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-500/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/25 bg-sky-500/8 text-xs text-sky-400 font-mono-data mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse-dot" />
            Decentralized monitoring protocol — now live on Solana devnet
          </div>

          <h1 className="font-mono-data text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="text-gradient-brand">Network intelligence,</span>
            <br />
            <span className="text-[var(--text-primary)]">on-chain rewards.</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Deploy Rust CLI monitoring nodes, earn $UPT tokens for every verified health check,
            and settle micro-rewards directly to your Solana wallet — no intermediaries.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="glow-blue">
                Launch Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Live ticker */}
          <div className="mt-12 terminal-bg rounded-xl px-5 py-3 text-left max-w-xl mx-auto overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-xs text-emerald-400 font-mono-data">LIVE FEED</span>
            </div>
            <p className="text-xs text-emerald-300 font-mono-data animate-fade-in-up truncate" key={tickerIndex}>
              [{new Date().toISOString().slice(11, 19)} UTC] INGEST: {TICKER_LINES[tickerIndex]}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_TARGETS.map((s) => (
            <Card key={s.label} className="text-center">
              <div className={`font-mono-data text-2xl md:text-3xl font-bold ${s.color}`}>
                {s.value.toLocaleString()}{s.suffix}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono-data text-2xl font-semibold text-center mb-10 text-[var(--text-primary)]">
            Built for operators, designed for scale
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="flex gap-4">
                <div className="mt-0.5 shrink-0 w-10 h-10 rounded-lg bg-white/5 border border-[var(--border-subtle)] flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{f.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Node counter live */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Server className="w-5 h-5 text-sky-400" />
              <span className="text-sm text-[var(--text-muted)]">Total nodes reporting right now</span>
            </div>
            <div className="font-mono-data text-5xl font-bold text-gradient-brand mb-2">
              {nodeCount.toLocaleString()}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono-data">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              Live counter — updates every 2.8s
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <Card glow className="py-10">
            <h2 className="font-mono-data text-2xl font-bold text-[var(--text-primary)] mb-3">
              Start earning $UPT today
            </h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">
              Connect your Solana wallet, configure monitoring targets, and let the Rust CLI nodes do the work.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-6 text-sm text-[var(--text-secondary)]">
              {['No setup fees', 'Instant deployment', 'Open protocol'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
            <Link to="/signup">
              <Button size="lg">
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
