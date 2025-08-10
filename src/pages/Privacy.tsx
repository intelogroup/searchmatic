import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()

  const principles = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Data Protection",
      description: "We use industry-standard encryption to protect your data both in transit and at rest."
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Transparency",
      description: "We're clear about what data we collect and how we use it. No hidden practices."
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "User Control",
      description: "You have full control over your data and can request deletion at any time."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Minimal Collection",
      description: "We only collect data that's necessary to provide and improve our service."
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
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Your Privacy Matters</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            At AI Chat, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            and protect your information when you use our service.
          </p>
          
          <p className="text-sm text-gray-500">
            Last updated: January 2024
          </p>
        </div>

        {/* Privacy Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {principles.map((principle, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {principle.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{principle.title}</h3>
              </div>
              <p className="text-gray-600">{principle.description}</p>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* Information We Collect */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Information We Collect</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                <p className="text-gray-600">
                  When you create an account, we collect your email address, name, and password. 
                  This information is necessary to provide you with access to our service.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Conversation Data</h4>
                <p className="text-gray-600">
                  We store your chat conversations to provide continuity across sessions. 
                  This data is encrypted and only accessible to you.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Usage Information</h4>
                <p className="text-gray-600">
                  We collect basic usage statistics like login frequency and feature usage 
                  to improve our service. This data is aggregated and anonymous.
                </p>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                To provide and maintain our AI chat service
              </li>
              <li className="flex items-start gap-2">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                To personalize your experience and improve our AI responses
              </li>
              <li className="flex items-start gap-2">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                To communicate with you about service updates and support
              </li>
              <li className="flex items-start gap-2">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                To analyze usage patterns and improve our service
              </li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Sharing</h3>
            <p className="text-gray-600 mb-4">
              We do not sell, trade, or rent your personal information to third parties. 
              We may share your information only in the following limited circumstances:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• With your explicit consent</li>
              <li>• To comply with legal obligations</li>
              <li>• To protect our rights and prevent fraud</li>
              <li>• With service providers who help us operate our platform (under strict confidentiality agreements)</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Data Security</h3>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect your data, including:
            </p>
            <ul className="mt-4 space-y-2 text-gray-600">
              <li>• End-to-end encryption of sensitive data</li>
              <li>• Regular security audits and updates</li>
              <li>• Access controls and authentication</li>
              <li>• Secure data storage and transmission</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Rights</h3>
            <p className="text-gray-600 mb-4">You have the following rights regarding your personal data:</p>
            <ul className="space-y-2 text-gray-600">
              <li>• Access: Request a copy of your data</li>
              <li>• Correction: Request corrections to inaccurate data</li>
              <li>• Deletion: Request deletion of your data</li>
              <li>• Portability: Request your data in a portable format</li>
              <li>• Objection: Object to certain processing activities</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-gray-600">
              If you have questions about this Privacy Policy or how we handle your data, 
              please contact us at privacy@aichat.com or through our Help Center.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate('/help')}
            variant="outline"
          >
            Have Questions? Visit Help Center
          </Button>
        </div>
      </div>
    </div>
  )
}