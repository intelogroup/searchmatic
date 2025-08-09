import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserPreferences } from '@/types/database'
import { ArrowLeft } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setPreferences(data)
    } else {
      // Create default preferences if none exist
      const { data: newPrefs } = await supabase
        .from('user_preferences')
        .insert([{ user_id: user.id }])
        .select()
        .single()
      
      if (newPrefs) {
        setPreferences(newPrefs)
      }
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!preferences) return

    const { error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('id', preferences.id)

    if (!error) {
      setPreferences({ ...preferences, ...updates })
      setMessage('Settings updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('Failed to update settings')
    }
  }

  if (!preferences) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* Theme Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Theme
              </label>
              <Select
                value={preferences.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  updatePreferences({ theme: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Language Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Language</h3>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Language
              </label>
              <Select
                value={preferences.language}
                onValueChange={(value: 'en' | 'es' | 'fr' | 'de') =>
                  updatePreferences({ language: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications for new messages
                </p>
              </div>
              <button
                onClick={() =>
                  updatePreferences({ 
                    notifications_enabled: !preferences.notifications_enabled 
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive email updates about your conversations
                </p>
              </div>
              <button
                onClick={() =>
                  updatePreferences({ 
                    email_notifications: !preferences.email_notifications 
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.email_notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {message && (
            <div className={`text-sm p-3 rounded ${
              message.includes('Failed')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* Account Actions */}
          <div className="pt-6 border-t space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Account</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full justify-start"
              >
                Manage Profile
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut()
                }}
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}