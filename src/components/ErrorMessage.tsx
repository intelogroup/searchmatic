import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ 
  title = 'Error', 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm mb-3">{message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ErrorScreenProps {
  title?: string
  message: string
  onRetry?: () => void
  onGoHome?: () => void
}

export function ErrorScreen({ 
  title = 'Something went wrong', 
  message, 
  onRetry, 
  onGoHome 
}: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md w-full text-center">
        <div className="p-3 bg-red-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-3">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome}>
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}