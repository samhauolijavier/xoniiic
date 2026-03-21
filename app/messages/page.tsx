'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'

interface UserInfo {
  id: string
  name: string | null
  role: string
  seekerProfile?: { avatarUrl: string | null; username: string | null } | null
  employerProfile?: { logoUrl: string | null; companyName: string | null } | null
}

interface Participant {
  id: string
  userId: string
  lastReadAt: string | null
  user: UserInfo
}

interface MessageData {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: {
    id: string
    name: string | null
    seekerProfile?: { avatarUrl: string | null } | null
    employerProfile?: { logoUrl: string | null } | null
  }
}

interface ConversationListItem {
  id: string
  updatedAt: string
  participants: Participant[]
  lastMessage: MessageData | null
  unreadCount: number
}

interface ConversationDetail {
  id: string
  participants: Participant[]
  messages: MessageData[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString()
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 0) return time
  if (diffDays === 1) return `Yesterday ${time}`
  if (diffDays < 7) return `${date.toLocaleDateString([], { weekday: 'short' })} ${time}`
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${time}`
}

function getDisplayName(user: UserInfo): string {
  if (user.role === 'employer' && user.employerProfile?.companyName) {
    return user.employerProfile.companyName
  }
  return user.name || 'User'
}

function getAvatarUrl(user: UserInfo): string | null {
  if (user.role === 'employer') return user.employerProfile?.logoUrl || null
  return user.seekerProfile?.avatarUrl || null
}

function Avatar({ user, size = 'md' }: { user: UserInfo; size?: 'sm' | 'md' }) {
  const url = getAvatarUrl(user)
  const name = getDisplayName(user)
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name[0]?.toUpperCase() || 'U'}
    </div>
  )
}

function MessagesContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedConversationId = searchParams.get('conversation')

  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileShowThread, setMobileShowThread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentUserId = (session?.user as { id: string } | undefined)?.id

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      if (data.conversations) setConversations(data.conversations)
    } catch {}
  }, [])

  // Fetch active conversation messages
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/messages/conversations/${convId}`)
      const data = await res.json()
      if (data.conversation) {
        setActiveConversation(data.conversation)
      }
    } catch {}
  }, [])

  // Initial load
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    fetchConversations().then(() => setLoading(false))
  }, [session, status, router, fetchConversations])

  // Load selected conversation from URL
  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId)
      setMobileShowThread(true)
    }
  }, [selectedConversationId, fetchMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages, scrollToBottom])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConversationId) return

    pollRef.current = setInterval(() => {
      fetchMessages(selectedConversationId)
      fetchConversations()
    }, 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedConversationId, fetchMessages, fetchConversations])

  const selectConversation = (convId: string) => {
    router.push(`/messages?conversation=${convId}`, { scroll: false })
    setMobileShowThread(true)
  }

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConversationId || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/messages/conversations/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageInput.trim() }),
      })
      const data = await res.json()
      if (data.message && activeConversation) {
        setActiveConversation((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
        )
        setMessageInput('')
        fetchConversations()
      }
    } catch {}
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getOtherParticipant = (participants: Participant[]): UserInfo | null => {
    const other = participants.find((p) => p.userId !== currentUserId)
    return other?.user || null
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-brand-card rounded" />
          <div className="h-[600px] bg-brand-card rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold gradient-text mb-4">Messages</h1>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden flex" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>

        {/* Conversation List — hidden on mobile when thread is showing */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-brand-border flex flex-col ${mobileShowThread ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-brand-border">
            <h2 className="text-sm font-semibold text-brand-muted uppercase tracking-wider">Conversations</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-border/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" />
                  </svg>
                </div>
                <p className="text-brand-muted text-sm">No conversations yet.</p>
                <p className="text-brand-muted text-xs mt-1">Browse talent or job posts to start connecting!</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherParticipant(conv.participants)
                if (!other) return null
                const isSelected = conv.id === selectedConversationId

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-brand-border/30 transition-colors ${
                      isSelected ? 'bg-brand-border/50' : ''
                    }`}
                  >
                    <Avatar user={other} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-brand-text' : 'text-brand-text'}`}>
                          {getDisplayName(other)}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs text-brand-muted flex-shrink-0 ml-2">
                            {timeAgo(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <div className="flex items-center gap-2">
                          <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-brand-text' : 'text-brand-muted'}`}>
                            {conv.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-brand-purple flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className={`flex-1 flex flex-col ${mobileShowThread ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-brand-border flex items-center gap-3">
                {/* Back button on mobile */}
                <button
                  onClick={() => {
                    setMobileShowThread(false)
                    router.push('/messages', { scroll: false })
                  }}
                  className="md:hidden p-1 rounded-lg text-brand-muted hover:text-brand-text"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {(() => {
                  const other = getOtherParticipant(activeConversation.participants)
                  if (!other) return null
                  return (
                    <>
                      <Avatar user={other} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-brand-text">{getDisplayName(other)}</p>
                        <p className="text-xs text-brand-muted capitalize">{other.role}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConversation.messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <Avatar
                          user={{
                            id: msg.sender.id,
                            name: msg.sender.name,
                            role: '',
                            seekerProfile: msg.sender.seekerProfile ? { ...msg.sender.seekerProfile, username: null } : null,
                            employerProfile: msg.sender.employerProfile ? { ...msg.sender.employerProfile, companyName: null } : null,
                          }}
                          size="sm"
                        />
                      )}
                      <div className={`max-w-[70%] ${isMe ? 'order-first' : ''}`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMe
                              ? 'bg-brand-purple text-white rounded-br-md'
                              : 'bg-brand-border/50 text-brand-text rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <p className={`text-xs text-brand-muted mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-brand-border">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple resize-none"
                    style={{ maxHeight: '120px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                    className="p-2.5 rounded-xl bg-brand-purple text-white hover:bg-brand-purple/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-brand-border/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <p className="text-brand-muted text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-brand-card rounded" />
          <div className="h-[600px] bg-brand-card rounded-2xl" />
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
