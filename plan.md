# Digital Family Resource Navigator – Development Plan

This file defines concrete development tasks and milestones.
Tasks should be marked ✅ when completed.

---

## 0. Project Assumptions

- Bun runtime
- No authentication
- English only
- Anonymous usage

---

## 1. Environment & Config

- ✅ Define required environment variables
  - ✅ `DATABASE_URL`
  - ✅ `OPENAI_API_KEY`
- ✅ Ensure app runs locally with Bun
- ✅ Add `.env.example`

---

## 2. Database Schema (Drizzle)

- ✅ Define Drizzle schema for documents
  - ✅ `id`
  - ✅ `title`
  - ✅ `source_url` (nullable)
- ✅ Define Drizzle schema for text chunks
  - ✅ `id`
  - ✅ `document_id` (FK)
  - ✅ `content`
  - ✅ `embedding` (pgvector)
- ✅ Export schema and migration setup
- ✅ Ensure schema does not assume a specific DB host

---

## 3. Vector Search Utilities

- [ ] Create reusable vector search function
  - [ ] Accept query embedding
  - [ ] Return top N matching chunks
- [ ] Keep logic DB-agnostic except for pgvector usage

---

## 4. Document Ingestion Pipeline (Manual)

- [ ] Create shell tsv file for document chunks, metadata, and embeddings
- [ ] Generate embeddings using OpenAI
- [ ] Insert documents + chunks into DB
- [ ] Script must be re-runnable without duplication

### Hold for now

- [ ] Create ingestion script (non-UI)
  - [ ] Load text files or extracted PDF text
  - [ ] Chunk text into reasonable sizes
  - [ ] Attach document metadata

---

## 5. RAG Question Answering API

- [ ] Create server-side API or server action for Q&A
- [ ] Steps per request:
  - [ ] Accept user question
  - [ ] Generate embedding for question
  - [ ] Retrieve top matching chunks
  - [ ] Construct grounded prompt
  - [ ] Call OpenAI chat model
- [ ] Response must include:
  - [ ] Generated answer
  - [ ] Source document names + links (if available)
- [ ] If no relevant chunks found, return safe fallback response

---

## 6. Prompting & Guardrails

- [ ] System prompt enforces:
  - [ ] Reference-only behavior
  - [ ] No guessing or hallucination
  - [ ] No personalized advice
  - [ ] No crisis or sensitive handling
- [ ] Responses must defer to staff when appropriate

---

## 7. Frontend – Kiosk UI

- [ ] Full-screen, touch-optimized layout
- [ ] Large typography and buttons
- [ ] Simple single-question input flow
- [ ] Display answer clearly
- [ ] Display sources below answer
- [ ] “Ask another question” action
- [ ] Reset session after inactivity or button press

---

## 8. Frontend – State & UX

- [ ] Maintain short-lived conversation context (session only)
- [ ] No persistence across reloads
- [ ] No user identification or tracking
- [ ] Graceful loading and error states

---

## 9. Styling & UI Components

- [ ] Tailwind v4 styles applied
- [ ] Use shadcn/ui components where appropriate
- [ ] Ensure mobile responsiveness (phone)

---

## 10. Error Handling & Fallbacks

- [ ] Handle OpenAI API errors
- [ ] Handle empty or low-confidence retrieval
- [ ] Display staff referral message when needed

---

## 11. Final Validation

- [ ] App builds successfully
- [ ] App runs without DB host hardcoding
- [ ] RAG answers are grounded in documents
- [ ] No auth, no PII, no logging of user input
- [ ] Ready for kiosk deployment testing

---

## 12. Explicitly Out of Scope

- Multilingual UI
- User accounts or personalization
- Admin dashboards
- Automated PDF extraction
- Analytics or tracking
- Cloud ingestion pipelines

---
