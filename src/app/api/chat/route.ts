import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { generateEmbedding } from "@/lib/generate-embeddings"
import { searchSimilarChunks, type SearchResult } from "@/lib/vector-search"

const SYSTEM_PROMPT = `You are a helpful resource navigator for families seeking social services and support programs. Your role is to answer questions using ONLY the reference documents provided below.

STRICT RULES:
- ONLY use information from the provided reference documents to answer questions.
- If the reference documents do not contain relevant information, say: "I don't have information about that in my resources. Please ask a staff member for help."
- NEVER guess, speculate, or provide information not found in the reference documents.
- NEVER provide personalized advice, medical advice, legal advice, or mental health counseling.
- NEVER handle crisis situations — instead say: "For immediate help, please speak with a staff member right away."
- Do NOT make up programs, phone numbers, addresses, or eligibility requirements.
- Do NOT include citations or references in your response. The sources will be displayed separately.
- Keep answers clear, concise, and easy to understand.
- If a question is outside the scope of available documents, politely direct the user to speak with staff.`

function buildContextPrompt(chunks: SearchResult[]): string {
  if (chunks.length === 0) {
    return "No relevant reference documents were found for this question."
  }

  const sections = chunks.map((chunk, i) => {
    const source = chunk.sourceUrl
      ? `Source: ${chunk.documentTitle} (${chunk.sourceUrl})`
      : `Source: ${chunk.documentTitle}`
    const section = chunk.sectionTitle ? `Section: ${chunk.sectionTitle}` : ""
    return `--- Reference ${i + 1} ---\n${source}\n${section}\n${
      chunk.content
    }`.trim()
  })

  return `REFERENCE DOCUMENTS:\n\n${sections.join("\n\n")}`
}

export interface Source {
  title: string
  sectionTitle: string | null
  url: string | null
}

function formatSources(chunks: SearchResult[]): Source[] {
  const seen = new Set<string>()
  return chunks
    .filter((chunk) => {
      const key = chunk.documentId
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((chunk) => ({
      title: chunk.documentTitle,
      sectionTitle: chunk.sectionTitle,
      url: chunk.sourceUrl,
    }))
}

const NO_RESULTS_MESSAGE =
  "I don't have information about that in my resources. Please ask a staff member for help."

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get the latest user message for retrieval
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user")

  if (!lastUserMessage) {
    return new Response("No user message found", { status: 400 })
  }

  // Extract text from the user message (v6 AI SDK uses parts array)
  const userText =
    lastUserMessage.content ??
    (lastUserMessage.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ||
      "")

  if (!userText) {
    return new Response("Empty user message", { status: 400 })
  }

  // Generate embedding for the user's question
  const queryEmbedding = await generateEmbedding(userText)

  // Search for relevant document chunks
  const relevantChunks = await searchSimilarChunks(queryEmbedding, 5, 0.3)

  // Format source metadata
  const sources = formatSources(relevantChunks)

  // Build context from retrieved chunks (or empty-results prompt)
  const contextPrompt = buildContextPrompt(relevantChunks)

  // If no relevant chunks found, instruct the model to return the fallback
  const systemPrompt =
    relevantChunks.length === 0
      ? `${SYSTEM_PROMPT}\n\n${contextPrompt}\n\nYou must respond with: "${NO_RESULTS_MESSAGE}"`
      : `${SYSTEM_PROMPT}\n\n${contextPrompt}`

  const result = await generateText({
    model: openai("gpt-5-mini"),
    system: systemPrompt,
    messages,
  })

  return Response.json({
    message: result.text,
    sources,
  })
}
