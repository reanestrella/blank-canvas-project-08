import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import AppSection from "@/components/landing/AppSection";
import ScheduleSection from "@/components/landing/ScheduleSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <HeroSection />
      <AppSection />
      <ScheduleSection />
      <BenefitsSection />
      <ComparisonSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
