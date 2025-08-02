import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, User, Bell, Shield, CreditCard, Zap } from 'lucide-react'

export const Settings: React.FC = () => {
  const navigate = useNavigate()

  const settingSections = [
    {
      id: 'profile',
      title: 'Profile & Account',
      description: 'Manage your personal information and account settings',
      icon: <User className="h-5 w-5" />,
      features: ['Update profile information', 'Change password', 'Account preferences']
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Control how and when you receive notifications',
      icon: <Bell className="h-5 w-5" />,
      features: ['Email notifications', 'Push notifications', 'Research updates']
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage your security settings and data privacy',
      icon: <Shield className="h-5 w-5" />,
      features: ['Two-factor authentication', 'Data export', 'Privacy controls']
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your subscription and billing information',
      icon: <CreditCard className="h-5 w-5" />,
      features: ['Current plan details', 'Usage statistics', 'Payment methods']
    },
    {
      id: 'integrations',
      title: 'Integrations & API',
      description: 'Connect with external services and manage API access',
      icon: <Zap className="h-5 w-5" />,
      features: ['Database connections', 'API keys', 'Third-party integrations']
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application preferences</p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {settingSections.map((section) => (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {section.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Coming Soon</span>
                  <Button variant="ghost" size="sm" disabled>
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 max-w-4xl">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to help you get the most out of Searchmatic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1">
                View Documentation
              </Button>
              <Button variant="outline" className="flex-1">
                Contact Support
              </Button>
              <Button variant="outline" className="flex-1">
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}