import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Search, 
  MessageSquare, 
  Settings, 
  User, 
  Shield, 
  ChevronDown, 
  ChevronUp,
  Mail,
  FileText
} from 'lucide-react'

export default function Help() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "How do I start a new conversation?",
      answer: "You can start a new conversation by clicking the 'New Chat' button in the sidebar or on the dashboard. Each conversation is saved automatically and can be accessed later."
    },
    {
      question: "Can I customize the AI responses?",
      answer: "Currently, the AI responses are generated automatically. However, you can influence the conversation by asking specific questions or providing more context in your messages."
    },
    {
      question: "How do I change my theme settings?",
      answer: "Go to Settings > Appearance and choose between Light, Dark, or System theme. The system theme will automatically match your device's preference."
    },
    {
      question: "Is my conversation data secure?",
      answer: "Yes, all conversations are encrypted and stored securely. Only you have access to your conversations, and we never share your data with third parties."
    },
    {
      question: "How do I delete a conversation?",
      answer: "In the chat interface, you can manage conversations from the sidebar. Right-click on any conversation to see deletion options. Note: This feature is coming soon in the full version."
    },
    {
      question: "Can I export my conversations?",
      answer: "Yes, you can export your conversations in various formats. This feature is available in the Conversations management page."
    },
    {
      question: "What languages are supported?",
      answer: "Currently, we support English, Spanish, French, and German. You can change your language preference in Settings > Language."
    },
    {
      question: "How do I update my profile information?",
      answer: "Visit your Profile page to update your name, email, and other personal information. Profile picture upload is coming soon."
    }
  ]

  const categories = [
    {
      title: "Getting Started",
      icon: <MessageSquare className="h-5 w-5" />,
      description: "Learn the basics of using AI Chat"
    },
    {
      title: "Account & Settings",
      icon: <Settings className="h-5 w-5" />,
      description: "Manage your account and preferences"
    },
    {
      title: "Profile Management", 
      icon: <User className="h-5 w-5" />,
      description: "Update your profile and personal information"
    },
    {
      title: "Privacy & Security",
      icon: <Shield className="h-5 w-5" />,
      description: "Learn about data protection and security"
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {category.icon}
                </div>
                <h3 className="font-medium text-gray-900">{category.title}</h3>
              </div>
              <p className="text-sm text-gray-600">{category.description}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="flex items-center justify-between w-full text-left py-2"
                  >
                    <h3 className="font-medium text-gray-900">{faq.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFaq === index && (
                    <div className="mt-2 pb-2">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found for "{searchQuery}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-3"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Still Need Help?
          </h2>
          
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
            >
              <Mail className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Email Support</div>
                <div className="text-sm text-gray-500">support@aichat.com</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Documentation</div>
                <div className="text-sm text-gray-500">Detailed guides and tutorials</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/about')}
            className="justify-start"
          >
            About AI Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/privacy')}
            className="justify-start"
          >
            Privacy Policy
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/terms')}
            className="justify-start"
          >
            Terms of Service
          </Button>
        </div>
      </div>
    </div>
  )
}