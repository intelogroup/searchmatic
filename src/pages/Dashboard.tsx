import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import type { Conversation, Profile } from '@/types/database'
import { MessageSquare, Plus, Settings, User, LogOut, Clock, TrendingUp, FileSearch, BookOpen, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState({
    totalConversations: 0,
    todayMessages: 0,
    thisWeekConversations: 0
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
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
    await signOut()
    navigate('/login')
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSearch className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Articles Screened</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Research Projects</h3>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/projects/new')}
                className="w-full justify-start"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/workflows')}
                className="w-full justify-start"
              >
                <FileSearch className="h-4 w-4 mr-2" />
                Literature Search
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/protocols')}
                className="w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Research Protocols
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/chat')}
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Assistant
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

        {/* Workflow Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Systematic Review Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center mb-3">1</div>
              <h4 className="font-medium text-gray-900 mb-2">Define Protocol</h4>
              <p className="text-sm text-gray-600">Set up your research question using PICO framework and define inclusion/exclusion criteria.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-lg flex items-center justify-center mb-3">2</div>
              <h4 className="font-medium text-gray-900 mb-2">Search Literature</h4>
              <p className="text-sm text-gray-600">Use AI-powered search across multiple databases to find relevant articles.</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-500 text-white rounded-lg flex items-center justify-center mb-3">3</div>
              <h4 className="font-medium text-gray-900 mb-2">Screen Articles</h4>
              <p className="text-sm text-gray-600">Review and screen articles based on your defined criteria with AI assistance.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center mb-3">4</div>
              <h4 className="font-medium text-gray-900 mb-2">Analyze & Report</h4>
              <p className="text-sm text-gray-600">Extract data, perform analysis, and generate comprehensive reports.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}