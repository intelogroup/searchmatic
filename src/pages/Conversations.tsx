import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Conversation } from '@/types/database'
import { 
  ArrowLeft, 
  Search, 
  MessageSquare, 
  Plus, 
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react'

export default function Conversations() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'old'>('all')
  const [selectedConversations, setSelectedConversations] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    filterAndSearchConversations()
  }, [conversations, searchQuery, filterType])

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setConversations(data)
    }
  }

  const filterAndSearchConversations = () => {
    let filtered = conversations

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply time filter
    if (filterType !== 'all') {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      if (filterType === 'recent') {
        filtered = filtered.filter(conv => new Date(conv.updated_at) > weekAgo)
      } else if (filterType === 'old') {
        filtered = filtered.filter(conv => new Date(conv.updated_at) <= weekAgo)
      }
    }

    setFilteredConversations(filtered)
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

  const startEdit = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return

    const { error } = await supabase
      .from('conversations')
      .update({ title: editTitle.trim() })
      .eq('id', editingId)

    if (!error) {
      setConversations(conversations.map(conv => 
        conv.id === editingId ? { ...conv, title: editTitle.trim() } : conv
      ))
      setEditingId(null)
      setEditTitle('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const deleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (!error) {
      setConversations(conversations.filter(conv => conv.id !== id))
      setSelectedConversations(selectedConversations.filter(convId => convId !== id))
    }
  }

  const toggleSelectConversation = (id: string) => {
    setSelectedConversations(prev => 
      prev.includes(id) 
        ? prev.filter(convId => convId !== id)
        : [...prev, id]
    )
  }

  const deleteSelectedConversations = async () => {
    if (selectedConversations.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedConversations.length} conversations? This action cannot be undone.`)) {
      return
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .in('id', selectedConversations)

    if (!error) {
      setConversations(conversations.filter(conv => !selectedConversations.includes(conv.id)))
      setSelectedConversations([])
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
              <span className="text-sm text-gray-500">
                ({filteredConversations.length} conversations)
              </span>
            </div>
            <Button onClick={createNewConversation}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All conversations</option>
                <option value="recent">Recent (last 7 days)</option>
                <option value="old">Older than 7 days</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedConversations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelectedConversations}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedConversations.length})
              </Button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {filteredConversations.length > 0 ? (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <div key={conversation.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedConversations.includes(conversation.id)}
                      onChange={() => toggleSelectConversation(conversation.id)}
                      className="rounded border-gray-300"
                    />

                    {/* Conversation Icon */}
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === conversation.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                            className="text-lg font-medium"
                            autoFocus
                          />
                          <Button size="sm" onClick={saveEdit}>Save</Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(conversation.updated_at)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/chat/${conversation.id}`)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                      
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                          <div className="py-1 min-w-[120px]">
                            <button
                              onClick={() => startEdit(conversation)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Edit2 className="h-4 w-4" />
                              Rename
                            </button>
                            <button
                              onClick={() => deleteConversation(conversation.id)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterType !== 'all' ? 'No conversations found' : 'No conversations yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Start your first conversation to see it here.'
                }
              </p>
              <Button onClick={createNewConversation}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}