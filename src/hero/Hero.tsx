import { motion } from "framer-motion";
import { ArrowRight, Cpu } from "lucide-react";


import { HeroBackground } from "./HeroBackground";
import { LaptopAnimation } from "./LaptopAnimation";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";


export function Hero() {
  const navigate = useNavigate()
  return (
    <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28 px-4 sm:px-6 overflow-hidden">
      <HeroBackground />
      <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs text-muted-foreground"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            DePIN-powered uptime monitoring · Now on Solana mainnet
          </motion.div>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.02]"
          >
            Decentralized uptime monitoring,{" "}
            <span className="text-gradient-primary">powered by a global network of real nodes</span>
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed"
          >
            Monitor websites from thousands of distributed locations worldwide. Detect outages
            faster than traditional cloud monitoring — settled trustlessly on Solana.
          </motion.p>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary border-0 h-12 px-6 text-base glow-primary hover:opacity-95"
              onClick={()=>navigate("/docs")}
            >
              Docs
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base glass border-white/10 hover:bg-white/5"
              onClick={()=> navigate("/singup")}
            >
              <Cpu className="w-4 h-4" />
              Become a node
            </Button>
          </motion.div>
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="mt-10 flex items-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              2,431 nodes live
            </div>
            <div className="hidden sm:block">87 countries</div>
            <div className="hidden sm:block">12.4M checks / day</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
        >
          <LaptopAnimation />
        </motion.div>
      </div>
    </section>
  );
}
