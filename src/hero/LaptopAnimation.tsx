import { motion } from "framer-motion";
import { Terminal } from "./Terminal";

export function LaptopAnimation() {
  return (
    <div
      className="relative w-full max-w-[580px] mx-auto"
      style={{ perspective: "1800px" }}
    >
      <motion.div
        initial={{ rotateX: 85, scale: 0.92, opacity: 0 }}
        animate={{ rotateX: 0, scale: 1, opacity: 1 }}
        transition={{
          duration: 1.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative"
      >
        {/* SCREEN */}
        <motion.div
          initial={{ rotateX: -110, y: 60, opacity: 0 }}
          animate={{ rotateX: -10, y: 0, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 1.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            transformOrigin: "bottom center",
            transformStyle: "preserve-3d",
          }}
          className="relative aspect-[16/10] rounded-t-2xl border border-black/20 shadow-2xl"
        >
          {/* SCREEN BODY */}
          <div className="absolute inset-2 rounded-lg overflow-hidden bg-[#0b0f14] border border-black/30">

            {/* TOP BAR (REAL MAC STYLE) */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-black/40">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />

              <div
                className="flex-1 text-center text-[11px] font-mono"
                style={{ color: "#8b949e" }}
              >
                deping@worker-node: ~
              </div>
            </div>

            {/* TERMINAL AREA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="p-4 h-[calc(100%-32px)] font-mono text-[13px]"
              style={{ color: "#c9d1d9" }}
            >
              <Terminal />
            </motion.div>
          </div>

          {/* REALISTIC SCREEN REFLECTION */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 pointer-events-none rounded-t-2xl" />
        </motion.div>

        {/* BASE (ALUMINUM MACBOOK FEEL) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1.2 }}
          className="relative h-5 -mt-px rounded-b-2xl border-x border-b border-black/20 bg-[#d1d5db] dark:bg-[#111827]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-black/30 rounded-b-md" />
        </motion.div>

        {/* FLOOR SHADOW */}
        <div className="h-2 mx-[-6%] bg-black/30 blur-2xl rounded-full" />
      </motion.div>
    </div>
  );
}