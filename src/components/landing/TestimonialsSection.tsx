import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

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

export const TestimonialsSection: React.FC = () => {
  return (
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
  )
}