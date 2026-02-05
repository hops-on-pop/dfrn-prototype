CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(512) NOT NULL,
	"source_url" text
);
--> statement-breakpoint
CREATE TABLE "text_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "text_chunks" ADD CONSTRAINT "text_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "text_chunks_embedding_idx" ON "text_chunks" USING hnsw ("embedding" vector_cosine_ops);