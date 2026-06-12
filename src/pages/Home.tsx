import { ArchitectureSection } from "../architecture/ArchitectureSection";
import { DashboardPreview } from "../dashboard-preview/DashboardPreview";
import { FAQ } from "../faq/FAQ";
import { Features } from "../features/Features";
import { CTASection } from "../footer/CTASection";
import { Footer } from "../footer/Footer";
import { Hero } from "../hero/Hero";
import { HowItWorks } from "../how-it-works/HowItWorks";
import { Navbar } from "../navbar/Navbar";
import { NetworkMap } from "../network-map/NetworkMap";
import { Pricing } from "../pricing/Pricing";
import { Security } from "../security/Security";
import { StatsBar } from "../stats/StatsBar";
import { TechStack } from "../tech-stack/TechStack";
import { TokenEconomy } from "../tokenomics/TokenEconomy";


export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground antialiased">
      {/* <Navbar /> */}
      <Hero />
      <StatsBar />
      <NetworkMap />
      <HowItWorks />
      <ArchitectureSection />
      <Features />
      <TokenEconomy />
      <DashboardPreview />
      <Security />
      <TechStack />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}