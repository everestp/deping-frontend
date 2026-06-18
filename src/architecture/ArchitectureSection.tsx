"use client";

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Node {
  id: string;
  label: string;
  tech: string;
  desc: string;
  logo: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: LayerColor;
  delay?: number;
}

interface Flow {
  id: string;
  d: string;
  color: string;
  packetColor: string;
  duration: number;
  delay: number;
}

interface StepBadge {
  step: number;
  cx: number;
  cy: number;
  color: string;
  fill: string;
}

interface ProtoLabel {
  x: number;
  y: number;
  text: string;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const W = 1260;
const H = 720;

const STYLES: Record<LayerColor, {
  layerBg: string; layerBorder: string;
  labelBg: string; labelBorder: string; labelText: string;
  nodeBg: string; nodeBorder: string;
  titleColor: string; pulse: string;
}> = {
  blue:   { layerBg:"rgba(55,138,221,.05)",   layerBorder:"rgba(55,138,221,.25)",   labelBg:"rgba(55,138,221,.14)",   labelBorder:"rgba(55,138,221,.32)",   labelText:"#378add", nodeBg:"rgba(55,138,221,.08)",   nodeBorder:"rgba(55,138,221,.30)",   titleColor:"#378add", pulse:"#378add" },
  purple: { layerBg:"rgba(127,119,221,.05)",  layerBorder:"rgba(127,119,221,.25)",  labelBg:"rgba(127,119,221,.14)",  labelBorder:"rgba(127,119,221,.32)",  labelText:"#9b94f0", nodeBg:"rgba(127,119,221,.08)",  nodeBorder:"rgba(127,119,221,.30)",  titleColor:"#9b94f0", pulse:"#9b94f0" },
  orange: { layerBg:"rgba(239,159,39,.05)",   layerBorder:"rgba(239,159,39,.25)",   labelBg:"rgba(239,159,39,.14)",   labelBorder:"rgba(239,159,39,.32)",   labelText:"#ef9f27", nodeBg:"rgba(239,159,39,.08)",   nodeBorder:"rgba(239,159,39,.30)",   titleColor:"#ef9f27", pulse:"#ef9f27" },
  green:  { layerBg:"rgba(99,153,34,.05)",    layerBorder:"rgba(99,153,34,.25)",    labelBg:"rgba(99,153,34,.14)",    labelBorder:"rgba(99,153,34,.32)",    labelText:"#639922", nodeBg:"rgba(99,153,34,.08)",    nodeBorder:"rgba(99,153,34,.30)",    titleColor:"#639922", pulse:"#639922" },
  red:    { layerBg:"rgba(226,75,74,.05)",    layerBorder:"rgba(226,75,74,.25)",    labelBg:"rgba(226,75,74,.14)",    labelBorder:"rgba(226,75,74,.32)",    labelText:"#e24b4a", nodeBg:"rgba(226,75,74,.08)",    nodeBorder:"rgba(226,75,74,.30)",    titleColor:"#e24b4a", pulse:"#e24b4a" },
  yellow: { layerBg:"rgba(239,159,39,.04)",   layerBorder:"rgba(239,159,39,.22)",   labelBg:"rgba(239,159,39,.14)",   labelBorder:"rgba(239,159,39,.32)",   labelText:"#ef9f27", nodeBg:"rgba(239,159,39,.08)",   nodeBorder:"rgba(239,159,39,.30)",   titleColor:"#ef9f27", pulse:"#ef9f27" },
};

const LAYERS: Layer[] = [
  { id:"public",  label:"Public network",    color:"blue",   x:16,   y:32,  w:234, h:678 },
  { id:"ingress", label:"Ingress",           color:"purple", x:268,  y:32,  w:174, h:678 },
  { id:"bus",     label:"Event bus",         color:"orange", x:460,  y:32,  w:174, h:678 },
  { id:"compute", label:"Storage & compute", color:"green",  x:652,  y:32,  w:196, h:678 },
  { id:"chain",   label:"Blockchain",        color:"red",    x:866,  y:32,  w:160, h:304 },
  { id:"notif",   label:"Notifications",     color:"yellow", x:866,  y:350, w:382, h:360 },
];

const NODES: Node[] = [
  { id:"target", label:"Target websites",   tech:"HTTPS endpoints",              desc:"External sites monitored for uptime & latency",          logo:"🌐", x:24,   y:66,  w:218, h:92,  color:"blue",   delay:0 },
  { id:"miner",  label:"Rust CLI miner",    tech:"Tokio · gRPC client · HTTPS",  desc:"Distributed edge worker. Polls targets, signs results",   logo:"🦀", x:24,   y:220, w:218, h:96,  color:"blue",   delay:60 },
  { id:"grpc",   label:"Go gRPC core",      tech:"gRPC · streaming",             desc:"Worker coordination & job dispatch",                      logo:"⚡", x:276,  y:66,  w:150, h:88,  color:"purple", delay:120 },
  { id:"rest",   label:"Go REST API",       tech:"Gin · signed payloads",        desc:"Result ingestion from miners",                           logo:"🔌", x:276,  y:284, w:150, h:88,  color:"purple", delay:160 },
  { id:"jq",     label:"job_queue",         tech:"AMQP queue",                   desc:"Monitoring batch dispatch to miners",                     logo:"📬", x:468,  y:66,  w:150, h:80,  color:"orange", delay:200 },
  { id:"rmq",    label:"RabbitMQ cluster",  tech:"AMQP · fanout exchange",       desc:"monitoring_events fanout — 3 consumer queues",           logo:"🐰", x:468,  y:210, w:150, h:96,  color:"orange", delay:240 },
  { id:"tq",     label:"telegram_queue",    tech:"AMQP · dedup · rate-limit",    desc:"Rate-limited alert delivery queue",                      logo:"📤", x:468,  y:440, w:150, h:80,  color:"orange", delay:280 },
  { id:"aq",     label:"analytics_queue",   tech:"AMQP queue",                   desc:"Metrics dashboard feed",                                 logo:"📊", x:468,  y:570, w:150, h:80,  color:"orange", delay:300 },
  { id:"redis",  label:"Redis scheduler",   tech:"ZSET · job scheduling",        desc:"Polls gRPC core with target batches",                    logo:"⚡", x:660,  y:56,  w:180, h:86,  color:"green",  delay:340 },
  { id:"worker", label:"Go worker pool",    tech:"consensus · fraud detection",  desc:"Processes results, triggers rewards",                    logo:"⚙️", x:660,  y:214, w:180, h:90,  color:"green",  delay:380 },
  { id:"pg",     label:"PostgreSQL",        tech:"metrics · uptime · balances",  desc:"Persistent storage for all metrics",                     logo:"🐘", x:660,  y:400, w:180, h:84,  color:"green",  delay:420 },
  { id:"sync",   label:"Solana sync handler",tech:"settlement engine · RPC",     desc:"Triggers on-chain reward txns",                          logo:"🔄", x:660,  y:554, w:180, h:84,  color:"green",  delay:460 },
  { id:"sol",    label:"Solana Devnet",     tech:"PoH · RPC",                    desc:"On-chain settlement layer",                              logo:"◎",  x:874,  y:56,  w:144, h:84,  color:"red",    delay:500 },
  { id:"anchor", label:"Anchor program",    tech:"SPL · reward distribution",    desc:"Distributes miner SPL rewards",                          logo:"⚓", x:874,  y:210, w:144, h:84,  color:"red",    delay:540 },
  { id:"tbot",   label:"Telegram bot svc",  tech:"consumer · dedup · rate-limit",desc:"DOWN alerts, latency spikes, real-time delivery",        logo:"🤖", x:874,  y:380, w:152, h:96,  color:"yellow", delay:580 },
  { id:"tapi",   label:"Telegram Bot API",  tech:"sendMessage endpoint",         desc:"Real-time alert delivery to operators",                   logo:"✈️", x:1056, y:478, w:160, h:84,  color:"yellow", delay:620 },
];

const FLOWS: Flow[] = [
  { id:"f1",  d:"M750,99 C700,99 620,99 618,106",                                            color:"rgba(99,153,34,.5)",   packetColor:"rgba(99,153,34,.95)",   duration:1.4, delay:0   },
  { id:"f2",  d:"M468,106 C440,106 432,110 426,110",                                         color:"rgba(127,119,221,.5)", packetColor:"rgba(127,119,221,.95)", duration:1.8, delay:0.3 },
  { id:"f3",  d:"M276,110 C230,110 200,200 180,240 C164,268 144,262 133,262",                color:"rgba(55,138,221,.5)",  packetColor:"rgba(55,138,221,.95)",  duration:2.0, delay:0.6 },
  { id:"f4",  d:"M133,260 C90,240 80,160 80,158 C80,140 100,130 133,120",                   color:"rgba(55,138,221,.4)",  packetColor:"rgba(55,138,221,.8)",   duration:2.5, delay:0.1 },
  { id:"f5",  d:"M242,310 C258,310 266,324 276,330",                                         color:"rgba(127,119,221,.55)",packetColor:"rgba(127,119,221,.95)", duration:1.6, delay:0.4 },
  { id:"f6",  d:"M426,328 C444,328 454,260 468,257",                                         color:"rgba(239,159,39,.55)", packetColor:"rgba(239,159,39,.95)",  duration:1.5, delay:0.2 },
  { id:"f7",  d:"M618,257 C636,257 644,258 660,260",                                         color:"rgba(99,153,34,.55)",  packetColor:"rgba(99,153,34,.95)",   duration:1.3, delay:0.5 },
  { id:"f8",  d:"M543,306 L543,440",                                                          color:"rgba(239,159,39,.5)",  packetColor:"rgba(239,159,39,.95)",  duration:2.0, delay:0.7 },
  { id:"f9",  d:"M549,306 L549,570",                                                          color:"rgba(239,159,39,.4)",  packetColor:"rgba(239,159,39,.8)",   duration:2.2, delay:1.0 },
  { id:"f10", d:"M750,304 L750,400",                                                          color:"rgba(99,153,34,.55)",  packetColor:"rgba(99,153,34,.95)",   duration:1.7, delay:0.3 },
  { id:"f11", d:"M755,304 C700,400 680,500 660,596",                                         color:"rgba(99,153,34,.45)",  packetColor:"rgba(99,153,34,.85)",   duration:2.4, delay:0.8 },
  { id:"f12", d:"M840,596 C860,560 862,200 866,140 C868,116 870,100 874,98",                color:"rgba(226,75,74,.55)",  packetColor:"rgba(226,75,74,.95)",   duration:2.2, delay:0.2 },
  { id:"f13", d:"M946,140 L946,210",                                                          color:"rgba(226,75,74,.55)",  packetColor:"rgba(226,75,74,.95)",   duration:1.5, delay:0.6 },
  { id:"f14", d:"M618,480 C700,480 820,440 874,428",                                         color:"rgba(239,159,39,.55)", packetColor:"rgba(239,159,39,.95)",  duration:1.8, delay:0.4 },
  { id:"f15", d:"M1026,428 C1048,450 1060,466 1056,520",                                    color:"rgba(239,159,39,.55)", packetColor:"rgba(239,159,39,.95)",  duration:1.6, delay:0.9 },
];

const STEP_BADGES: StepBadge[] = [
  { step:1,  cx:688, cy:86,  color:"rgba(99,153,34,.9)",   fill:"rgba(99,153,34,.15)"   },
  { step:2,  cx:445, cy:97,  color:"rgba(127,119,221,.9)", fill:"rgba(127,119,221,.15)" },
  { step:3,  cx:200, cy:200, color:"rgba(55,138,221,.9)",  fill:"rgba(55,138,221,.15)"  },
  { step:4,  cx:72,  cy:190, color:"rgba(55,138,221,.9)",  fill:"rgba(55,138,221,.15)"  },
  { step:5,  cx:256, cy:298, color:"rgba(127,119,221,.9)", fill:"rgba(127,119,221,.15)" },
  { step:6,  cx:448, cy:295, color:"rgba(239,159,39,.9)",  fill:"rgba(239,159,39,.15)"  },
  { step:7,  cx:636, cy:248, color:"rgba(99,153,34,.9)",   fill:"rgba(99,153,34,.15)"   },
  { step:8,  cx:530, cy:370, color:"rgba(239,159,39,.9)",  fill:"rgba(239,159,39,.15)"  },
  { step:9,  cx:730, cy:355, color:"rgba(99,153,34,.9)",   fill:"rgba(99,153,34,.15)"   },
  { step:10, cx:700, cy:450, color:"rgba(99,153,34,.9)",   fill:"rgba(99,153,34,.15)"   },
  { step:11, cx:858, cy:360, color:"rgba(226,75,74,.9)",   fill:"rgba(226,75,74,.15)"   },
  { step:12, cx:930, cy:178, color:"rgba(226,75,74,.9)",   fill:"rgba(226,75,74,.15)"   },
  { step:13, cx:760, cy:466, color:"rgba(239,159,39,.9)",  fill:"rgba(239,159,39,.15)"  },
  { step:14, cx:1046,cy:460, color:"rgba(239,159,39,.9)",  fill:"rgba(239,159,39,.15)"  },
];

const PROTO_LABELS: ProtoLabel[] = [
  { x:690,  y:78,  text:"ZSET",    color:"rgba(99,153,34,.7)"   },
  { x:445,  y:89,  text:"AMQP",   color:"rgba(127,119,221,.7)" },
  { x:226,  y:193, text:"gRPC",   color:"rgba(55,138,221,.7)"  },
  { x:66,   y:182, text:"HTTPS",  color:"rgba(55,138,221,.7)"  },
  { x:862,  y:352, text:"RPC",    color:"rgba(226,75,74,.7)"   },
  { x:932,  y:170, text:"SPL",    color:"rgba(226,75,74,.7)"   },
  { x:1050, y:452, text:"Bot API",color:"rgba(239,159,39,.7)"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position:"absolute", top:8, right:8, width:7, height:7 }}>
      <span style={{ position:"absolute", width:7, height:7, borderRadius:"50%", background:color }} />
      <span style={{
        position:"absolute", width:7, height:7, borderRadius:"50%",
        border:`1.5px solid ${color}`,
        animation:"arch-pulse 2s ease-out infinite",
      }} />
    </span>
  );
}

interface ArchNodeProps { node: Node }

function ArchNode({ node }: ArchNodeProps) {
  const s = STYLES[node.color];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), node.delay ?? 0);
    return () => clearTimeout(t);
  }, [node.delay]);

  return (
    <div
      style={{
        position:"absolute",
        left:node.x, top:node.y, width:node.w, height:node.h,
        background:s.nodeBg,
        border:`1px solid ${s.nodeBorder}`,
        borderRadius:8,
        padding:"9px 11px 8px",
        backdropFilter:"blur(4px)",
        cursor:"default",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(6px) scale(0.96)",
        transition:"opacity .35s ease, transform .35s ease",
        zIndex:10,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.025)";
        (e.currentTarget as HTMLDivElement).style.zIndex = "50";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLDivElement).style.zIndex = "10";
      }}
    >
      <PulseDot color={s.pulse} />
      <div style={{ fontSize:11.5, fontWeight:600, color:s.titleColor, lineHeight:1.2, paddingRight:14 }}>
        {node.label}
      </div>
      <div style={{ fontSize:9.5, fontFamily:"var(--font-mono, monospace)", marginTop:3, opacity:.7 }}>
        {node.tech}
      </div>
      <div style={{ fontSize:9.5, marginTop:4, lineHeight:1.4, opacity:.8 }}>
        {node.desc}
      </div>
      <span style={{ position:"absolute", bottom:6, right:8, fontSize:13, opacity:.5 }}>
        {node.logo}
      </span>
    </div>
  );
}

// ─── Animated packet along an SVG path ───────────────────────────────────────

interface PacketProps {
  pathId: string;
  color: string;
  duration: number;
  delay: number;
}

function AnimatedPacket({ pathId, color, duration, delay }: PacketProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    const animate = (ts: number) => {
      if (!mounted) return;
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current - delay * 1000) / (duration * 1000);
      if (elapsed >= 0) {
        const t = elapsed % 1;
        const path = document.getElementById(pathId) as SVGPathElement | null;
        const circle = circleRef.current;
        if (path && circle) {
          const len = path.getTotalLength();
          const pt = path.getPointAtLength(t * len);
          circle.setAttribute("cx", String(pt.x));
          circle.setAttribute("cy", String(pt.y));
          circle.setAttribute("opacity", "0.92");
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [pathId, duration, delay]);

  return <circle ref={circleRef} r={3.5} fill={color} opacity={0} />;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ArchitectureSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section
      id="architecture"
      style={{ position:"relative", padding:"96px 0", overflowX:"hidden" }}
    >
      {/* Keyframes injected once */}
      <style>{`
        @keyframes arch-pulse {
          0%   { transform: scale(1); opacity: .8; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>

      {/* Radial glow */}
      <div aria-hidden style={{
        position:"absolute", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 60% 50% at 50% 50%, rgba(55,138,221,.05), transparent 70%)",
      }} />

      {/* Heading */}
      <div style={{ textAlign:"center", marginBottom:48, position:"relative", zIndex:1, padding:"0 24px" }}>
        <p style={{ fontSize:11, textTransform:"uppercase", letterSpacing:".18em", opacity:.5, fontWeight:500, marginBottom:8 }}>
          Architecture
        </p>
        <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:700, letterSpacing:"-.02em", lineHeight:1.1, margin:0 }}>
          Built for{" "}
          <span style={{ background:"linear-gradient(135deg,#378add,#9b94f0)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            planet-scale
          </span>{" "}
          reliability
        </h2>
        <p style={{ marginTop:12, opacity:.6, maxWidth:560, margin:"12px auto 0", fontSize:15, lineHeight:1.6 }}>
          Rust workers at the edge, Go services at the core, RabbitMQ orchestration in the middle,
          and Solana settlement at the base.
        </p>
      </div>

      {/* Scrollable canvas */}
      <div style={{ overflowX:"auto", overflowY:"visible", padding:"0 24px 24px", position:"relative", zIndex:1 }}>
        <div style={{ position:"relative", width:W, height:H, minWidth:W, margin:"0 auto" }}>

          {/* Grid background */}
          <div aria-hidden style={{
            position:"absolute", inset:0, borderRadius:12, pointerEvents:"none", opacity:.35,
            backgroundImage:"linear-gradient(rgba(120,120,120,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,120,120,.12) 1px,transparent 1px)",
            backgroundSize:"30px 30px",
          }} />

          {/* Trust boundaries */}
          {[
            { left:8,   top:14, width:250, height:694, label:"Untrusted public network" },
            { left:268, top:14, width:984, height:694, label:"Trusted backend system" },
          ].map(b => (
            <div key={b.label} style={{
              position:"absolute", left:b.left, top:b.top, width:b.width, height:b.height,
              borderRadius:12, border:"1.5px dashed rgba(150,150,150,.18)", pointerEvents:"none",
            }}>
              <span style={{
                position:"absolute", top:-9, left:14,
                fontSize:9, fontWeight:500, textTransform:"uppercase",
                letterSpacing:".08em", color:"rgba(130,130,130,.6)",
                padding:"0 6px",
              }}>
                {b.label}
              </span>
            </div>
          ))}

          {/* Layer columns */}
          {LAYERS.map(layer => {
            const s = STYLES[layer.color];
            return (
              <div key={layer.id} style={{
                position:"absolute", left:layer.x, top:layer.y, width:layer.w, height:layer.h,
                background:s.layerBg, border:`1px solid ${s.layerBorder}`, borderRadius:10, pointerEvents:"none",
              }}>
                <span style={{
                  position:"absolute", top:-13, left:"50%", transform:"translateX(-50%)",
                  background:s.labelBg, border:`1px solid ${s.labelBorder}`, color:s.labelText,
                  fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:".1em",
                  whiteSpace:"nowrap", padding:"2px 10px", borderRadius:20,
                }}>
                  {layer.label}
                </span>
              </div>
            );
          })}

          {/* SVG — paths + packets + badges + labels */}
          <svg
            style={{ position:"absolute", inset:0, overflow:"visible", pointerEvents:"none" }}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
          >
            <defs>
              <marker id="arch-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>

            {/* Flow paths */}
            {FLOWS.map(f => (
              <path
                key={f.id}
                id={f.id}
                d={f.d}
                fill="none"
                stroke={f.color}
                strokeWidth={1.5}
                strokeDasharray="6 5"
                markerEnd="url(#arch-arr)"
                style={{
                  animation:`arch-dash ${f.duration}s linear infinite ${f.delay}s`,
                }}
              />
            ))}

            {/* Animated packets — client only */}
            {mounted && FLOWS.map(f => (
              <AnimatedPacket
                key={`pkt-${f.id}`}
                pathId={f.id}
                color={f.packetColor}
                duration={f.duration}
                delay={f.delay}
              />
            ))}

            {/* Step badges */}
            {STEP_BADGES.map(b => (
              <g key={`step-${b.step}`}>
                <circle cx={b.cx} cy={b.cy} r={9} fill={b.fill} stroke={b.color.replace(".9)",",.4)")} strokeWidth={0.8} />
                <text
                  x={b.cx} y={b.cy}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fontWeight={500} fill={b.color}
                  fontFamily="var(--font-sans, sans-serif)"
                >
                  {b.step}
                </text>
              </g>
            ))}

            {/* Protocol labels */}
            {PROTO_LABELS.map(p => (
              <text
                key={`proto-${p.text}`}
                x={p.x} y={p.y}
                textAnchor="middle"
                fontSize={8}
                fill={p.color}
                fontFamily="var(--font-mono, monospace)"
              >
                {p.text}
              </text>
            ))}
          </svg>

          {/* Dash animation keyframes */}
          <style>{`@keyframes arch-dash { to { stroke-dashoffset: -30; } }`}</style>

          {/* Nodes */}
          {NODES.map(node => (
            <ArchNode key={node.id} node={node} />
          ))}
        </div>
      </div>
    </section>
  );
}