"use client";

import { useState } from "react";

interface Step {
  id: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Arrow {
  from: string;
  to: string;
  type?: "cross";
}

interface Center {
  cx: number;
  cy: number;
}

const steps: Step[] = [
  {
    id: "docs",
    label: "📚 School Documents",
    description:
      "School policies, handbooks, calendars, FAQs, and announcements are collected as source documents.",
    color: "#2D6A4F",
    bg: "#D8F3DC",
    x: 50,
    y: 38,
    w: 200,
    h: 72,
  },
  {
    id: "chunk",
    label: "✂️ Chunking",
    description:
      "Documents are split into smaller, meaningful pieces (chunks) — like individual policy sections or Q&A pairs — so they can be searched efficiently.",
    color: "#1B4332",
    bg: "#B7E4C7",
    x: 50,
    y: 148,
    w: 200,
    h: 72,
  },
  {
    id: "embed-docs",
    label: "🧮 Embedding Model",
    description:
      'Each chunk is converted into a list of numbers called an "embedding" — a mathematical fingerprint that captures the meaning of the text, not just the exact words.',
    color: "#3A0CA3",
    bg: "#DDD5F3",
    x: 50,
    y: 258,
    w: 200,
    h: 72,
  },
  {
    id: "vectordb",
    label: "🗄️ Vector Database",
    description:
      "Embeddings are stored in a special database that can quickly find chunks with similar meanings. Think of it like a smart filing cabinet organized by topic.",
    color: "#3A0CA3",
    bg: "#C9B8F0",
    x: 50,
    y: 368,
    w: 200,
    h: 72,
  },
  {
    id: "user",
    label: "👋 User Asks a Question",
    description:
      'A parent or student types a question like "What is the dress code?" or "When is the next parent-teacher conference?"',
    color: "#9D4100",
    bg: "#FFE0B2",
    x: 370,
    y: 38,
    w: 220,
    h: 72,
  },
  {
    id: "embed-q",
    label: "🧮 Question → Embedding",
    description:
      "The user's question is also turned into an embedding using the same model, so it can be compared to the stored document chunks.",
    color: "#3A0CA3",
    bg: "#DDD5F3",
    x: 370,
    y: 148,
    w: 220,
    h: 72,
  },
  {
    id: "search",
    label: "🔍 Similarity Search",
    description:
      "The vector database finds the chunks whose embeddings are most similar to the question's embedding — meaning the most relevant school info is retrieved.",
    color: "#7B2CBF",
    bg: "#E8D5F5",
    x: 370,
    y: 258,
    w: 220,
    h: 72,
  },
  {
    id: "context",
    label: "📋 Build Prompt + Context",
    description:
      'The retrieved chunks (e.g. the dress code section) are combined with the user\'s question into a prompt: "Using this school policy info, answer: What is the dress code?"',
    color: "#7B2CBF",
    bg: "#D4B8E8",
    x: 370,
    y: 368,
    w: 220,
    h: 72,
  },
  {
    id: "llm",
    label: "🤖 3rd-Party LLM API",
    description:
      "The prompt is sent to a large language model (like GPT or Claude) via its API. The LLM reads the context and generates a helpful, accurate answer grounded in actual school documents.",
    color: "#D00000",
    bg: "#FFD6D6",
    x: 210,
    y: 478,
    w: 220,
    h: 72,
  },
  {
    id: "answer",
    label: "💬 Answer to User",
    description:
      "The chatbot displays the LLM's answer to the parent or student, with information sourced directly from school documents — reducing hallucinations and ensuring accuracy.",
    color: "#9D4100",
    bg: "#FFE0B2",
    x: 210,
    y: 588,
    w: 220,
    h: 72,
  },
];

const arrows: Arrow[] = [
  { from: "docs", to: "chunk" },
  { from: "chunk", to: "embed-docs" },
  { from: "embed-docs", to: "vectordb" },
  { from: "user", to: "embed-q" },
  { from: "embed-q", to: "search" },
  { from: "vectordb", to: "search", type: "cross" },
  { from: "search", to: "context" },
  { from: "context", to: "llm" },
  { from: "llm", to: "answer" },
];

function getCenter(step: Step): Center {
  return { cx: step.x + step.w / 2, cy: step.y + step.h / 2 };
}

function Arrow({ from, to, type }: Arrow) {
  const f = steps.find((s) => s.id === from);
  const t = steps.find((s) => s.id === to);
  if (!f || !t) return null;
  const fc = getCenter(f);
  const tc = getCenter(t);

  if (type === "cross") {
    const startX = f.x + f.w;
    const startY = fc.cy;
    const endX = t.x;
    const endY = tc.cy;
    const midX = (startX + endX) / 2;
    return (
      <path
        d={`M${startX},${startY} C${midX},${startY} ${midX},${endY} ${endX},${endY}`}
        fill="none"
        stroke="#7B2CBF"
        strokeWidth="2.5"
        strokeDasharray="6 4"
        markerEnd="url(#arrowPurple)"
        opacity={0.7}
      />
    );
  }

  let startX: number, startY: number, endX: number, endY: number;
  if (Math.abs(fc.cy - tc.cy) > 20) {
    startX = fc.cx;
    startY = f.y + f.h;
    endX = tc.cx;
    endY = t.y;
  } else {
    startX = f.x + f.w;
    startY = fc.cy;
    endX = t.x;
    endY = tc.cy;
  }

  // For the context → llm arrow, curve it
  if (from === "context" && to === "llm") {
    return (
      <path
        d={`M${startX},${startY} Q${startX},${
          (startY + endY) / 2
        } ${endX},${endY}`}
        fill="none"
        stroke="#7B2CBF"
        strokeWidth="2.5"
        markerEnd="url(#arrowPurple)"
      />
    );
  }

  return (
    <line
      x1={startX}
      y1={startY}
      x2={endX}
      y2={endY}
      stroke={from === "llm" ? "#D00000" : "#555"}
      strokeWidth="2.5"
      markerEnd={from === "llm" ? "url(#arrowRed)" : "url(#arrowGray)"}
    />
  );
}

export default function HowItWorksPage() {
  const [active, setActive] = useState<string | null>(null);
  const activeStep = steps.find((s) => s.id === active);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FDFCFB 0%, #F0EDE8 100%)",
        fontFamily: "'Georgia', 'Cambria', serif",
        padding: "28px 12px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          fontSize: "1.55rem",
          fontWeight: 700,
          color: "#1B4332",
          textAlign: "center",
          margin: "0 0 2px",
          letterSpacing: "-0.5px",
        }}
      >
        How the School Chatbot Works
      </h1>
      <p
        style={{
          fontSize: "0.92rem",
          color: "#555",
          textAlign: "center",
          margin: "0 0 18px",
          maxWidth: 520,
          lineHeight: 1.45,
        }}
      >
        Retrieval-Augmented Generation (RAG) — click any step to learn more
      </p>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 18,
          marginBottom: 14,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { color: "#2D6A4F", label: "Document Preparation" },
          { color: "#3A0CA3", label: "Embeddings" },
          { color: "#9D4100", label: "User Interaction" },
          { color: "#7B2CBF", label: "Retrieval" },
          { color: "#D00000", label: "LLM Generation" },
        ].map((l) => (
          <div
            key={l.label}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: l.color,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: "0.78rem", color: "#444" }}>
              {l.label}
            </span>
          </div>
        ))}
      </div>

      {/* Diagram */}
      <div
        style={{
          width: "100%",
          maxWidth: 660,
          position: "relative",
        }}
      >
        <svg
          viewBox="0 0 640 690"
          style={{ width: "100%", height: "auto" }}
          aria-label="RAG process diagram showing how the school chatbot works"
        >
          <title>
            RAG process diagram showing how the school chatbot works
          </title>
          <defs>
            <marker
              id="arrowGray"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
            </marker>
            <marker
              id="arrowPurple"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#7B2CBF" />
            </marker>
            <marker
              id="arrowRed"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#D00000" />
            </marker>
            <filter id="shadow" x="-4%" y="-4%" width="108%" height="112%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodOpacity="0.10"
              />
            </filter>
          </defs>

          {/* Phase labels */}
          <text
            x="150"
            y="26"
            textAnchor="middle"
            fontSize="11.5"
            fill="#2D6A4F"
            fontWeight="700"
            fontFamily="Georgia, serif"
          >
            ① Setup (done once)
          </text>
          <text
            x="480"
            y="26"
            textAnchor="middle"
            fontSize="11.5"
            fill="#9D4100"
            fontWeight="700"
            fontFamily="Georgia, serif"
          >
            ② Every time a user asks
          </text>

          {/* Arrows */}
          {arrows.map((a) => (
            <Arrow key={a.from + a.to} {...a} />
          ))}

          {/* Step boxes */}
          {steps.map((step) => {
            const isActive = active === step.id;
            return (
              // biome-ignore lint/a11y/useSemanticElements: SVG elements cannot use button element
              <g
                key={step.id}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={() => setActive(isActive ? null : step.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(isActive ? null : step.id);
                  }
                }}
                aria-label={`${step.label} - Click to learn more`}
              >
                <rect
                  x={step.x}
                  y={step.y}
                  width={step.w}
                  height={step.h}
                  rx={14}
                  fill={step.bg}
                  stroke={isActive ? step.color : "transparent"}
                  strokeWidth={isActive ? 3 : 0}
                  filter="url(#shadow)"
                />
                <foreignObject
                  x={step.x + 10}
                  y={step.y + 8}
                  width={step.w - 20}
                  height={step.h - 16}
                >
                  <div
                    // @ts-expect-error - xmlns is required for SVG foreignObject but not in React types
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      color: step.color,
                      fontFamily: "Georgia, Cambria, serif",
                      lineHeight: 1.35,
                    }}
                  >
                    {step.label}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info panel */}
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          minHeight: 80,
          marginTop: 8,
          background: activeStep ? `${activeStep.bg}AA` : "#F5F3EF",
          border: activeStep
            ? `2px solid ${activeStep.color}40`
            : "2px dashed #CCC",
          borderRadius: 14,
          padding: "16px 22px",
          transition: "all 0.25s ease",
        }}
      >
        {activeStep ? (
          <>
            <div
              style={{
                fontWeight: 700,
                color: activeStep.color,
                fontSize: "1.05rem",
                marginBottom: 6,
              }}
            >
              {activeStep.label}
            </div>
            <div
              style={{ color: "#333", fontSize: "0.92rem", lineHeight: 1.55 }}
            >
              {activeStep.description}
            </div>
          </>
        ) : (
          <div
            style={{
              color: "#888",
              fontSize: "0.9rem",
              textAlign: "center",
              padding: "8px 0",
            }}
          >
            👆 Click any step above to see how it works
          </div>
        )}
      </div>

      {/* Key Concepts */}
      <div
        style={{
          maxWidth: 560,
          width: "100%",
          marginTop: 18,
          background: "#fff",
          borderRadius: 14,
          padding: "18px 22px",
          border: "1px solid #E0DDD8",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            color: "#1B4332",
            margin: "0 0 10px",
          }}
        >
          Key Concepts
        </h3>
        <div style={{ fontSize: "0.88rem", color: "#444", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#3A0CA3" }}>Embeddings</strong> — A way to
            turn text into numbers that capture <em>meaning</em>. "Dress code"
            and "uniform policy" would have very similar embeddings even though
            the words are different.
          </p>
          <p style={{ margin: "0 0 8px" }}>
            <strong style={{ color: "#7B2CBF" }}>RAG</strong> — Instead of the
            AI making up answers, it first <em>retrieves</em> real school
            documents, then <em>generates</em> an answer based on that info.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#D00000" }}>3rd-Party LLM API</strong> — An
            external AI service (like OpenAI or Anthropic) that reads the
            retrieved context and writes a natural-language answer. The school
            doesn't need to build its own AI — it uses an existing one via API.
          </p>
        </div>
      </div>
    </div>
  );
}
