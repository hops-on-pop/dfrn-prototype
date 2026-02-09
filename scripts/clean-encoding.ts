#!/usr/bin/env bun

/**
 * CLI script to clean and repair TSV files
 *
 * This script fixes:
 * - Broken TSV structure (embedded newlines in fields)
 * - Replacement characters (�) from invalid UTF-8 sequences
 * - Smart quotes that should be regular quotes
 * - En/em dashes that should be hyphens
 *
 * Usage:
 *   bun scripts/clean-encoding.ts <input.tsv> [output.tsv]
 *
 * If output is not provided, creates a "-clean" version
 */

import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

function cleanFieldContent(text: string): string {
  return (
    text
      // Remove replacement characters
      .replace(/�/g, "")
      // Smart quotes to regular quotes
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      // En/em dashes to regular hyphens
      .replace(/[\u2013\u2014]/g, "-")
      // Keep bullet points, convert non-breaking spaces
      .replace(/[\u2022]/g, "•")
      .replace(/[\u00A0]/g, " ")
      // Remove any other non-printable characters
      .replace(/[^\x20-\x7E\t\n\u0080-\uFFFF]/g, "")
      // Replace newlines within fields with spaces (critical for TSV format)
      .replace(/\n+/g, " ")
      // Normalize multiple spaces
      .replace(/ +/g, " ")
      .trim()
  );
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Error: Input TSV file path is required");
    console.error(
      "\nUsage: bun scripts/clean-encoding.ts <input.tsv> [output.tsv]",
    );
    process.exit(1);
  }

  // Determine output path
  let outputPath = process.argv[3];
  if (!outputPath) {
    const dir = dirname(inputPath);
    const base = basename(inputPath, ".tsv");
    outputPath = join(dir, `${base}-clean.tsv`);
  }

  try {
    console.log(`📖 Reading input from: ${inputPath}`);
    const content = await readFile(inputPath, "utf-8");
    const lines = content.split("\n");

    console.log(`   Found ${lines.length} lines`);

    // Step 1: Repair TSV structure (merge broken rows)
    console.log("\n🔧 Step 1: Repairing TSV structure...");

    // Find header
    let headerIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("document_title")) {
        headerIndex = i;
        break;
      }
    }

    const header = lines[headerIndex];
    const expectedFields = header.split("\t").length;
    console.log(`   Expected ${expectedFields} fields per row`);

    // Merge broken rows
    const repairedRows: string[] = [];
    let currentRow = "";
    let rowsMerged = 0;

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Check if this looks like a continuation (has fewer than expected fields)
      const fields = line.split("\t");

      if (currentRow && fields.length < expectedFields) {
        // This is a continuation of the previous row
        currentRow += " " + line;
        rowsMerged++;
      } else {
        // Save the previous row if we have one
        if (currentRow) {
          repairedRows.push(currentRow);
        }
        // Start a new row
        currentRow = line;
      }
    }

    // Don't forget the last row
    if (currentRow) {
      repairedRows.push(currentRow);
    }

    if (rowsMerged > 0) {
      console.log(`   ✓ Merged ${rowsMerged} broken continuation lines`);
    } else {
      console.log(`   ✓ No structural issues found`);
    }

    // Step 2: Clean encoding issues
    console.log("\n🧹 Step 2: Cleaning encoding issues...");

    let encodingIssuesFound = 0;
    let encodingIssuesFixed = 0;

    const cleanedRows = repairedRows.map((row, index) => {
      if (row.includes("�") || /[^\x20-\x7E\t\n\u0080-\uFFFF]/.test(row)) {
        encodingIssuesFound++;
      }

      // Clean all fields in the row
      const fields = row.split("\t");
      const cleanedFields = fields.map((field) => cleanFieldContent(field));
      const cleanedRow = cleanedFields.join("\t");

      if (cleanedRow !== row) {
        encodingIssuesFixed++;
        if (index < 5) {
          // Show first few fixes
          console.log(`   ✓ Fixed encoding in row ${index + 1}`);
        }
      }

      return cleanedRow;
    });

    if (encodingIssuesFound > 0) {
      console.log(
        `   ✓ Fixed ${encodingIssuesFixed} rows with encoding issues`,
      );
    } else {
      console.log(`   ✓ No encoding issues found`);
    }

    // Write output
    const outputContent = [header, ...cleanedRows].join("\n");
    console.log(`\n💾 Writing cleaned TSV to: ${outputPath}`);
    await writeFile(outputPath, outputContent, "utf-8");

    console.log("\n✨ Success!");
    console.log(`   Rows merged: ${rowsMerged}`);
    console.log(`   Encoding issues fixed: ${encodingIssuesFixed}`);
    console.log(`   Total data rows: ${cleanedRows.length}`);
    console.log(`   Output file: ${outputPath}`);

    if (outputPath === inputPath) {
      console.log("\n⚠️  Warning: Input file was overwritten");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  }
}

main();
