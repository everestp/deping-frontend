import { useState, useEffect, useRef } from "react";

/* =====================================================
   NAV — grouped, not numbered (FAQ isn't step 7 of Security)
===================================================== */
const NAV_GROUPS = [
  {
    label: "Get Started",
    items: [
      { id: "intro", label: "Introduction" },
      { id: "quickstart", label: "Quick Start" },
      { id: "installation", label: "Installation" },
    ],
  },
  {
    label: "Run a Node",
    items: [
      { id: "configuration", label: "Configuration" },
      { id: "operations", label: "Operations" },
      { id: "security", label: "Security" },
    ],
  },
  {
    label: "Reference",
    items: [{ id: "faq", label: "FAQ" }],
  },
];
const FLAT_NAV = NAV_GROUPS.flatMap((g) => g.items);

/* =====================================================
   SIGNATURE ELEMENT — live stream pulse
   Visualizes the actual challenge/sign/verify protocol
   described in Security, as an ambient sidebar header.
===================================================== */
function StreamPulse() {
  const [stage, setStage] = useState(0);
  const stages = ["SYN", "CHALLENGE", "SIGN", "VERIFY", "STREAM"];

  useEffect(() => {
    const t = setInterval(() => setStage((s) => (s + 1) % stages.length), 1400);
    return () => clearInterval(t);
  }, [stages.length]);

  return (
    <div
      className="glass animate-border-glow"
      style={{
        margin: "0 0.85rem 1.25rem",
        padding: "12px 14px",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span
          className="animate-pulse-dot"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--accent-green)",
            boxShadow: "0 0 8px var(--accent-green)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10.5px",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
          }}
        >
          node.stream
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--accent-green)",
          }}
        >
          live
        </span>
      </div>

      {/* packet rail */}
      <div style={{ position: "relative", height: "18px", marginBottom: "2px" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "1px",
            background: "var(--border-accent)",
            transform: "translateY(-50%)",
          }}
        />
        {stages.map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: `${(i / (stages.length - 1)) * 100}%`,
              transform: "translate(-50%, -50%)",
              width: i === stage ? 8 : 5,
              height: i === stage ? 8 : 5,
              borderRadius: "50%",
              background: i <= stage ? "var(--accent-cyan)" : "var(--border-accent)",
              boxShadow: i === stage ? "0 0 10px var(--accent-cyan)" : "none",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10.5px",
          color: "var(--accent-cyan)",
          letterSpacing: "0.03em",
        }}
      >
        {stages[stage]}
      </div>
    </div>
  );
}

/* =====================================================
   TYPED TERMINAL — for Quick Start
   Real risk: replaces generic numbered steps with a
   session that plays, native to a CLI product's docs.
===================================================== */
function TypedLine({
  prompt,
  text,
  output,
  active,
  onDone,
}: {
  prompt?: string;
  text: string;
  output?: string[];
  active: boolean;
  onDone: () => void;
}) {
  const [shown, setShown] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active) {
      setShown("");
      setShowOutput(false);
      doneRef.current = false;
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(t);
        setTimeout(() => {
          setShowOutput(true);
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(onDone, output ? 900 : 400);
          }
        }, 250);
      }
    }, 28);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div style={{ marginBottom: "0.65rem" }}>
      <div style={{ display: "flex", gap: "8px", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
        <span style={{ color: "var(--accent-green)", flexShrink: 0 }}>{prompt ?? "$"}</span>
        <span style={{ color: "var(--text-primary)" }}>
          {shown}
          {active && shown.length < text.length && (
            <span className="animate-terminal-blink" style={{ color: "var(--accent-cyan)" }}>
              ▍
            </span>
          )}
        </span>
      </div>
      {showOutput &&
        output?.map((line, idx) => (
          <div
            key={idx}
            className="animate-fade-in-up"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-muted)",
              paddingLeft: "20px",
              lineHeight: 1.7,
              animationDelay: `${idx * 60}ms`,
            }}
          >
            {line}
          </div>
        ))}
    </div>
  );
}

function PlayingTerminal() {
  const script: { prompt?: string; text: string; output?: string[] }[] = [
    {
      text: "curl -fsSL https://raw.githubusercontent.com/everestp/deping-cli-daemon/main/install.sh | bash",
      output: ["✓ binary installed to /usr/local/bin/deping"],
    },
    {
      text: "deping setup",
      output: ["🔑 keypair generated", "public key: 8fK2…ndQ9", "stored at ~/.deping/identity.key"],
    },
    {
      text: 'export DEPING_GATEWAY_URL="https://gateway.deping.xyz"',
    },
    {
      text: "deping start",
      output: [
        "INFO  connected to gateway",
        "INFO  gRPC stream established",
        "INFO  waiting for jobs…",
      ],
    },
  ];
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);

  const advance = () => {
    setActive((a) => {
      if (a + 1 >= script.length) {
        setTimeout(() => {
          setActive(0);
          setCycle((c) => c + 1);
        }, 2200);
        return a;
      }
      return a + 1;
    });
  };

  return (
    <div
      className="terminal-bg"
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "1.1rem 1.25rem 1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", gap: "6px", marginBottom: "0.9rem" }}>
        {["var(--accent-red)", "var(--accent-amber)", "var(--accent-green)"].map((c, i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.85 }} />
        ))}
        <span
          style={{
            marginLeft: "8px",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          deping — node session
        </span>
      </div>
      {script.map((line, i) => (
        <TypedLine
          key={`${cycle}-${i}`}
          prompt={line.prompt}
          text={line.text}
          output={line.output}
          active={active === i}
          onDone={advance}
        />
      ))}
    </div>
  );
}

/* =====================================================
   TYPOGRAPHY PRIMITIVES
===================================================== */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--accent-cyan)",
        marginBottom: "0.6rem",
      }}
    >
      {children}
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontSize: "2.1rem",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "0.6rem",
        marginTop: 0,
        fontFamily: "var(--font-display)",
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </h1>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "1.25rem",
        fontWeight: 600,
        color: "var(--text-primary)",
        marginTop: "2.75rem",
        marginBottom: "0.85rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--border-subtle)",
        fontFamily: "var(--font-display)",
      }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        fontSize: "0.95rem",
        fontWeight: 600,
        color: "var(--accent-blue)",
        marginTop: "1.6rem",
        marginBottom: "0.6rem",
        fontFamily: "var(--font-display)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: "1rem", fontSize: "15px" }}>
      {children}
    </p>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "12.5px",
        color: "var(--accent-cyan)",
        background: "rgba(56,189,248,0.08)",
        padding: "2px 6px",
        borderRadius: "4px",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {children}
    </code>
  );
}

/* =====================================================
   CODE BLOCK
===================================================== */
function CodeBlock({ children, lang = "bash" }: { children: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      style={{
        position: "relative",
        marginBottom: "1.25rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 14px",
          background: "rgba(10, 12, 30, 0.6)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{lang}</span>
        <button
          onClick={copy}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            color: copied ? "var(--accent-green)" : "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            padding: "2px 6px",
            borderRadius: "4px",
            transition: "color 0.2s",
          }}
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "1rem 1.25rem",
          background: "rgba(5, 8, 20, 0.92)",
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--accent-cyan)",
          overflowX: "auto",
          lineHeight: 1.7,
        }}
      >
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

/* =====================================================
   CALLOUTS
===================================================== */
function Callout({
  kind,
  children,
}: {
  kind: "note" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    note: { color: "var(--accent-blue)", bg: "rgba(56, 189, 248, 0.07)", label: "Note" },
    warning: { color: "var(--accent-amber)", bg: "rgba(251, 191, 36, 0.07)", label: "Warning" },
    danger: { color: "var(--accent-red)", bg: "rgba(248, 113, 113, 0.07)", label: "Critical" },
  }[kind];
  return (
    <blockquote
      style={{
        margin: "1.25rem 0",
        padding: "1rem 1.25rem",
        borderLeft: `3px solid ${map.color}`,
        background: map.bg,
        borderRadius: "0 var(--radius-md) var(--radius-md) 0",
        color: "var(--text-primary)",
        fontSize: "14px",
        lineHeight: 1.75,
      }}
    >
      <span style={{ color: map.color, fontWeight: 600, marginRight: 8, fontFamily: "var(--font-mono)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {map.label}
      </span>
      {children}
    </blockquote>
  );
}

/* =====================================================
   CONFIG TABLE
===================================================== */
function ConfigTable() {
  const rows = [
    { key: "DEPING_GATEWAY_URL", type: "URL", required: "Yes", desc: "HTTP endpoint of the DePing backend platform." },
    { key: "DEPING_GRPC_ENDPOINT", type: "host:port", required: "Yes", desc: "gRPC ingress address for the persistent task stream." },
    { key: "DEPING_MAX_CONCURRENT_JOBS", type: "integer", required: "No", desc: "Maximum parallel monitoring tasks. Defaults to 10." },
    { key: "DEPING_HEARTBEAT_INTERVAL", type: "seconds", required: "No", desc: "Heartbeat interval. Recommended range: 15–30." },
    { key: "DEPING_CONNECT_TIMEOUT", type: "seconds", required: "No", desc: "Timeout for establishing the initial gRPC connection." },
  ];
  return (
    <div style={{ overflowX: "auto", marginBottom: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
        <thead>
          <tr style={{ background: "rgba(56, 189, 248, 0.06)" }}>
            {["Variable", "Type", "Required", "Description"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  color: "var(--accent-blue)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border-accent)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
              <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-cyan)", borderBottom: "1px solid var(--border-subtle)", whiteSpace: "nowrap" }}>
                {r.key}
              </td>
              <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-green)", borderBottom: "1px solid var(--border-subtle)" }}>
                {r.type}
              </td>
              <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)" }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: r.required === "Yes" ? "rgba(248,113,113,0.12)" : "rgba(52,211,153,0.1)",
                    color: r.required === "Yes" ? "var(--accent-red)" : "var(--accent-green)",
                  }}
                >
                  {r.required}
                </span>
              </td>
              <td style={{ padding: "10px 14px", color: "var(--text-secondary)", borderBottom: "1px solid var(--border-subtle)", lineHeight: 1.6 }}>
                {r.desc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =====================================================
   PAGES
===================================================== */
function IntroPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>DePIN Infrastructure · v1</Eyebrow>
      <H1>DePing CLI Miner</H1>
      <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", marginBottom: "2rem", lineHeight: 1.75, maxWidth: "560px" }}>
        A high-performance decentralized node for distributed uptime monitoring, latency profiling, and internet
        infrastructure observability.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1px", marginBottom: "2.5rem", background: "var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
        {[
          { icon: "🌐", title: "Globally distributed", desc: "Monitoring runs from your own network location." },
          { icon: "🔐", title: "Cryptographic identity", desc: "Ed25519 keypair. The private key never leaves your machine." },
          { icon: "⚡", title: "High performance", desc: "Rust + Tokio, fully async, non-blocking." },
          { icon: "📡", title: "gRPC streaming", desc: "Persistent HTTP/2 task stream, auto-reconnect." },
        ].map((c) => (
          <div key={c.title} style={{ padding: "1.25rem", background: "var(--bg-secondary)" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.6rem" }}>{c.icon}</div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.35rem", fontSize: "13.5px" }}>{c.title}</div>
            <div style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.6 }}>{c.desc}</div>
          </div>
        ))}
      </div>

      <H2>What is DePing?</H2>
      <P>
        DePing turns internet monitoring into decentralized infrastructure. Instead of a handful of centralized
        servers, monitoring workloads are distributed across independent node operators worldwide.
      </P>
      <P>
        Each miner measures from its own geographic and network vantage point — producing distributed uptime and
        latency insight no single datacenter could replicate.
      </P>

      <H2>How it works</H2>
      <P>
        Your node receives jobs over a persistent gRPC stream, executes them (DNS resolution, TCP handshake, TLS
        profiling, TTFB), encodes results as Protobuf, and streams them back — signed, so every result is verifiable.
      </P>

      <H2>Tech stack</H2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1rem" }}>
        {["Rust", "Tokio", "Tonic gRPC", "Reqwest", "Ed25519-Dalek", "Prost", "Tracing", "Protobuf"].map((t) => (
          <span key={t} style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-blue)", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)" }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickStartPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Get Started</Eyebrow>
      <H1>Quick Start</H1>
      <P>Watch the session below, then run the same four commands yourself.</P>

      <PlayingTerminal />

      <Callout kind="note">
        After <InlineCode>deping setup</InlineCode>, your private key is stored locally and never transmitted. Don't
        delete it — losing your keypair means losing your node identity.
      </Callout>
    </div>
  );
}

function InstallationPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Get Started</Eyebrow>
      <H1>Installation</H1>
      <P>DePing CLI ships as a single statically-linked binary. No runtime dependencies.</P>

      <H2>Script install (recommended)</H2>
      <P>Downloads the latest release and places it on your PATH.</P>
      <CodeBlock lang="bash">
        {`curl -fsSL https://raw.githubusercontent.com/everestp/deping-cli-daemon/main/install.sh | bash`}
      </CodeBlock>

      <H2>Manual installation</H2>
      <CodeBlock lang="bash">
        {`# 1. Download from the latest GitHub release\n# https://github.com/everestp/deping-cli-daemon/releases\n\n# 2. Make executable\nchmod +x deping-linux-amd64\n\n# 3. Move to PATH\nsudo mv deping-linux-amd64 /usr/local/bin/deping\n\n# 4. Verify\ndeping --version`}
      </CodeBlock>

      <H2>Build from source</H2>
      <H3>Prerequisites</H3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "1.25rem" }}>
        {["Rust (stable)", "Cargo", "protoc"].map((d) => (
          <span key={d} style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--accent-green)", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            {d}
          </span>
        ))}
      </div>

      <H3>Install protoc</H3>
      <CodeBlock lang="bash">{`# Linux\nsudo apt install protobuf-compiler\n\n# macOS\nbrew install protobuf`}</CodeBlock>

      <H3>Build</H3>
      <CodeBlock lang="bash">
        {`git clone https://github.com/everestp/deping-cli-daemon\ncd deping-cli-daemon\ncargo build --release\n\n# binary at ./target/release/deping`}
      </CodeBlock>

      <Callout kind="note">
        The release profile sets <InlineCode>lto = true</InlineCode>, <InlineCode>codegen-units = 1</InlineCode>, and{" "}
        <InlineCode>strip = true</InlineCode> for a minimal, optimized binary.
      </Callout>
    </div>
  );
}

function ConfigurationPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Run a Node</Eyebrow>
      <H1>Configuration</H1>
      <P>
        DePing CLI is configured entirely through environment variables — your shell, a{" "}
        <InlineCode>.env</InlineCode> file, or a systemd unit.
      </P>

      <H2>Environment variables</H2>
      <ConfigTable />

      <H2>Example .env</H2>
      <CodeBlock lang="bash">
        {`DEPING_GATEWAY_URL=https://gateway.deping.xyz\nDEPING_GRPC_ENDPOINT=grpc.deping.xyz:443\nDEPING_MAX_CONCURRENT_JOBS=10\nDEPING_HEARTBEAT_INTERVAL=20\nDEPING_CONNECT_TIMEOUT=10`}
      </CodeBlock>

      <Callout kind="warning">
        <InlineCode>DEPING_MAX_CONCURRENT_JOBS</InlineCode> defaults to 10. Raising it beyond your network capacity
        can degrade result quality and trigger the scheduler's anti-abuse protections.
      </Callout>
    </div>
  );
}

function OperationsPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Run a Node</Eyebrow>
      <H1>Operations</H1>

      <H2>Start the miner</H2>
      <CodeBlock lang="bash">{`deping start`}</CodeBlock>
      <CodeBlock lang="text">
        {`INFO  connected to gateway\nINFO  gRPC stream established\nINFO  waiting for jobs…`}
      </CodeBlock>

      <H2>Initialize node identity</H2>
      <CodeBlock lang="bash">{`deping setup`}</CodeBlock>
      <P>Run once — generates your Ed25519 keypair, or loads it if one already exists.</P>

      <H2>Run as a systemd service</H2>
      <P>For production, run DePing as a background daemon that starts on boot.</P>

      <H3>1. Create the service file</H3>
      <CodeBlock lang="bash">{`sudo nano /etc/systemd/system/deping.service`}</CodeBlock>

      <H3>2. Paste the unit definition</H3>
      <CodeBlock lang="ini">
        {`[Unit]\nDescription=DePing CLI Miner Node\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nUser=deping\nExecStart=/usr/local/bin/deping start\nRestart=on-failure\nRestartSec=10\nEnvironment="DEPING_GATEWAY_URL=https://gateway.deping.xyz"\nEnvironment="DEPING_GRPC_ENDPOINT=grpc.deping.xyz:443"\n\n[Install]\nWantedBy=multi-user.target`}
      </CodeBlock>

      <H3>3. Enable and start</H3>
      <CodeBlock lang="bash">
        {`sudo systemctl daemon-reload\nsudo systemctl enable deping\nsudo systemctl start deping\nsudo systemctl status deping\nsudo journalctl -u deping -f`}
      </CodeBlock>

      <Callout kind="note">
        Run the miner under a dedicated low-privilege user: <InlineCode>sudo useradd --system --no-create-home deping</InlineCode>.
      </Callout>

      <H2>Stream reconnection</H2>
      <P>
        If the gRPC connection drops, the miner retries automatically with exponential backoff. The systemd{" "}
        <InlineCode>Restart=on-failure</InlineCode> directive adds a second layer of recovery.
      </P>
    </div>
  );
}

function SecurityPage() {
  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Run a Node</Eyebrow>
      <H1>Security</H1>
      <P>DePing has a minimal trust surface. Your private key is the root of all security.</P>

      <Callout kind="danger">
        <strong>Never share your private key.</strong> It never leaves your machine. DePing servers only ever see
        your public key and a signature — never the private key. Anyone who obtains it can impersonate your node.
      </Callout>

      <H2>Cryptographic identity</H2>
      <P>
        Every node owns an Ed25519 keypair. Authentication uses challenge-response: the server sends a random nonce,
        your node signs it with its private key, and the server verifies the signature against your public key.
      </P>
      <CodeBlock lang="text">
        {`server  →  challenge (random nonce)\nminer   →  sign(challenge, private_key)\nserver  →  verify(signature, public_key) → session`}
      </CodeBlock>

      <H2>Transport security</H2>
      <P>All traffic between miner and network runs over TLS-encrypted gRPC (HTTP/2). Plaintext is not supported.</P>

      <H2>Resource protection</H2>
      <P>The miner enforces hard limits on its own behavior to prevent abuse and protect your machine:</P>
      <div style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", overflow: "hidden", marginBottom: "1.25rem" }}>
        {[
          ["Concurrency limit", "Bounded by DEPING_MAX_CONCURRENT_JOBS (default 10)"],
          ["Request timeouts", "Every outbound probe has a timeout — no runaway connections"],
          ["Target isolation", "Scheduler prevents excessive simultaneous probes to one host"],
          ["Backpressure", "Internal job queue prevents the scheduler from being flooded"],
        ].map(([k, v], i) => (
          <div key={k as string} style={{ display: "flex", gap: "1rem", padding: "12px 16px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)", borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}>
            <span style={{ minWidth: "150px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-cyan)", flexShrink: 0 }}>{k}</span>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{v}</span>
          </div>
        ))}
      </div>

      <Callout kind="warning">
        Setting <InlineCode>DEPING_MAX_CONCURRENT_JOBS</InlineCode> too high may overwhelm monitored targets from
        your IP. Keep it proportional to your uplink.
      </Callout>
    </div>
  );
}

function FaqPage() {
  const faqs = [
    { q: "Is this a cryptocurrency miner?", a: "No. DePing performs network measurements (DNS, TCP, TLS, HTTP) and streams telemetry back to the network — no proof-of-work. \"Mining\" here means earning rewards by contributing infrastructure." },
    { q: "How much bandwidth does a node use?", a: "Depends on DEPING_MAX_CONCURRENT_JOBS and assigned task volume. Expected to be modest — small HTTP probes and Protobuf payloads over gRPC.", todo: true },
    { q: "How much CPU does the miner use?", a: "The miner is async I/O via Tokio, so it's network-bound, not CPU-bound. At default concurrency (10), CPU usage is negligible on any modern system." },
    { q: "What happens if my node goes offline?", a: "The miner reconnects automatically with exponential backoff. Under systemd with Restart=on-failure, the process also restarts on crash. Offline time just means no tasks executed and no rewards earned." },
    { q: "Can I run multiple nodes on one machine?", a: "Support for multiple instances with separate keypairs, and how port/resource conflicts are handled, is being clarified.", todo: true },
    { q: "Is my IP shared with monitored targets?", a: "Yes — probes originate from your machine's IP, like any standard monitoring tool. The geographic spread of node IPs is what makes the network valuable." },
    { q: "What if I lose my keypair?", a: "Your keypair is your node identity. There's no recovery — back it up to a secure, offline location immediately after running deping setup." },
    { q: "How are rewards distributed?", a: "The reward engine and settlement mechanism are still being documented. Roadmap includes blockchain settlement and node performance scoring.", todo: true },
  ];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="animate-fade-in-up">
      <Eyebrow>Reference</Eyebrow>
      <H1>FAQ</H1>
      <P>Common questions about running a DePing node.</P>
      <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-subtle)" }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "1rem 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "left",
                color: "var(--text-primary)",
                fontSize: "14.5px",
                fontWeight: 500,
                fontFamily: "var(--font-display)",
                gap: "1rem",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {f.q}
                {f.todo && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9.5px", color: "var(--accent-amber)", background: "rgba(251,191,36,0.1)", padding: "1px 6px", borderRadius: "999px", border: "1px solid rgba(251,191,36,0.25)" }}>
                    pending
                  </span>
                )}
              </span>
              <span
                style={{
                  color: "var(--accent-blue)",
                  fontSize: "18px",
                  flexShrink: 0,
                  transition: "transform 0.2s",
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                +
              </span>
            </button>
            {open === i && (
              <div className="animate-fade-in-up" style={{ paddingBottom: "1.1rem", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.8, maxWidth: "640px" }}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const PAGES: Record<string, React.ReactNode> = {
  intro: <IntroPage />,
  quickstart: <QuickStartPage />,
  installation: <InstallationPage />,
  configuration: <ConfigurationPage />,
  operations: <OperationsPage />,
  security: <SecurityPage />,
  faq: <FaqPage />,
};

/* =====================================================
   SHELL
===================================================== */
export default function Docs() {
  const [active, setActive] = useState("intro");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeIdx = FLAT_NAV.findIndex((n) => n.id === active);

  const go = (id: string) => {
    setActive(id);
    setSidebarOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <header
        className="glass"
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          padding: "0 1.25rem",
          height: "54px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            style={{
              background: "none",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "13px",
              padding: "5px 9px",
              display: "none",
            }}
            className="docs-mobile-menu-btn"
          >
            ☰
          </button>
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "6px",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          >
            📡
          </div>
          <span style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-primary)" }}>DePing</span>
          <span
            style={{
              fontSize: "10.5px",
              color: "var(--accent-green)",
              fontFamily: "var(--font-mono)",
              background: "rgba(52,211,153,0.1)",
              padding: "2px 7px",
              borderRadius: "999px",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            docs
          </span>
        </div>
        <a
          href="https://github.com/everestp/deping-cli-daemon"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          github ↗
        </a>
      </header>

      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        {/* Sidebar */}
        <nav
          style={{
            width: "232px",
            flexShrink: 0,
            borderRight: "1px solid var(--border-subtle)",
            padding: "1.5rem 0 1rem",
            position: "sticky",
            top: "54px",
            height: "calc(100vh - 54px)",
            overflowY: "auto",
            background: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <StreamPulse />

          <div style={{ padding: "0 0.85rem", flex: 1 }}>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    padding: "0 0.5rem",
                    marginBottom: "0.5rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={active === item.id ? "nav-link-active" : ""}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "7px 12px",
                      borderRadius: active === item.id ? "0 6px 6px 0" : "6px",
                      display: "block",
                      fontSize: "13.5px",
                      color: active === item.id ? "var(--accent-blue)" : "var(--text-secondary)",
                      textAlign: "left",
                      fontFamily: "var(--font-display)",
                      transition: "color 0.15s",
                      marginBottom: "1px",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* node status footer */}
          <div style={{ padding: "0.9rem 0.85rem 0", borderTop: "1px solid var(--border-subtle)", marginTop: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)" }} />
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                docs v1 · synced
              </span>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: "2.5rem 2.5rem 3rem", maxWidth: "820px", overflowY: "auto" }}>
          {PAGES[active]}

          {/* Prev / Next */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "3rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-subtle)",
              gap: "1rem",
            }}
          >
            {activeIdx > 0 ? (
              <button
                onClick={() => go(FLAT_NAV[activeIdx - 1].id)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ← {FLAT_NAV[activeIdx - 1].label}
              </button>
            ) : (
              <div />
            )}
            {activeIdx < FLAT_NAV.length - 1 ? (
              <button
                onClick={() => go(FLAT_NAV[activeIdx + 1].id)}
                style={{
                  background: "none",
                  border: "1px solid var(--border-accent)",
                  cursor: "pointer",
                  padding: "10px 18px",
                  borderRadius: "var(--radius-md)",
                  color: "var(--accent-blue)",
                  fontSize: "13px",
                  fontFamily: "var(--font-display)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {FLAT_NAV[activeIdx + 1].label} →
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              top: "54px",
              background: "rgba(0,0,0,0.5)",
              zIndex: 90,
              display: "none",
            }}
            className="docs-mobile-overlay"
          />
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .docs-mobile-menu-btn { display: inline-flex !important; }
          .docs-mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}