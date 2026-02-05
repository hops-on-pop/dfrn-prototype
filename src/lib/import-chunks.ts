import { db } from "@/db";
import { documents, textChunks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";

interface TSVRow {
	documentTitle: string;
	sourceUrl: string;
	sectionTitle: string;
	chunkContent: string;
	embedding: number[];
}

/**
 * Parse a TSV file containing document chunks
 * @param filepath - Path to the TSV file
 * @returns Array of parsed rows
 */
async function parseTSV(filepath: string): Promise<TSVRow[]> {
	const content = await readFile(filepath, "utf-8");
	const lines = content.split("\n").filter((line) => line.trim());

	// Remove header and comment lines
	const dataLines = lines.filter(
		(line) => !line.startsWith("#") && !line.startsWith("document_title"),
	);

	return dataLines.map((line) => {
		const [documentTitle, sourceUrl, sectionTitle, chunkContent, embeddingStr] =
			line.split("\t");

		if (!documentTitle || !chunkContent || !embeddingStr) {
			throw new Error(`Invalid TSV row: missing required fields in "${line}"`);
		}

		let embedding: number[];
		try {
			embedding = JSON.parse(embeddingStr);
			if (!Array.isArray(embedding) || embedding.length !== 1536) {
				throw new Error("Embedding must be an array of 1536 numbers");
			}
		} catch (error) {
			throw new Error(
				`Invalid embedding format in row for "${documentTitle}": ${error}`,
			);
		}

		return {
			documentTitle: documentTitle.trim(),
			sourceUrl: sourceUrl?.trim() || "",
			sectionTitle: sectionTitle?.trim() || "",
			chunkContent: chunkContent.trim(),
			embedding,
		};
	});
}

/**
 * Import document chunks from a TSV file into the database
 * This function is re-runnable - it will skip documents/chunks that already exist
 * 
 * @param filepath - Path to the TSV file
 * @returns Summary of imported items
 */
export async function importChunksFromTSV(filepath: string) {
	const rows = await parseTSV(filepath);

	// Group rows by document
	const documentGroups = new Map<string, TSVRow[]>();
	for (const row of rows) {
		const key = `${row.documentTitle}|${row.sourceUrl}`;
		if (!documentGroups.has(key)) {
			documentGroups.set(key, []);
		}
		documentGroups.get(key)!.push(row);
	}

	let documentsCreated = 0;
	let chunksCreated = 0;
	let chunksSkipped = 0;

	// Process each document group
	for (const [_key, chunks] of documentGroups) {
		const firstChunk = chunks[0];

		// Find or create document
		const existingDocs = await db
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.title, firstChunk.documentTitle),
					firstChunk.sourceUrl
						? eq(documents.sourceUrl, firstChunk.sourceUrl)
						: sql`${documents.sourceUrl} IS NULL`,
				),
			);

		let documentId: string;

		if (existingDocs.length > 0) {
			documentId = existingDocs[0].id;
			console.log(`  Found existing document: "${firstChunk.documentTitle}"`);
		} else {
			const [newDoc] = await db
				.insert(documents)
				.values({
					title: firstChunk.documentTitle,
					sourceUrl: firstChunk.sourceUrl || null,
				})
				.returning();
			documentId = newDoc.id;
			documentsCreated++;
			console.log(`  Created document: "${firstChunk.documentTitle}"`);
		}

		// Insert chunks for this document
		for (const chunk of chunks) {
			// Check if chunk already exists (by content)
			const existingChunks = await db
				.select()
				.from(textChunks)
				.where(
					and(
						eq(textChunks.documentId, documentId),
						eq(textChunks.content, chunk.chunkContent),
					),
				);

			if (existingChunks.length > 0) {
				chunksSkipped++;
				continue;
			}

			// Convert embedding to PostgreSQL vector format
			const embeddingStr = `[${chunk.embedding.join(",")}]`;

			await db.insert(textChunks).values({
				documentId,
				sectionTitle: chunk.sectionTitle || null,
				content: chunk.chunkContent,
				embedding: sql`${embeddingStr}::vector`,
			});

			chunksCreated++;
		}
	}

	const summary = {
		documentsCreated,
		chunksCreated,
		chunksSkipped,
		totalRows: rows.length,
	};

	console.log("\nImport Summary:");
	console.log(`  Documents created: ${documentsCreated}`);
	console.log(`  Chunks created: ${chunksCreated}`);
	console.log(`  Chunks skipped (duplicates): ${chunksSkipped}`);
	console.log(`  Total rows processed: ${rows.length}`);

	return summary;
}
