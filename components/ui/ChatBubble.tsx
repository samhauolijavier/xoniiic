'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface Conversation {
  id: string
  participants: {
    user: { id: string; name: string | null; role: string }
  }[]
  messages: {
    id: string
    content: string
    senderId: string
    createdAt: string
  }[]
  lastMessage?: {
    content: string
  }
  updatedAt: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender?: { name: string | null }
}

export function ChatBubble() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvo, setActiveConvo] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const user = session?.user as { id: string; name?: string } | undefined

  // Fetch conversations
  const fetchConversations = useCallback(async (retries = 2) => {
    if (!session) return
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch('/api/messages/conversations')
        if (!res.ok) {
          if (attempt < retries) { await new Promise(r => setTimeout(r, 1000)); continue }
          return
        }
        const data = await res.json()
        // API returns { conversations: [...] }
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations)
        } else if (Array.isArray(data)) {
          setConversations(data)
        }
        return
      } catch {
        if (attempt < retries) { await new Promise(r => setTimeout(r, 1000)); continue }
      }
    }
  }, [session])

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (!session) return
    try {
      const res = await fetch('/api/messages/unread-count')
      if (!res.ok) return
      const data = await res.json()
      if (typeof data.count === 'number') setUnreadTotal(data.count)
    } catch { /* silent */ }
  }, [session])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async () => {
    if (!activeConvo) return
    try {
      const res = await fetch(`/api/messages/conversations/${activeConvo}`)
      if (!res.ok) return
      const data = await res.json()
      // API returns { conversation: { messages: [...] } }
      if (data.conversation?.messages && Array.isArray(data.conversation.messages)) {
        setMessages(data.conversation.messages)
      } else if (Array.isArray(data.messages)) {
        setMessages(data.messages)
      } else if (Array.isArray(data)) {
        setMessages(data)
      }
    } catch { /* silent */ }
  }, [activeConvo])

  // Initial load + poll unread
  useEffect(() => {
    if (!session) return
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [session, fetchUnread])

  // When bubble opens, load conversations
  useEffect(() => {
    if (open) {
      fetchConversations()
    }
  }, [open, fetchConversations])

  // When active convo changes, load messages and poll
  useEffect(() => {
    if (!activeConvo) return
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [activeConvo, fetchMessages])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/messages/conversations/${activeConvo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMsg.trim() }),
      })
      if (res.ok) {
        setNewMsg('')
        fetchMessages()
      }
    } catch { /* silent */ }
    setSending(false)
  }

  const getOtherParticipant = (convo: Conversation) => {
    return convo.participants.find(p => p.user.id !== user?.id)?.user
  }

  const getLastMessage = (convo: Conversation) => {
    if (convo.lastMessage?.content) {
      const c = convo.lastMessage.content
      return c.length > 40 ? c.slice(0, 40) + '...' : c
    }
    if (convo.messages?.length) {
      const c = convo.messages[0]?.content || ''
      return c.length > 40 ? c.slice(0, 40) + '...' : c
    }
    return 'No messages yet'
  }

  // Don't render if not logged in or on /messages page (all hooks are above)
  if (!session || pathname === '/messages') return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); if (!open) setActiveConvo(null) }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-brand-purple to-brand-orange text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {unreadTotal > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadTotal > 9 ? '9+' : unreadTotal}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[480px] bg-brand-card border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-brand-border flex items-center gap-3">
            {activeConvo ? (
              <>
                <button
                  onClick={() => setActiveConvo(null)}
                  className="text-brand-muted hover:text-brand-text transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-brand-text truncate">
                  {conversations.find(c => c.id === activeConvo) &&
                    getOtherParticipant(conversations.find(c => c.id === activeConvo)!)?.name || 'Chat'}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-brand-text">Messages</p>
            )}
          </div>

          {/* Body */}
          {!activeConvo ? (
            // Conversation list
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-brand-muted text-sm">No conversations yet</p>
                </div>
              ) : (
                conversations.map((convo) => {
                  const other = getOtherParticipant(convo)
                  return (
                    <button
                      key={convo.id}
                      onClick={() => setActiveConvo(convo.id)}
                      className="w-full text-left px-4 py-3 hover:bg-brand-border/50 transition-colors border-b border-brand-border/50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-purple to-brand-orange flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {other?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-text truncate">
                            {other?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-brand-muted truncate">
                            {getLastMessage(convo)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            // Message thread
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-brand-purple to-brand-orange text-white rounded-br-md'
                            : 'bg-brand-border/50 text-brand-text rounded-bl-md'
                        }`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-brand-muted'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-brand-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Type a message..."
                    className="flex-1 bg-brand-border/30 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-purple"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMsg.trim() || sending}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-orange text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
