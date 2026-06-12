import { useEffect, useState } from "react";
import { terminalSteps } from "../data/terminal";

export function Terminal() {
  const [stepIdx, setStepIdx] = useState(0);

  const [typedCmd, setTypedCmd] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);

  const [phase, setPhase] = useState<"typing" | "streaming" | "pause">(
    "typing"
  );

  const step = terminalSteps[stepIdx];

  const getTime = () => new Date().toISOString();

  const reset = () => {
    setTypedCmd("");
    setCharIdx(0);
    setVisibleLines([]);
    setLineIdx(0);
    setStepIdx((i) => (i + 1) % terminalSteps.length);
    setPhase("typing");
  };

  /**
   * ⌨️ COMMAND TYPING (SLOW REAL TERMINAL FEEL)
   */
  useEffect(() => {
    if (phase !== "typing") return;
    if (!step) return;

    // 🔥 slower typing speed = realistic CLI feel
    const baseDelay = step.command.includes("start") ? 110 : 90;

    if (charIdx < step.command.length) {
      const t = setTimeout(() => {
        setTypedCmd(step.command.slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, baseDelay + Math.random() * 40);

      return () => clearTimeout(t);
    }

    // pause AFTER command finishes (important realism)
    const t = setTimeout(() => setPhase("streaming"), 600);
    return () => clearTimeout(t);
  }, [charIdx, phase, step]);

  /**
   * 📡 STREAM LOG OUTPUT (READABLE SPEED)
   */
  useEffect(() => {
    if (phase !== "streaming") return;
    if (!step) return;

    if (lineIdx < step.output.length) {
      const t = setTimeout(() => {
        const line = step.output[lineIdx];

        // real timestamp injection
        const timeStampedLine = `${getTime()} ${line}`;

        setVisibleLines((prev) => [...prev, timeStampedLine]);
        setLineIdx((i) => i + 1);
      }, 900 + Math.random() * 700); // 🔥 SLOW like real system logs

      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setPhase("pause"), 1500);
    return () => clearTimeout(t);
  }, [lineIdx, phase, step]);

  /**
   * 🔁 LOOP CONTROL
   */
  useEffect(() => {
    if (phase !== "pause") return;

    const t = setTimeout(() => reset(), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="font-mono text-[12.5px] leading-relaxed space-y-1 text-[#c9d1d9]">

      {/* ROOT SHELL */}
      <div>
        <span style={{ color: "#79c0ff" }}>root@root</span>
        <span style={{ color: "#8b949e" }}>:</span>
     
        <span>{typedCmd}</span>

        {phase === "typing" && (
          <span style={{ color: "#8b949e" }}>▊</span>
        )}
      </div>

      {/* OUTPUT STREAM */}
      {visibleLines.map((line, i) => (
        <div key={i} className="pl-3" style={{ color: "#8b949e" }}>
          {line}
        </div>
      ))}
    </div>
  );
}