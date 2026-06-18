import { motion } from "framer-motion";
import { ArrowRight, Cpu } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate()
  return (
    <section className="relative px-4 sm:px-6 py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, var(--glow-primary), transparent 65%)" }}
        />
        {/* Floating particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent/60"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-4xl text-center"
      >
        <h2 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
          Build monitoring on the world's first{" "}
          <span className="text-gradient-primary">DePIN uptime network</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of teams already running their uptime on a decentralized network of real
          nodes — settled trustlessly on Solana.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button
          onClick={()=>navigate("/docs")}
            size="lg"
            className="h-12 px-6 bg-gradient-to-r from-primary to-secondary border-0 text-base glow-primary hover:opacity-95"
          >
           Docs
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-6 glass border-white/10 text-base"
          onClick={()=>navigate("/signup")}
          >
            <Cpu className="w-4 h-4" />
            Become a node
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
