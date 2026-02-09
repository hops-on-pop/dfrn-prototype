"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface Source {
  title: string
  sectionTitle: string | null
  url: string | null
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
}

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

export function KioskChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const resetSession = useCallback(() => {
    setMessages([])
    setInput("")
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
      inactivityTimer.current = null
    }
  }, [setMessages])

  // Reset inactivity timer on any interaction
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    inactivityTimer.current = setTimeout(resetSession, INACTIVITY_TIMEOUT_MS)
  }, [resetSession])

  // Start inactivity timer when messages exist
  useEffect(() => {
    if (messages.length > 0) {
      resetInactivityTimer()
    }
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current)
      }
    }
  }, [messages, resetInactivityTimer])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input after assistant response finishes
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      inputRef.current?.focus()
    }
  }, [isLoading, messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)
    resetInactivityTimer()

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        sources: data.sources,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-primary px-6 py-5">
        <h1 className="text-center text-2xl font-bold text-primary-foreground md:text-3xl">
          Digital Family Resource Navigator
        </h1>
        <p className="mt-1 text-center text-base text-primary-foreground/80">
          Ask a question about our programs, services, and resources.
        </p>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-xl text-muted-foreground md:text-2xl">
                  How can we help you today?
                </p>
                <p className="mt-2 text-base text-muted-foreground">
                  Type your question below to get started.
                </p>
              </div>
              <div className="flex flex-col items-center p-12 border-2 text-lg border-red-700 rounded-lg text-gray-600">
                <p className="pb-8 font-bold text-xl">
                  Important: Privacy Notice
                </p>
                <p className="pb-8">
                  Do not enter your name or any personal information such as
                  email address or phone number. All questions are submitted to
                  an AI model anonymously, but identifying information from your
                  question is not removed.
                </p>
                <p>Our system does not store any information about you.</p>
              </div>
            </>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-5 py-4">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent>
                <p className="text-base text-destructive">
                  Something went wrong. Please try again or ask a staff member
                  for help.
                </p>
              </CardContent>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="shrink-0 border-t bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 items-center gap-3"
          >
            <label htmlFor="chat-input" className="sr-only">
              Question input
            </label>
            <Textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-4 text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 md:text-xl"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 text-lg"
            >
              Ask
            </Button>
          </form>
          {messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={resetSession}
              className="h-12 shrink-0 px-4 text-base"
            >
              Start Over
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  const sources = message.sources
  const text = message.content

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-base leading-relaxed md:text-lg">
            {text}
          </p>
        ) : (
          <div className="markdown-content text-base leading-relaxed md:text-lg">
            <Markdown>{text}</Markdown>
          </div>
        )}

        {/* Sources */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 border-t border-foreground/10 pt-3">
            <p className="mb-1.5 text-sm font-medium text-gray-600">Source:</p>
            <ul className="space-y-1">
              {sources.map((source, i) => (
                <li key={`${source.title}-${i}`} className="text-sm">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {source.title}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      {source.title}
                    </span>
                  )}
                  {source.sectionTitle && (
                    <span className="text-gray-600">
                      {" "}
                      &mdash; {source.sectionTitle}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
