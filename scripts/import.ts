#!/usr/bin/env bun

/**
 * CLI script to import document chunks from a TSV file
 * 
 * Usage:
 *   bun scripts/import.ts [path-to-tsv]
 * 
 * If no path is provided, defaults to data/document-chunks.tsv
 */

import { importChunksFromTSV } from "@/lib/import-chunks";
import { join } from "node:path";

const filepath = process.argv[2] || join(process.cwd(), "data/document-chunks.tsv");

console.log(`Importing chunks from: ${filepath}\n`);

try {
	await importChunksFromTSV(filepath);
	console.log("\n✅ Import completed successfully!");
	process.exit(0);
} catch (error) {
	console.error("\n❌ Import failed:");
	console.error(error);
	process.exit(1);
}
