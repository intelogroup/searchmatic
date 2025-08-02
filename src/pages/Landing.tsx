import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  CheckCircle2, 
  Download, 
  Filter, 
  Lightbulb,
  Search,
  Shield,
  Sparkles
} from 'lucide-react'

export const Landing: React.FC = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Research Assistant",
      description: "Get intelligent guidance through every step of your systematic review with GPT-4 integration."
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Multi-Database Search",
      description: "Search PubMed, Scopus, Web of Science, and more from a single, unified interface."
    },
    {
      icon: <Filter className="h-6 w-6" />,
      title: "Smart Deduplication",
      description: "Automatically identify and remove duplicate articles using advanced similarity algorithms."
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Protocol Management",
      description: "Create, version, and manage PICO/SPIDER research protocols with built-in templates."
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Flexible Export",
      description: "Export your results in multiple formats: CSV, Excel, RIS, BibTeX, and more."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & Compliant",
      description: "Bank-level security with SOC 2 compliance and GDPR-ready data handling."
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Research Director, Johns Hopkins",
      content: "Searchmatic cut our systematic review time from 6 months to 6 weeks. The AI assistance is remarkably accurate.",
      avatar: "SC"
    },
    {
      name: "Prof. Michael Rodriguez",
      role: "Meta-Analysis Specialist, Stanford",
      content: "The deduplication feature alone saved us hundreds of hours. This is the future of evidence synthesis.",
      avatar: "MR"
    },
    {
      name: "Dr. Emma Thompson",
      role: "Clinical Researcher, Mayo Clinic",
      content: "Finally, a tool that understands the complexity of systematic reviews. Intuitive and powerful.",
      avatar: "ET"
    }
  ]

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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Searchmatic</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm hover:text-primary transition-colors">Reviews</a>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Now with GPT-4 Integration
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Systematic Reviews
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your research process with AI-powered systematic literature reviews. 
              From question formulation to final export in 30 minutes, not 30 weeks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => navigate('/login')} className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
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

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for world-class research
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform guides you through every step of the systematic review process
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From research question to publication in 4 steps
            </h2>
            <p className="text-xl text-muted-foreground">
              Our AI-guided workflow makes systematic reviews accessible to everyone
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Define & Scope",
                description: "AI helps refine your research question and create PICO/SPIDER protocols",
                icon: <Lightbulb className="h-6 w-6" />
              },
              {
                step: "2", 
                title: "Search & Collect",
                description: "Multi-database search with real-time result counting and query optimization",
                icon: <Search className="h-6 w-6" />
              },
              {
                step: "3",
                title: "Screen & Extract", 
                description: "Smart deduplication and AI-assisted data extraction with validation",
                icon: <Filter className="h-6 w-6" />
              },
              {
                step: "4",
                title: "Export & Publish",
                description: "Generate publication-ready outputs in multiple formats",
                icon: <Download className="h-6 w-6" />
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by researchers worldwide
            </h2>
            <p className="text-xl text-muted-foreground">
              See how Searchmatic is transforming systematic reviews
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
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
                    onClick={() => navigate('/login')}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to revolutionize your research?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of researchers who have accelerated their systematic reviews with Searchmatic
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">Searchmatic</span>
              </div>
              <p className="text-muted-foreground">
                Making systematic literature reviews accessible to researchers worldwide.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Searchmatic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}