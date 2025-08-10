import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import type { Conversation, Profile } from '@/types/database'
import { MessageSquare, Plus, Settings, User, LogOut, Clock, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    totalConversations: 0,
    todayMessages: 0,
    thisWeekConversations: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    // Get current user and profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileData) {
      setProfile(profileData)
    }

    // Load recent conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(5)

    if (conversations) {
      setConversations(conversations)
      setStats(prev => ({ ...prev, totalConversations: conversations.length }))
    }

    // Calculate basic stats (placeholder logic)
    setStats({
      totalConversations: conversations?.length || 0,
      todayMessages: Math.floor(Math.random() * 15) + 5, // Placeholder
      thisWeekConversations: Math.floor(Math.random() * 8) + 2 // Placeholder
    })
  }

  const createNewConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('conversations')
      .insert([{ 
        title: 'New Conversation',
        user_id: user.id 
      }])
      .select()
      .single()

    if (!error && data) {
      navigate(`/chat/${data.id}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Chat Dashboard</h1>
              <p className="text-gray-600">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Messages Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeekConversations}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={createNewConversation}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/chat')}
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Continue Last Chat
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/conversations')}
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Manage Conversations
              </Button>
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Conversations</h3>
            <div className="space-y-3">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{conversation.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No conversations yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewConversation}
                    className="mt-3"
                  >
                    Start your first chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Ask Questions</h4>
              <p className="text-sm text-gray-600">Start conversations by asking the AI anything you'd like to know.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Organize Chats</h4>
              <p className="text-sm text-gray-600">Create different conversations for different topics.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Customize Settings</h4>
              <p className="text-sm text-gray-600">Personalize your experience in the settings page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}