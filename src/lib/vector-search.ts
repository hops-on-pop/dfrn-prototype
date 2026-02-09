import { db } from "@/db";
import { textChunks, documents } from "@/db/schema";
import { sql } from "drizzle-orm";

export interface SearchResult {
  id: string;
  content: string;
  sectionTitle: string | null;
  similarity: number;
  documentId: string;
  documentTitle: string;
  sourceUrl: string | null;
}

/**
 * Search for text chunks using vector similarity
 * @param queryEmbedding - The embedding vector for the search query (1536 dimensions)
 * @param limit - Maximum number of results to return (default: 5)
 * @param similarityThreshold - Minimum similarity score (0-1, default: 0.7)
 * @returns Array of matching text chunks with document metadata
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  limit = 5,
  similarityThreshold = 0.7,
): Promise<SearchResult[]> {
  // Validate embedding dimensions
  if (queryEmbedding.length !== 1536) {
    throw new Error(
      `Invalid embedding dimensions: expected 1536, got ${queryEmbedding.length}`,
    );
  }

  // Convert embedding to PostgreSQL vector format
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Query using cosine similarity
  // Note: 1 - cosine_distance = cosine_similarity
  const results = await db
    .select({
      id: textChunks.id,
      content: textChunks.content,
      sectionTitle: textChunks.sectionTitle,
      documentId: textChunks.documentId,
      documentTitle: documents.title,
      sourceUrl: documents.sourceUrl,
      similarity: sql<number>`1 - (${textChunks.embedding} <=> ${embeddingStr}::vector)`,
    })
    .from(textChunks)
    .innerJoin(documents, sql`${textChunks.documentId} = ${documents.id}`)
    .where(
      sql`1 - (${textChunks.embedding} <=> ${embeddingStr}::vector) >= ${similarityThreshold}`,
    )
    .orderBy(sql`${textChunks.embedding} <=> ${embeddingStr}::vector ASC`)
    .limit(limit);

  return results.map((row) => ({
    id: row.id,
    content: row.content,
    sectionTitle: row.sectionTitle,
    similarity: row.similarity,
    documentId: row.documentId,
    documentTitle: row.documentTitle,
    sourceUrl: row.sourceUrl,
  }));
}
