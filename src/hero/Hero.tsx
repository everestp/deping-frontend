
import { motion } from "framer-motion";
import { ArrowRight, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { HeroBackground } from "./HeroBackground";
import { LaptopAnimation } from "./LaptopAnimation";
import { Button } from "../ui/button";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden px-4 pt-36 pb-20 sm:px-6 sm:pt-44 sm:pb-28">
      <HeroBackground />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.12,
            },
          },
        }}
        className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-8"
      >
        <div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            DePIN-powered uptime monitoring · Now on Solana mainnet
          </motion.div>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            className="mt-5 font-display text-4xl leading-[1.02] font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            Decentralized uptime monitoring,{" "}
            <span className="text-gradient-primary">
              powered by a global network of real nodes
            </span>
          </motion.h1>

          <motion.p
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Monitor websites from thousands of distributed locations
            worldwide. Detect outages faster than traditional cloud
            monitoring — settled trustlessly on Solana.
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0 },
            }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              size="lg"
              className="h-12 border-0 bg-gradient-to-r from-primary to-secondary px-6 text-base glow-primary hover:opacity-95"
              onClick={() => navigate("/docs")}
            >
              Docs
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="glass h-12 border-white/10 px-6 text-base hover:bg-white/5"
              onClick={() => navigate("/signup")}
            >
              <Cpu className="h-4 w-4" />
              Become a node
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
        >
          <LaptopAnimation />
        </motion.div>
      </motion.div>
    </section>
  );
}
