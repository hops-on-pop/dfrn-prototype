import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";

/**
 * Generate embeddings for multiple text chunks using OpenAI
 * Uses text-embedding-3-small model (1536 dimensions)
 *
 * @param texts - Array of text strings to embed
 * @returns Array of embedding vectors (1536 dimensions each)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Validate that texts aren't empty
  const validTexts = texts.filter((text) => text.trim().length > 0);
  if (validTexts.length !== texts.length) {
    throw new Error("All text chunks must be non-empty");
  }

  try {
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: texts,
    });

    return embeddings;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate a single embedding for a text chunk
 *
 * @param text - Text string to embed
 * @returns Embedding vector (1536 dimensions)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text]);
  return embedding;
}
