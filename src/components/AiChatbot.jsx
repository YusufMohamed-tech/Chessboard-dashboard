import React, { useState, useRef, useEffect } from 'react'
import { Bot, X, SendHorizonal, LoaderCircle, MessageSquareText } from 'lucide-react'
import { summarizeContext, askAiChatbot } from '../utils/aiAssistant'

const SUGGESTIONS = [
  'كم عدد الزيارات المكتملة؟',
  'من هم الوكلاء الميدانيين النشطين؟',
  'أعطني ملخصاً لأحدث 5 زيارات',
]

export default function AiChatbot({ visits, shoppers, locations }) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'مرحباً بك! أنا المساعد الذكي للوحة التحكم. كيف يمكنني مساعدتك اليوم؟',
    }
  ])
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])

  const handleAsk = async (userQuestion) => {
    if (!userQuestion || isThinking) return

    const newMessages = [...messages, { role: 'user', content: userQuestion }]
    setMessages(newMessages)
    setQuestion('')
    setIsThinking(true)

    try {
      const contextStr = summarizeContext(visits, shoppers, locations)
      
      // format for api
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const answer = await askAiChatbot(apiMessages, contextStr)

      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (error) {
      console.error('Chat API Error:', error)
      setMessages((prev) => [...prev, { role: 'assistant', content: `عذراً، حدث خطأ: ${error.message}` }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cb-lime text-white shadow-lg shadow-cb-lime/30 transition-transform hover:scale-105 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 left-6 z-50 flex h-[500px] max-h-[80vh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-cb-gray-200 bg-white shadow-2xl transition-all duration-300 origin-bottom-left ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-cb-lime px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-bold">المساعد الذكي</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 transition hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-cb-lime text-white rounded-br-sm' : 'bg-white border border-cb-gray-200 text-cb-gray-800 rounded-bl-sm shadow-sm'}`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-cb-gray-200 px-4 py-2 text-sm text-cb-gray-500 rounded-bl-sm shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-cb-lime" />
                أفكر...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 p-3 bg-white border-t border-cb-gray-100">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleAsk(s)}
                className="text-[11px] rounded-full border border-cb-gray-200 px-3 py-1 text-cb-gray-600 hover:bg-cb-gray-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAsk(question.trim())
          }}
          className="border-t border-cb-gray-200 bg-white p-3"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="اسأل سؤالاً..."
              className="flex-1 rounded-full border border-cb-gray-300 bg-cb-gray-50 px-4 py-2 text-sm outline-none transition focus:border-cb-lime"
            />
            <button
              type="submit"
              disabled={!question.trim() || isThinking}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cb-lime text-white transition hover:bg-cb-lime-dark disabled:opacity-50"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
