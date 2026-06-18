"use client";

import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Node {
  id: string;
  label: string;
  tech: string;
  desc: string;
  x: number;
  y: number;
  w: number;
  h: number;
  layer: LayerColor;
}

interface FlowPath {
  id: string;
  step: number;
  d: string;
  color: string;
  protocol: string;
  packetColor: string;
}

type LayerColor = "blue" | "purple" | "orange" | "green" | "red" | "yellow";

interface Layer {
  id: string;
  label: string;
  color: LayerColor;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS_W = 1280;
const CANVAS_H = 700;

const LAYER_STYLES: Record<LayerColor, { bg: string; border: string; labelBg: string; labelBorder: string; labelText: string; nodeBg: string; nodeBorder: string; titleColor: string; pulse: string }> = {
  blue:   { bg: "rgba(55,138,221,0.04)",  border: "rgba(55,138,221,0.2)",  labelBg: "rgba(55,138,221,0.12)",  labelBorder: "rgba(55,138,221,0.3)",  labelText: "var(--color-text-info)",    nodeBg: "rgba(55,138,221,0.07)",  nodeBorder: "rgba(55,138,221,0.28)",  titleColor: "var(--color-text-info)",    pulse: "var(--color-text-info)" },
  purple: { bg: "rgba(127,119,221,0.04)", border: "rgba(127,119,221,0.2)", labelBg: "rgba(127,119,221,0.12)", labelBorder: "rgba(127,119,221,0.3)", labelText: "#9b94f0",                   nodeBg: "rgba(127,119,221,0.07)", nodeBorder: "rgba(127,119,221,0.28)", titleColor: "#9b94f0",                   pulse: "#9b94f0" },
  orange: { bg: "rgba(186,117,23,0.04)",  border: "rgba(186,117,23,0.2)",  labelBg: "rgba(186,117,23,0.12)",  labelBorder: "rgba(186,117,23,0.3)",  labelText: "var(--color-text-warning)", nodeBg: "rgba(186,117,23,0.07)",  nodeBorder: "rgba(186,117,23,0.28)",  titleColor: "var(--color-text-warning)", pulse: "var(--color-text-warning)" },
  green:  { bg: "rgba(99,153,34,0.04)",   border: "rgba(99,153,34,0.2)",   labelBg: "rgba(99,153,34,0.12)",   labelBorder: "rgba(99,153,34,0.3)",   labelText: "var(--color-text-success)", nodeBg: "rgba(99,153,34,0.07)",   nodeBorder: "rgba(99,153,34,0.28)",   titleColor: "var(--color-text-success)", pulse: "var(--color-text-success)" },
  red:    { bg: "rgba(226,75,74,0.04)",   border: "rgba(226,75,74,0.2)",   labelBg: "rgba(226,75,74,0.12)",   labelBorder: "rgba(226,75,74,0.3)",   labelText: "var(--color-text-danger)",  nodeBg: "rgba(226,75,74,0.07)",   nodeBorder: "rgba(226,75,74,0.28)",   titleColor: "var(--color-text-danger)",  pulse: "var(--color-text-danger)" },
  yellow: { bg: "rgba(239,159,39,0.04)",  border: "rgba(239,159,39,0.2)",  labelBg: "rgba(239,159,39,0.12)",  labelBorder: "rgba(239,159,39,0.3)",  labelText: "#ef9f27",                   nodeBg: "rgba(239,159,39,0.07)",  nodeBorder: "rgba(239,159,39,0.28)",  titleColor: "#ef9f27",                   pulse: "#ef9f27" },
};

const LAYERS: Layer[] = [
  { id: "public",   label: "Public network",    color: "blue",   x: 18,  y: 36, w: 248, h: 636 },
  { id: "ingress",  label: "Ingress",            color: "purple", x: 282, y: 36, w: 180, h: 636 },
  { id: "bus",      label: "Event bus",          color: "orange", x: 478, y: 36, w: 180, h: 636 },
  { id: "compute",  label: "Storage & compute",  color: "green",  x: 674, y: 36, w: 204, h: 636 },
  { id: "chain",    label: "Blockchain",         color: "red",    x: 894, y: 36, w: 160, h: 300 },
  { id: "notif",    label: "Notifications",      color: "yellow", x: 894, y: 352, w: 366, h: 320 },
];

const NODES: Node[] = [
  { id: "target", label: "Target websites",      tech: "HTTPS endpoints",             desc: "External sites monitored for uptime & latency",    x: 32,  y: 72,  w: 220, h: 90,  layer: "blue" },
  { id: "miner",  label: "Rust CLI miner",        tech: "Tokio · gRPC client · HTTPS", desc: "Distributed edge worker. Polls targets, signs results", x: 32,  y: 220, w: 220, h: 90,  layer: "blue" },
  { id: "grpc",   label: "Go gRPC core",          tech: "gRPC · streaming",            desc: "Worker coordination & job dispatch",               x: 296, y: 72,  w: 152, h: 90,  layer: "purple" },
  { id: "rest",   label: "Go REST API",           tech: "Gin · signed payloads",       desc: "Result ingestion from miners",                    x: 296, y: 280, w: 152, h: 90,  layer: "purple" },
  { id: "jq",     label: "job_queue",             tech: "AMQP queue",                  desc: "Monitoring batch dispatch to miners",              x: 492, y: 72,  w: 152, h: 78,  layer: "orange" },
  { id: "rmq",    label: "RabbitMQ cluster",      tech: "AMQP · fanout exchange",      desc: "monitoring_events fanout — processing / telegram / analytics queues", x: 492, y: 210, w: 152, h: 90, layer: "orange" },
  { id: "tq",     label: "telegram_queue",        tech: "AMQP · dedup · rate-limit",   desc: "Rate-limited alert delivery queue",               x: 492, y: 440, w: 152, h: 78,  layer: "orange" },
  { id: "aq",     label: "analytics_queue",       tech: "AMQP queue",                  desc: "Metrics dashboard feed",                          x: 492, y: 566, w: 152, h: 78,  layer: "orange" },
  { id: "redis",  label: "Redis scheduler",       tech: "ZSET · job scheduling",       desc: "Polls gRPC core with target batches",             x: 688, y: 56,  w: 176, h: 84,  layer: "green" },
  { id: "worker", label: "Go worker pool",        tech: "consensus · fraud detection", desc: "Processes monitoring results, triggers rewards",  x: 688, y: 220, w: 176, h: 90,  layer: "green" },
  { id: "pg",     label: "PostgreSQL",            tech: "metrics · uptime · balances", desc: "Persistent storage for all metrics",              x: 688, y: 396, w: 176, h: 84,  layer: "green" },
  { id: "sync",   label: "Solana sync handler",   tech: "settlement engine · RPC",     desc: "Triggers on-chain reward transactions",           x: 688, y: 548, w: 176, h: 84,  layer: "green" },
  { id: "sol",    label: "Solana mainnet",        tech: "PoH · RPC",                   desc: "On-chain settlement layer",                       x: 908, y: 56,  w: 136, h: 84,  layer: "red" },
  { id: "anchor", label: "Anchor program",        tech: "SPL · reward distribution",   desc: "Distributes miner SPL rewards",                   x: 908, y: 200, w: 136, h: 84,  layer: "red" },
  { id: "tbot",   label: "Telegram bot service",  tech: "consumer · dedup · rate-limit", desc: "DOWN alerts, latency spikes, real-time delivery", x: 908, y: 372, w: 136, h: 90, layer: "yellow" },
  { id: "tapi",   label: "Telegram Bot API",      tech: "sendMessage endpoint",        desc: "Real-time alert delivery to operators",           x: 1080, y: 468, w: 156, h: 84, layer: "yellow" },
];

const FLOWS: FlowPath[] = [
  { id:"f1",  step:1,  d:"M 776,98 C 720,98 490,98 448,117",          color:"rgba(99,153,34,0.55)",   protocol:"Redis",    packetColor:"rgba(99,153,34,0.95)" },
  { id:"f2",  step:2,  d:"M 448,117 C 470,117 472,111 492,111",       color:"rgba(127,119,221,0.55)", protocol:"AMQP",     packetColor:"rgba(127,119,221,0.95)" },
  { id:"f3",  step:3,  d:"M 492,111 C 430,111 140,140 142,220",       color:"rgba(55,138,221,0.55)",  protocol:"gRPC",     packetColor:"rgba(55,138,221,0.95)" },
  { id:"f4",  step:4,  d:"M 142,220 C 80,200 52,180 52,162",          color:"rgba(55,138,221,0.4)",   protocol:"HTTPS",    packetColor:"rgba(55,138,221,0.8)" },
  { id:"f5",  step:5,  d:"M 52,162 C 100,162 160,200 160,220",        color:"rgba(55,138,221,0.4)",   protocol:"HTTPS",    packetColor:"rgba(55,138,221,0.8)" },
  { id:"f6",  step:6,  d:"M 200,280 C 250,280 268,295 296,305",       color:"rgba(127,119,221,0.55)", protocol:"REST",     packetColor:"rgba(127,119,221,0.95)" },
  { id:"f7",  step:7,  d:"M 448,310 C 466,310 468,255 492,255",       color:"rgba(186,117,23,0.55)",  protocol:"AMQP",     packetColor:"rgba(186,117,23,0.95)" },
  { id:"f8",  step:8,  d:"M 644,255 C 660,255 668,260 688,255",       color:"rgba(99,153,34,0.55)",   protocol:"AMQP",     packetColor:"rgba(99,153,34,0.95)" },
  { id:"f9",  step:9,  d:"M 568,300 C 568,360 568,420 568,440",       color:"rgba(239,159,39,0.55)",  protocol:"AMQP",     packetColor:"rgba(239,159,39,0.95)" },
  { id:"f10", step:10, d:"M 574,310 C 574,460 574,550 574,566",       color:"rgba(239,159,39,0.45)",  protocol:"AMQP",     packetColor:"rgba(239,159,39,0.8)" },
  { id:"f11", step:11, d:"M 688,265 C 660,265 648,265 644,265",       color:"rgba(99,153,34,0.5)",    protocol:"queue",    packetColor:"rgba(99,153,34,0.85)" },
  { id:"f12", step:12, d:"M 776,310 C 776,360 776,390 776,396",       color:"rgba(99,153,34,0.55)",   protocol:"SQL",      packetColor:"rgba(99,153,34,0.95)" },
  { id:"f13", step:13, d:"M 688,290 C 640,290 630,400 644,480",       color:"rgba(99,153,34,0.5)",    protocol:"AMQP",     packetColor:"rgba(99,153,34,0.85)" },
  { id:"f14", step:14, d:"M 644,480 C 660,510 668,548 688,580",       color:"rgba(226,75,74,0.55)",   protocol:"AMQP",     packetColor:"rgba(226,75,74,0.95)" },
  { id:"f15", step:15, d:"M 864,590 C 882,590 884,420 884,140",       color:"rgba(226,75,74,0.55)",   protocol:"RPC",      packetColor:"rgba(226,75,74,0.95)" },
  { id:"f16", step:16, d:"M 976,140 C 976,172 976,188 976,200",       color:"rgba(226,75,74,0.55)",   protocol:"SPL",      packetColor:"rgba(226,75,74,0.95)" },
  { id:"f17", step:17, d:"M 644,479 C 780,479 860,440 908,417",       color:"rgba(239,159,39,0.55)",  protocol:"AMQP",     packetColor:"rgba(239,159,39,0.95)" },
  { id:"f18", step:18, d:"M 1044,417 C 1070,430 1090,455 1090,468",  color:"rgba(239,159,39,0.55)",   protocol:"Bot API",  packetColor:"rgba(239,159,39,0.95)" },
];

// Step label positions
const STEP_LABELS: { step: number; x: number; y: number; color: string }[] = [
  { step:1,  x:588, y:85,  color:"rgba(99,153,34,0.9)" },
  { step:2,  x:470, y:100, color:"rgba(127,119,221,0.9)" },
  { step:3,  x:330, y:133, color:"rgba(55,138,221,0.9)" },
  { step:4,  x:62,  y:195, color:"rgba(55,138,221,0.9)" },
  { step:5,  x:178, y:198, color:"rgba(55,138,221,0.9)" },
  { step:6,  x:254, y:274, color:"rgba(127,119,221,0.9)" },
  { step:7,  x:462, y:286, color:"rgba(186,117,23,0.9)" },
  { step:8,  x:658, y:244, color:"rgba(99,153,34,0.9)" },
  { step:9,  x:541, y:368, color:"rgba(239,159,39,0.9)" },
  { step:10, x:528, y:500, color:"rgba(239,159,39,0.8)" },
  { step:12, x:752, y:360, color:"rgba(99,153,34,0.9)" },
  { step:13, x:630, y:365, color:"rgba(99,153,34,0.8)" },
  { step:14, x:652, y:522, color:"rgba(226,75,74,0.9)" },
  { step:15, x:858, y:370, color:"rgba(226,75,74,0.9)" },
  { step:16, x:952, y:172, color:"rgba(226,75,74,0.9)" },
  { step:17, x:770, y:462, color:"rgba(239,159,39,0.9)" },
  { step:18, x:1064, y:440, color:"rgba(239,159,39,0.9)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPathPoint(path: SVGPathElement, t: number) {
  const len = path.getTotalLength();
  return path.getPointAtLength(t * len);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  return (
    <span
      style={{ position: "absolute", top: 9, right: 9, width: 8, height: 8 }}
    >
      <motion.span
        style={{
          display: "block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          position: "absolute",
        }}
      />
      <motion.span
        animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        style={{
          display: "block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </span>
  );
}

function ArchNode({ node, index }: { node: Node; index: number }) {
  const s = LAYER_STYLES[node.layer];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.03, zIndex: 50 }}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.w,
        height: node.h,
        background: s.nodeBg,
        border: `1px solid ${s.nodeBorder}`,
        borderRadius: 8,
        padding: "10px 12px 9px",
        backdropFilter: "blur(4px)",
        cursor: "default",
        transition: "box-shadow 0.15s",
      }}
    >
      <PulseDot color={s.pulse} />
      <div style={{ fontSize: 12, fontWeight: 500, color: s.titleColor, lineHeight: 1.2, paddingRight: 16 }}>
        {node.label}
      </div>
      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
        {node.tech}
      </div>
      <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
        {node.desc}
      </div>
    </motion.div>
  );
}

function AnimatedPacket({
  pathId,
  color,
  speed,
  offset,
}: {
  pathId: string;
  color: string;
  speed: number;
  offset: number;
}) {
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const t = useRef(offset);

  useAnimationFrame(() => {
    const el = document.getElementById(pathId) as SVGPathElement | null;
    if (!el) return;
    t.current = (t.current + speed) % 1;
    const pt = getPathPoint(el, t.current);
    cx.set(pt.x);
    cy.set(pt.y);
  });

  return (
    <motion.circle
      style={{ cx, cy }}
      r={3}
      fill={color}
      opacity={0.92}
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArchitectureSection() {
  const [mounted, setMounted] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="architecture"
      style={{ position: "relative", padding: "96px 0", overflowX: "hidden" }}
    >
      {/* Subtle radial glow behind centre */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, var(--glow-primary, rgba(55,138,221,0.06)), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: 48, position: "relative", zIndex: 1, padding: "0 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--color-text-tertiary)", fontWeight: 500, marginBottom: 8 }}
        >
          Architecture
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display"
          style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}
        >
          Built for{" "}
          <span className="text-gradient-primary">planet-scale</span> reliability
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ marginTop: 12, color: "var(--color-text-secondary)", maxWidth: 560, margin: "12px auto 0", fontSize: 15, lineHeight: 1.6 }}
        >
          Rust workers at the edge, Go services at the core, RabbitMQ orchestration
          in the middle, and Solana settlement at the base.
        </motion.p>
      </div>

      {/* Scrollable canvas wrapper */}
      <div style={{ overflowX: "auto", overflowY: "visible", padding: "0 24px 24px", position: "relative", zIndex: 1 }}>
        <div
          style={{
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
            minWidth: CANVAS_W,
            margin: "0 auto",
          }}
        >
          {/* Animated grid background */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ duration: 1 }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(var(--color-border-tertiary) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-tertiary) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              borderRadius: 12,
              pointerEvents: "none",
            }}
          />

          {/* Trust boundary: untrusted */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              position: "absolute",
              left: 10,
              top: 16,
              width: 256,
              height: CANVAS_H - 32,
              border: "1.5px dashed var(--color-border-secondary)",
              borderRadius: 12,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -10,
                left: 14,
                background: "var(--color-background-primary)",
                padding: "0 6px",
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-tertiary)",
              }}
            >
              Untrusted public network
            </span>
          </motion.div>

          {/* Trust boundary: trusted */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{
              position: "absolute",
              left: 278,
              top: 16,
              width: CANVAS_W - 298,
              height: CANVAS_H - 32,
              border: "1.5px dashed var(--color-border-secondary)",
              borderRadius: 12,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: -10,
                left: 14,
                background: "var(--color-background-primary)",
                padding: "0 6px",
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--color-text-tertiary)",
              }}
            >
              Trusted backend system
            </span>
          </motion.div>

          {/* Layer columns */}
          {LAYERS.map((layer, i) => {
            const s = LAYER_STYLES[layer.color];
            return (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
                style={{
                  position: "absolute",
                  left: layer.x,
                  top: layer.y,
                  width: layer.w,
                  height: layer.h,
                  background: s.bg,
                  border: `1px solid ${s.border}`,
                  borderRadius: 10,
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: s.labelBg,
                    border: `1px solid ${s.labelBorder}`,
                    color: s.labelText,
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                    padding: "2px 10px",
                    borderRadius: 20,
                  }}
                >
                  {layer.label}
                </span>
              </motion.div>
            );
          })}

          {/* Flow SVG — paths + packets + step badges */}
          <svg
            ref={svgRef}
            style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}
            width={CANVAS_W}
            height={CANVAS_H}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          >
            <defs>
              <marker id="arch-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            {/* Paths */}
            {FLOWS.map((flow, i) => (
              <motion.path
                key={flow.id}
                id={flow.id}
                d={flow.d}
                fill="none"
                stroke={flow.color}
                strokeWidth={1.5}
                markerEnd="url(#arch-arrow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 + i * 0.04, ease: "easeInOut" }}
              />
            ))}

            {/* Protocol labels on key edges */}
            {FLOWS.filter((f) => ["f1","f3","f4","f7","f15","f16","f18"].includes(f.id)).map((flow) => {
              // midpoint label — compute from first and last d coords roughly
              const sl = STEP_LABELS.find((s) => s.step === flow.step);
              if (!sl) return null;
              return (
                <motion.text
                  key={`lbl-${flow.id}`}
                  x={sl.x}
                  y={sl.y - 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-text-tertiary)"
                  fontFamily="var(--font-mono)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 + flow.step * 0.03 }}
                >
                  {flow.protocol}
                </motion.text>
              );
            })}

            {/* Step number badges */}
            {STEP_LABELS.map(({ step, x, y, color }) => (
              <motion.g
                key={`step-${step}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + step * 0.03, duration: 0.3 }}
              >
                <circle cx={x} cy={y} r={8} fill={color.replace("0.9)", "0.12)")} stroke={color.replace("0.9)", "0.4)")} strokeWidth={0.8} />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fontWeight={500}
                  fill={color}
                  fontFamily="var(--font-sans)"
                >
                  {step}
                </text>
              </motion.g>
            ))}

            {/* Animated packets — only rendered client-side after mount */}
            {mounted &&
              FLOWS.map((flow, i) => (
                <AnimatedPacket
                  key={`pkt-${flow.id}`}
                  pathId={flow.id}
                  color={flow.packetColor}
                  speed={0.0008 + (i % 7) * 0.0001}
                  offset={i * 0.17}
                />
              ))}
          </svg>

          {/* Nodes */}
          {NODES.map((node, i) => (
            <ArchNode key={node.id} node={node} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}