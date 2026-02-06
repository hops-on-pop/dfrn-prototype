#!/usr/bin/env bun

/**
 * CLI script to import document chunks from a TSV file
 * 
 * Usage:
 *   bun scripts/import.ts [path-to-tsv] [--update]
 * 
 * Options:
 *   --update    Update existing chunks instead of skipping them
 * 
 * If no path is provided, defaults to data/document-chunks.tsv
 */

import { importChunksFromTSV } from "@/lib/import-chunks";
import { join } from "node:path";

// Parse arguments
const args = process.argv.slice(2);
const updateMode = args.includes("--update");
const filepath = args.find((arg) => !arg.startsWith("--")) || join(process.cwd(), "data/document-chunks.tsv");

console.log(`Importing chunks from: ${filepath}`);
console.log(`Mode: ${updateMode ? "UPDATE (will replace existing chunks)" : "INSERT (will skip existing chunks)"}\n`);

try {
	await importChunksFromTSV(filepath, { updateExisting: updateMode });
	console.log("\n✅ Import completed successfully!");
	process.exit(0);
} catch (error) {
	console.error("\n❌ Import failed:");
	console.error(error);
	process.exit(1);
}
