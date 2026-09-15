import { useState, useEffect } from 'react';
import { AnimatedBackground } from '../components/landing/AnimatedBackground';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { BenefitsSection } from '../components/landing/BenefitsSection';
import { DemoSection } from '../components/landing/DemoSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';

interface LandingProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  isTryingDemo?: boolean;
}

export function Landing({ onGetStarted, onTryDemo, isTryingDemo }: LandingProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] relative overflow-hidden">
      <AnimatedBackground />

      <Navbar
        isScrolled={isScrolled}
        onGetStarted={onGetStarted}
        scrollToSection={scrollToSection}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <HeroSection onGetStarted={onGetStarted} />
        <FeaturesSection />
        <HowItWorksSection />
        <BenefitsSection />
        <DemoSection onTryDemo={onTryDemo} isTryingDemo={isTryingDemo} />
        <CTASection onGetStarted={onGetStarted} />
      </main>

      <Footer />
    </div>
  );
}