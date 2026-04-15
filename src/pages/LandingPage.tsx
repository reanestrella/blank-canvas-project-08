import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import PainSection from "@/components/landing/PainSection";
import SolutionSection from "@/components/landing/SolutionSection";
import AppSection from "@/components/landing/AppSection";
import ScheduleSection from "@/components/landing/ScheduleSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <PainSection />
      <SolutionSection />
      <AppSection />
      <ScheduleSection />
      <BenefitsSection />
      <ComparisonSection />
      <TestimonialsSection />
      <HowItWorksSection />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
