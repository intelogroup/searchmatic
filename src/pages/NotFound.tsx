import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, MessageSquare } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* 404 Illustration */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-gray-300 mb-2">404</div>
            <div className="w-16 h-1 bg-gray-300 mx-auto rounded"></div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate('/chat')}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Start Chatting
            </Button>
          </div>

          {/* Help Links */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-3">Need help?</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/help')}
              >
                Help Center
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/about')}
              >
                About Us
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Lost? No worries - we've all been there!</p>
        </div>
      </div>
    </div>
  )
}