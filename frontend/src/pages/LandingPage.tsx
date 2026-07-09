import { BaseLayout } from "@/layouts/BaseLayout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTASection } from "@/components/landing/CTASection";

const LandingPage = () => {
  return (
    <BaseLayout>
      <Hero />
      <Features />
      <HowItWorks />
      <CTASection />
    </BaseLayout>
  );
};

export default LandingPage;
