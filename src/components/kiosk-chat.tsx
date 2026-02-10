"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Markdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/layout/header"
import { Textarea } from "@/components/ui/textarea"
import { PersonStandingIcon } from "lucide-react"

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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const resetSession = useCallback(() => {
    setMessages([])
    setInput("")
    setSelectedRole(null)
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
          userRole: selectedRole,
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
      <Header />

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && !selectedRole && (
            <div className="flex flex-1 items-center justify-center py-16 font-[Schoolbell]">
              <div className="grid grid-cols-2 gap-6">
                {/* Yellow — top left */}
                <div className="flex size-56 md:size-72 flex-col items-center justify-center bg-yellow-400 p-6 text-green-700 shadow-lg">
                  <p className="text-3xl md:text-4xl font-bold text-center leading-9">
                    To Get Started Select Your Role
                  </p>
                </div>

                {/* Red — top right */}
                <button
                  onClick={() => setSelectedRole("staff")}
                  className="flex size-56 md:size-72 cursor-pointer flex-col items-center justify-center bg-red-700 p-6 text-white shadow-lg transition-transform hover:scale-105"
                >
                  <div className="text-3xl md:text-4xl font-bold flex flex-col items-center gap-2">
                    Staff Member
                    <PersonStandingIcon className="size-20" />
                  </div>{" "}
                </button>

                {/* Blue — bottom left (rotated) */}
                <button
                  onClick={() => setSelectedRole("student")}
                  className="flex size-56 md:size-72 -rotate-10 cursor-pointer flex-col items-center justify-center bg-blue-700 p-6 text-white shadow-lg transition-transform hover:scale-105"
                >
                  <div className="text-3xl md:text-4xl font-bold flex flex-col items-center gap-2">
                    Student
                    <PersonStandingIcon className="size-20" />
                  </div>{" "}
                </button>

                {/* Green — bottom right */}
                <button
                  onClick={() => setSelectedRole("parent")}
                  className="flex size-56 md:size-72 cursor-pointer flex-col items-center justify-center bg-green-700 p-6 text-white shadow-lg transition-transform hover:scale-105"
                >
                  <div className="text-3xl md:text-4xl font-bold flex flex-col items-center gap-2">
                    Parent
                    <PersonStandingIcon className="size-20" />
                  </div>
                </button>
              </div>
            </div>
          )}
          {messages.length === 0 && selectedRole && (
            <div className="flex flex-col items-center justify-center bg-yellow-50 p-8 mt-10 rounded-xl border border-yellow-400">
              <p className="text-2xl font-bold text-red-700 pb-8">Notice</p>
              <p className="text-lg pb-6">
                The Digital Family Resource Navigator is not intended to replace
                staff, assist with complex questions, or provide personalized
                advice.
              </p>
              <p className="text-lg pb-6">
                Do not include any personal information in your questions, such
                as your name, address, phone number, email address, or any other
                identifying information.
              </p>
              <p className="text-lg">
                We do not store any conversation history, but personal
                information is not removed from the model, which may be managed
                by a third-party.
              </p>
            </div>
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

      {selectedRole && (
        <>
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
                  className="h-12 px-6 text-lg font-bold font-[Schoolbell] bg-green-700 disabled:opacity-50"
                >
                  Ask
                </Button>
              </form>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={resetSession}
                className="h-12 shrink-0 px-6 text-lg font-bold font-[Schoolbell] bg-yellow-400 text-green-800 disabled:opacity-50 hover:bg-yellow-300 hover:text-green-700"
              >
                Start Over
              </Button>
            </div>
          </footer>
        </>
      )}
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
