import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingScreen } from '@/components/LoadingSpinner'
import type { Profile } from '@/types/database'
import { ArrowLeft, Upload } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        email: data.email
      })
    }
  }

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name || null,
        email: formData.email
      })
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...formData })
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage('Failed to update profile')
    }
    setLoading(false)
  }

  if (!profile) {
    return <LoadingScreen message="Loading profile..." />
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
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-500">
                    {(formData.full_name || formData.email)[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.full_name || 'No name set'}
              </h2>
              <p className="text-gray-600">{formData.email}</p>
              <Button variant="outline" size="sm" className="mt-2" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={updateProfile} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">
                Email changes are not supported in this MVP
              </p>
            </div>

            {message && (
              <div className={`text-sm p-3 rounded ${
                message.includes('Failed')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>

          {/* Account Stats */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Member Since</p>
                <p className="text-lg text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Last Updated</p>
                <p className="text-lg text-gray-900">
                  {new Date(profile.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                disabled
              >
                Delete Account
              </Button>
              <p className="text-sm text-gray-500">
                Account deletion is not available in this MVP version
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}