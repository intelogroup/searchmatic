import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  MessageSquare, 
  Shield, 
  Zap, 
  Users, 
  Heart,
  Lightbulb,
  Target,
  Globe
} from 'lucide-react'

export default function About() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Smart Conversations",
      description: "Engage in natural, intelligent conversations with our AI assistant that understands context and provides helpful responses."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Privacy First",
      description: "Your conversations are encrypted and secure. We prioritize your privacy and never share your data with third parties."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Experience instant responses and seamless performance with our optimized AI infrastructure."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "User Focused",
      description: "Built with user experience in mind, featuring an intuitive interface and customizable settings."
    }
  ]

  const values = [
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Innovation",
      description: "We continuously push the boundaries of AI technology to provide cutting-edge solutions."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Empathy",
      description: "We design with empathy, understanding the real needs and challenges of our users."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Simplicity",
      description: "We believe in making powerful AI accessible through simple, intuitive interfaces."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Accessibility",
      description: "We're committed to making AI available to everyone, regardless of technical background."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">About AI Chat</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <MessageSquare className="h-8 w-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Making AI Conversations Simple
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI Chat is a modern, user-friendly platform that brings the power of artificial intelligence 
            to everyday conversations. Our mission is to make AI accessible, secure, and helpful for everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 mb-4">
            We believe that artificial intelligence should enhance human capability, not replace it. 
            Our goal is to create tools that help people communicate more effectively, learn more efficiently, 
            and solve problems more creatively.
          </p>
          <p className="text-gray-600">
            By focusing on user experience, privacy, and accessibility, we're building a platform where 
            anyone can harness the power of AI to improve their daily life and work.
          </p>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                  <div className="text-blue-600">
                    {value.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">By the Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">1M+</div>
              <div className="text-gray-600">Conversations Started</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Built with Modern Technology</h2>
          <p className="text-gray-600 mb-6">
            Our platform is built using cutting-edge web technologies to ensure the best possible 
            user experience across all devices and platforms.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">React</div>
              <div className="text-sm text-gray-500">Frontend</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">TypeScript</div>
              <div className="text-sm text-gray-500">Type Safety</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Supabase</div>
              <div className="text-sm text-gray-500">Backend</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">AI Models</div>
              <div className="text-sm text-gray-500">Intelligence</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Join thousands of users who are already having meaningful conversations with AI.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/chat')}
              size="lg"
            >
              Start Chatting
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/help')}
              size="lg"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}