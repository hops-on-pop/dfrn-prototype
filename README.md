# Resource Navigator

A simple, kiosk-friendly question-answering application that helps users find information from a collection of documents using AI-powered search and natural language responses.

## What This App Does

This application uses **Retrieval-Augmented Generation (RAG)** to answer user questions based on a knowledge base of documents. When you ask a question:

1. The app searches through documents to find relevant information
2. It uses AI to generate an answer based only on what's found in those documents
3. It shows you the sources so you can verify the information

The interface is optimized for public kiosks with large buttons, simple navigation, and no authentication needed.

## Tech Stack

- **Frontend**: Next.js with React
- **Database**: PostgreSQL with vector search (pgvector)
- **AI**: OpenAI API for embeddings and chat
- **Styling**: Tailwind CSS and shadcn/ui components

---

## Getting Started

### Prerequisites

- **Bun** installed ([get Bun](https://bun.sh))
- A PostgreSQL database with pgvector enabled
- An OpenAI API key

### 1. Clone and Install

```bash
git clone <repo-url>
cd dfrn-prototype
bun install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
OPENAI_API_KEY=sk-your-api-key-here
```

Refer to `.env.example` for all available options.

### 3. Set Up the Database

```bash
bun db:push
# Creates the necessary tables
```

### 4. Load Your Documents

Prepare a TSV file with your documents and generate embeddings using the data ingestion script (see `scripts/` directory for details).

### 5. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

1. Visit the app in your browser
2. Type or speak a question
3. The app searches documents and generates an answer
4. Sources are displayed so you know where the information came from
5. Ask another question or the app resets after a period of inactivity

---

## Project Structure

- `src/app/` - Next.js pages and layouts
- `src/components/` - React components
- `src/lib/` - Utilities (database, vector search, API calls)
- `database/` - Drizzle schema and migrations

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [PostgreSQL pgvector](https://github.com/pgvector/pgvector)
