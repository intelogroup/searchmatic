import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface PricingSectionProps {
  onGetStarted: () => void
}

const pricingTiers = [
  {
    name: "Researcher",
    price: "Free",
    description: "Perfect for individual researchers and students",
    features: [
      "Up to 2 active projects",
      "500 articles per month",
      "Basic AI assistance",
      "Standard export formats",
      "Community support"
    ],
    cta: "Start Free",
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For research teams and institutions",
    features: [
      "Unlimited projects",
      "5,000 articles per month",
      "Advanced AI features",
      "All export formats",
      "Priority support",
      "Team collaboration"
    ],
    cta: "Start 14-day Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with specific needs",
    features: [
      "Custom article limits",
      "White-label solution",
      "Advanced integrations",
      "Dedicated support",
      "SLA guarantee",
      "Custom training"
    ],
    cta: "Contact Sales",
    popular: false
  }
]

export const PricingSection: React.FC<PricingSectionProps> = ({ onGetStarted }) => {
  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your research needs
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card key={index} className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
              {tier.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                  onClick={onGetStarted}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}