import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  onGetStarted: () => void
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="py-20 lg:py-32" aria-labelledby="hero-heading">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Now with GPT-4 Integration
          </Badge>
          
          <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Systematic Reviews
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your research process with AI-powered systematic literature reviews. 
            From question formulation to final export in 30 minutes, not 30 weeks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={onGetStarted} 
              className="text-lg px-8" 
              aria-label="Start your free trial of Searchmatic"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8" 
              aria-label="Watch product demonstration video"
            >
              Watch Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Trusted by researchers at</p>
            <div className="flex items-center gap-8 opacity-60">
              <div className="font-semibold">Harvard</div>
              <div className="font-semibold">Stanford</div>
              <div className="font-semibold">MIT</div>
              <div className="font-semibold">Johns Hopkins</div>
              <div className="font-semibold">Mayo Clinic</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}