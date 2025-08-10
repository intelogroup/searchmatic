import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle } from 'lucide-react'

export default function Terms() {
  const navigate = useNavigate()

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
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Terms of Service</h2>
          </div>
          
          <p className="text-gray-600 mb-4">
            These Terms of Service ("Terms") govern your use of AI Chat ("Service") operated by us. 
            By accessing or using our Service, you agree to be bound by these Terms.
          </p>
          
          <p className="text-sm text-gray-500">
            Last updated: January 2024
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
              <p className="text-yellow-700">
                By using AI Chat, you acknowledge that you have read, understood, and agree to be bound by these Terms. 
                If you do not agree to these Terms, please do not use our Service.
              </p>
            </div>
          </div>
        </div>

        {/* Main Terms */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* Acceptance of Terms */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h3>
            <p className="text-gray-600">
              By accessing and using AI Chat, you accept and agree to be bound by the terms and provision 
              of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h3>
            <p className="text-gray-600 mb-4">
              AI Chat is an artificial intelligence-powered conversation platform that allows users to:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Engage in conversations with AI assistants
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Save and manage conversation history
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Customize preferences and settings
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                Access the service across multiple devices
              </li>
            </ul>
          </section>

          {/* User Responsibilities */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">3. User Responsibilities</h3>
            <p className="text-gray-600 mb-4">As a user of our Service, you agree to:</p>
            <ul className="space-y-2 text-gray-600">
              <li>• Provide accurate and truthful information</li>
              <li>• Use the Service only for lawful purposes</li>
              <li>• Not attempt to harm or disrupt the Service</li>
              <li>• Respect the rights and privacy of other users</li>
              <li>• Not share your account credentials with others</li>
              <li>• Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* Prohibited Uses */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">4. Prohibited Uses</h3>
            <p className="text-gray-600 mb-4">You may not use our Service:</p>
            <ul className="space-y-2 text-gray-600">
              <li>• For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>• To violate any international, federal, provincial, or state regulations or laws</li>
              <li>• To transmit, or procure the sending of, any advertising or promotional material</li>
              <li>• To impersonate or attempt to impersonate the company, employees, or other users</li>
              <li>• To upload, post, or transmit any content that infringes on intellectual property rights</li>
            </ul>
          </section>

          {/* Privacy and Data */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">5. Privacy and Data</h3>
            <p className="text-gray-600">
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, and 
              protect your information when you use our Service. By using our Service, you agree to 
              the collection and use of information in accordance with our Privacy Policy.
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">6. Service Availability</h3>
            <p className="text-gray-600">
              We strive to maintain the highest level of service availability. However, we do not 
              guarantee that the Service will be available at all times. We may temporarily suspend 
              the Service for maintenance, updates, or other operational reasons.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">7. Intellectual Property</h3>
            <p className="text-gray-600">
              The Service and its original content, features, and functionality are and will remain 
              the exclusive property of AI Chat and its licensors. The Service is protected by copyright, 
              trademark, and other laws.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">8. Termination</h3>
            <p className="text-gray-600">
              We may terminate or suspend your account and bar access to the Service immediately, 
              without prior notice or liability, under our sole discretion, for any reason whatsoever 
              and without limitation, including but not limited to a breach of the Terms.
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">9. Disclaimer</h3>
            <p className="text-gray-600">
              The information on this Service is provided on an "as is" basis. To the fullest extent 
              permitted by law, we disclaim all representations and warranties relating to this Service 
              and its contents.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">10. Changes to Terms</h3>
            <p className="text-gray-600">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will provide at least 30 days notice prior to any new terms 
              taking effect.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">11. Contact Us</h3>
            <p className="text-gray-600">
              If you have any questions about these Terms of Service, please contact us at 
              legal@aichat.com or through our Help Center.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600">
            By continuing to use AI Chat, you acknowledge that you have read and agree to these Terms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/privacy')}
              variant="outline"
            >
              View Privacy Policy
            </Button>
            <Button
              onClick={() => navigate('/help')}
              variant="outline"
            >
              Have Questions?
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}