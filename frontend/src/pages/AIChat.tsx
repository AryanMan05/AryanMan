import React, { useState, useEffect, useRef } from 'react'
import { Bot, Send, User, Trash2, Shield, Zap, Sparkles, AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

const SUGGESTIONS = [
  'How can I lower my blood pressure naturally?',
  'What are healthy daily water goals for active adults?',
  'Explain the difference between fasting and postprandial blood sugar',
  'What sleep habits help optimize deep sleep cycles?'
]

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [includeHealthContext, setIncludeHealthContext] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchHistory = async () => {
    try {
      setInitialLoading(true)
      const res = await api.get('/ai/history')
      setMessages(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || input
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    if (!contentToSend) setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        includeHealthContext
      })
      const botMsg: Message = { role: 'assistant', content: res.data.reply }
      setMessages((prev) => [...prev, botMsg])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear your conversation history?')) return
    try {
      await api.delete('/ai/history')
      setMessages([])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] pb-4 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Care AI Health Companion
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Online
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Personalized health guidance, biometric explanations, and wellness consultations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHealthContext}
              onChange={(e) => setIncludeHealthContext(e.target.checked)}
              className="rounded bg-white border-slate-300 text-emerald-600 focus:ring-0"
            />
            Attach My Health Vitals
          </label>
          <button
            onClick={handleClear}
            className="p-2 text-slate-400 hover:text-rose-600 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        {messages.length === 0 && !initialLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">How can I assist your wellness today?</h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mt-1">
                Ask questions about your logged metrics, dietary guidelines, workout recovery, or general health.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full pt-4">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-emerald-400 text-xs text-slate-700 font-semibold transition"
                >
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 font-medium'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> {error}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="mt-3 flex gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Care AI anything about health, vitals, nutrition..."
          className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-sm shadow-sm transition"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-600/25 transition flex items-center justify-center"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  )
}
