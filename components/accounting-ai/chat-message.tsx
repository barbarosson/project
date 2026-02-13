'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, User, ThumbsUp, ThumbsDown, MessageSquare, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  messageId?: string
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void
  isTR: boolean
}

export function AccountingChatMessage({ role, content, timestamp, messageId, onFeedback, isTR }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleFeedback(type: 'positive' | 'negative') {
    setFeedbackGiven(type)
    if (messageId && onFeedback) onFeedback(messageId, type)
  }

  if (role === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-3 bg-[#0A2540] text-white">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          <p className="text-[10px] opacity-50 mt-1.5 text-right">{format(timestamp, 'HH:mm')}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0A2540] flex items-center justify-center text-white">
          <User className="h-4 w-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white">
        <Bot className="h-4 w-4" />
      </div>
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white border border-gray-100 shadow-sm">
          <div className="text-sm whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none
            prose-headings:text-[#0A2540] prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
            prose-strong:text-[#0A2540] prose-p:my-1">
            {content}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
            <p className="text-[10px] text-gray-400">{format(timestamp, 'HH:mm')}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              </Button>
              {messageId && onFeedback && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${feedbackGiven === 'positive' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                    onClick={() => handleFeedback('positive')}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${feedbackGiven === 'negative' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    onClick={() => handleFeedback('negative')}
                    disabled={feedbackGiven !== null}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
