#!/usr/bin/env bun

/**
 * CLI script to add embeddings to a TSV file
 * 
 * This script reads a TSV file with document chunks (without embeddings),
 * generates embeddings for each chunk, and outputs a complete TSV.
 * 
 * Input TSV format (without embedding column or with empty embeddings):
 * document_title	source_url	section_title	chunk_content
 * 
 * Output TSV format (with embeddings):
 * document_title	source_url	section_title	chunk_content	embedding
 * 
 * Usage:
 *   bun scripts/add-embeddings-to-tsv.ts <input.tsv> [output.tsv]
 * 
 * If output is not provided, defaults to input filename with "-embedded" suffix
 */

import { generateEmbeddings } from "@/lib/generate-embeddings";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

interface TSVRow {
	documentTitle: string;
	sourceUrl: string;
	sectionTitle: string;
	chunkContent: string;
	embedding?: number[];
}

async function main() {
	const inputPath = process.argv[2];

	if (!inputPath) {
		console.error("Error: Input TSV file path is required");
		console.error(
			"\nUsage: bun scripts/add-embeddings-to-tsv.ts <input.tsv> [output.tsv]",
		);
		console.error("\nInput TSV should have these columns:");
		console.error("document_title	source_url	section_title	chunk_content");
		process.exit(1);
	}

	// Determine output path
	let outputPath = process.argv[3];
	if (!outputPath) {
		const dir = dirname(inputPath);
		const base = basename(inputPath, ".tsv");
		outputPath = join(dir, `${base}-embedded.tsv`);
	}

	try {
		console.log(`📖 Reading input from: ${inputPath}`);
		const content = await readFile(inputPath, "utf-8");
		const lines = content.split("\n").filter((line) => line.trim());

		// Remove comment lines and find header
		const dataLines = lines.filter((line) => !line.startsWith("#"));

		if (dataLines.length === 0) {
			throw new Error("No data found in TSV file");
		}

		const header = dataLines[0];
		const contentLines = dataLines.slice(1);

		// Check if header has embedding column
		const hasEmbedding = header.includes("embedding");
		console.log(
			`   Found ${contentLines.length} chunks${hasEmbedding ? " (with embedding column)" : ""}`,
		);

		// Parse rows
		const rows: TSVRow[] = [];
		const textsToEmbed: string[] = [];

		for (const line of contentLines) {
			const parts = line.split("\t");

			if (parts.length < 4) {
				console.warn(`   ⚠️  Skipping invalid row: ${line}`);
				continue;
			}

			const [documentTitle, sourceUrl, sectionTitle, chunkContent, embedding] =
				parts;

			if (!documentTitle || !chunkContent) {
				console.warn(`   ⚠️  Skipping row with missing required fields`);
				continue;
			}

			const row: TSVRow = {
				documentTitle: documentTitle.trim(),
				sourceUrl: sourceUrl?.trim() || "",
				sectionTitle: sectionTitle?.trim() || "",
				chunkContent: chunkContent.trim(),
			};

			// Check if this row already has an embedding
			if (embedding && embedding.trim().startsWith("[")) {
				try {
					row.embedding = JSON.parse(embedding.trim());
					console.log(
						`   ✓ Found existing embedding for: "${documentTitle}" - "${sectionTitle || chunkContent.substring(0, 50)}..."`,
					);
				} catch {
					// Invalid embedding, will regenerate
					textsToEmbed.push(chunkContent);
				}
			} else {
				textsToEmbed.push(chunkContent);
			}

			rows.push(row);
		}

		if (rows.length === 0) {
			throw new Error("No valid rows found in TSV file");
		}

		// Generate embeddings for chunks that don't have them
		if (textsToEmbed.length > 0) {
			console.log(
				`\n🤖 Generating embeddings for ${textsToEmbed.length} chunks...`,
			);
			console.log(
				`   (Using OpenAI text-embedding-3-small model, 1536 dimensions)`,
			);

			const newEmbeddings = await generateEmbeddings(textsToEmbed);
			console.log(`✅ Generated ${newEmbeddings.length} embeddings`);

			// Add embeddings to rows that need them
			let embeddingIndex = 0;
			for (const row of rows) {
				if (!row.embedding) {
					row.embedding = newEmbeddings[embeddingIndex];
					embeddingIndex++;
				}
			}
		} else {
			console.log("\n✓ All chunks already have embeddings, no generation needed");
		}

		// Generate output TSV
		const outputHeader =
			"document_title\tsource_url\tsection_title\tchunk_content\tembedding";
		const outputRows = rows.map(
			(row) =>
				`${row.documentTitle}\t${row.sourceUrl}\t${row.sectionTitle}\t${row.chunkContent}\t${JSON.stringify(row.embedding)}`,
		);

		const outputContent = [outputHeader, ...outputRows].join("\n");

		// Write to file
		console.log(`\n💾 Writing complete TSV to: ${outputPath}`);
		await writeFile(outputPath, outputContent, "utf-8");

		console.log("\n✨ Success!");
		console.log(`   Total rows processed: ${rows.length}`);
		console.log(`   New embeddings generated: ${textsToEmbed.length}`);
		console.log(`   Output file: ${outputPath}`);
		console.log(
			`\n📝 Next step: Run "bun scripts/import.ts ${outputPath}" to import into database`,
		);

		process.exit(0);
	} catch (error) {
		console.error("\n❌ Error:", error);
		process.exit(1);
	}
}

main();
