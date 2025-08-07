import React from 'react'
import { Button } from '@/components/ui/button'
import { useAppNavigation } from '@/hooks/useAppNavigation'
import { Sparkles } from 'lucide-react'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { FooterSection } from '@/components/landing/FooterSection'

export const Landing: React.FC = () => {
  const { goToLogin } = useAppNavigation()

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60 sticky top-0 z-50" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Searchmatic</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm hover:text-primary transition-colors">Reviews</a>
            <Button variant="ghost" onClick={goToLogin}>
              Sign In
            </Button>
            <Button onClick={goToLogin}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main role="main">
        <HeroSection onGetStarted={goToLogin} />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection onGetStarted={goToLogin} />
        <CtaSection onGetStarted={goToLogin} />
      </main>

      <FooterSection />
    </div>
  )
}