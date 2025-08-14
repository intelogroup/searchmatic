import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingScreen } from '@/components/LoadingSpinner'
import type { Conversation, Message } from '@/types/database'
import { Plus, Send, Settings, User as UserIcon, LogOut } from 'lucide-react'

export default function Chat() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadConversationsCallback = useCallback(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    // Load conversations when user is available
    loadConversationsCallback()
  }, [loadConversationsCallback])

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    } else if (conversations.length > 0) {
      // Navigate to first conversation if no ID specified
      navigate(`/chat/${conversations[0].id}`, { replace: true })
    }
  }, [conversationId, conversations, navigate])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (!error && data) {
      setConversations(data)
    }
  }

  const loadConversation = async (id: string) => {
    // Load conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (conversation) {
      setCurrentConversation(conversation)
    }

    // Load messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (messages) {
      setMessages(messages)
    }
  }

  const createNewConversation = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ 
        title: 'New Conversation',
        user_id: user?.id 
      }])
      .select()
      .single()

    if (!error && data) {
      setConversations([data, ...conversations])
      navigate(`/chat/${data.id}`)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentConversation || loading) return

    setLoading(true)
    const userMessage = newMessage.trim()
    setNewMessage('')

    // Add user message
    const { data: userMsgData } = await supabase
      .from('messages')
      .insert([{
        conversation_id: currentConversation.id,
        role: 'user',
        content: userMessage,
        metadata: {}
      }])
      .select()
      .single()

    if (userMsgData) {
      setMessages(prev => [...prev, userMsgData])
    }

    // Simulate AI response (replace with actual AI call)
    setTimeout(async () => {
      const responses = [
        "I'm here to help! What would you like to know?",
        "That's an interesting question. Let me think about that...",
        "I can help you with that. Here's what I think...",
        "Thanks for asking! Here's my response to your message.",
        "I understand what you're asking. Let me provide some insights..."
      ]
      
      const aiResponse = responses[Math.floor(Math.random() * responses.length)]

      const { data: aiMsgData } = await supabase
        .from('messages')
        .insert([{
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: aiResponse,
          metadata: {}
        }])
        .select()
        .single()

      if (aiMsgData) {
        setMessages(prev => [...prev, aiMsgData])
      }
      setLoading(false)
    }, 1000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) {
    return <LoadingScreen message="Loading chat..." />
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <UserIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={createNewConversation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => navigate(`/chat/${conversation.id}`)}
              className={`w-full p-3 text-left rounded-lg mb-2 transition-colors ${
                currentConversation?.id === conversation.id
                  ? 'bg-blue-100 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium text-sm truncate">
                {conversation.title}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(conversation.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
          
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Create your first chat to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <h2 className="font-medium">{currentConversation.title}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-900 mb-2">
                Welcome to AI Chat
              </h2>
              <p className="text-gray-600 mb-4">
                Create a new conversation to get started
              </p>
              <Button onClick={createNewConversation}>
                <Plus className="h-4 w-4 mr-2" />
                Start Chatting
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}