#!/usr/bin/env bun

/**
 * CLI script to generate embeddings and create a TSV file
 * 
 * This script reads a JSON file with document chunks and generates
 * embeddings for each chunk, outputting a TSV file ready for import.
 * 
 * Input JSON format:
 * [
 *   {
 *     "documentTitle": "Resource Guide 2025",
 *     "sourceUrl": "https://example.com/guide.pdf",
 *     "chunks": [
 *       {
 *         "sectionTitle": "Financial Aid",
 *         "content": "Information about financial aid programs..."
 *       },
 *       {
 *         "sectionTitle": "Housing Support",
 *         "content": "Information about housing resources..."
 *       }
 *     ]
 *   }
 * ]
 * 
 * Usage:
 *   bun scripts/generate-embeddings.ts <input.json> [output.tsv]
 * 
 * If output is not provided, defaults to data/document-chunks.tsv
 */

import { generateEmbeddings } from "@/lib/generate-embeddings";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

interface ChunkInput {
	sectionTitle?: string;
	content: string;
}

interface DocumentInput {
	documentTitle: string;
	sourceUrl?: string;
	chunks: ChunkInput[];
}

interface TSVRow {
	documentTitle: string;
	sourceUrl: string;
	sectionTitle: string;
	content: string;
	embedding: number[];
}

async function main() {
	const inputPath = process.argv[2];
	const outputPath =
		process.argv[3] || join(process.cwd(), "data/document-chunks.tsv");

	if (!inputPath) {
		console.error("Error: Input JSON file path is required");
		console.error(
			"\nUsage: bun scripts/generate-embeddings.ts <input.json> [output.tsv]",
		);
		console.error("\nExample input JSON structure:");
		console.error(
			JSON.stringify(
				[
					{
						documentTitle: "Resource Guide 2025",
						sourceUrl: "https://example.com/guide.pdf",
						chunks: [
							{
								sectionTitle: "Financial Aid",
								content: "Information about financial aid programs...",
							},
						],
					},
				],
				null,
				2,
			),
		);
		process.exit(1);
	}

	try {
		console.log(`📖 Reading input from: ${inputPath}`);
		const jsonContent = await readFile(inputPath, "utf-8");
		const documents: DocumentInput[] = JSON.parse(jsonContent);

		if (!Array.isArray(documents)) {
			throw new Error("Input JSON must be an array of documents");
		}

		// Prepare all chunks for batch embedding
		const allRows: Omit<TSVRow, "embedding">[] = [];
		const allTexts: string[] = [];

		for (const doc of documents) {
			if (!doc.documentTitle || !doc.chunks || !Array.isArray(doc.chunks)) {
				throw new Error(
					`Invalid document structure: ${JSON.stringify(doc)}`,
				);
			}

			for (const chunk of doc.chunks) {
				if (!chunk.content || chunk.content.trim().length === 0) {
					throw new Error(
						`Empty chunk content in document "${doc.documentTitle}"`,
					);
				}

				allRows.push({
					documentTitle: doc.documentTitle,
					sourceUrl: doc.sourceUrl || "",
					sectionTitle: chunk.sectionTitle || "",
					content: chunk.content,
				});
				allTexts.push(chunk.content);
			}
		}

		if (allTexts.length === 0) {
			throw new Error("No chunks found in input file");
		}

		console.log(
			`\n🤖 Generating embeddings for ${allTexts.length} chunks...`,
		);
		console.log(
			`   (Using OpenAI text-embedding-3-small model, 1536 dimensions)`,
		);

		const embeddings = await generateEmbeddings(allTexts);

		console.log(`✅ Generated ${embeddings.length} embeddings`);

		// Combine rows with embeddings
		const completeRows: TSVRow[] = allRows.map((row, i) => ({
			...row,
			embedding: embeddings[i],
		}));

		// Generate TSV content
		const header =
			"document_title\tsource_url\tsection_title\tchunk_content\tembedding";
		const rows = completeRows.map(
			(row) =>
				`${row.documentTitle}\t${row.sourceUrl}\t${row.sectionTitle}\t${row.content}\t${JSON.stringify(row.embedding)}`,
		);

		const tsvContent = [header, ...rows].join("\n");

		// Write to file
		console.log(`\n💾 Writing TSV to: ${outputPath}`);
		await writeFile(outputPath, tsvContent, "utf-8");

		console.log("\n✨ Success!");
		console.log(`   Documents processed: ${documents.length}`);
		console.log(`   Total chunks: ${allTexts.length}`);
		console.log(`   Output file: ${outputPath}`);
		console.log(
			`\n📝 Next step: Run "bun scripts/import.ts" to import into database`,
		);

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

main();
