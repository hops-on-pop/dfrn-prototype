"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { z } from "zod/v4";
import Markdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const sourceSchema = z.object({
	title: z.string(),
	sectionTitle: z.string().nullable(),
	url: z.string().nullable(),
});

const messageMetadataSchema = z.object({
	sources: z.array(sourceSchema).optional(),
});

type MessageMetadata = z.infer<typeof messageMetadataSchema>;
type ChatMessage = UIMessage<MessageMetadata>;

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function KioskChat() {
	const {
		messages,
		sendMessage,
		setMessages,
		status,
		error,
	} = useChat<ChatMessage>({
		messageMetadataSchema,
	});

	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	const isLoading = status === "submitted" || status === "streaming";

	const resetSession = useCallback(() => {
		setMessages([]);
		setInput("");
		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
			inactivityTimer.current = null;
		}
	}, [setMessages]);

	// Reset inactivity timer on any interaction
	const resetInactivityTimer = useCallback(() => {
		if (inactivityTimer.current) {
			clearTimeout(inactivityTimer.current);
		}
		inactivityTimer.current = setTimeout(resetSession, INACTIVITY_TIMEOUT_MS);
	}, [resetSession]);

	// Start inactivity timer when messages exist
	useEffect(() => {
		if (messages.length > 0) {
			resetInactivityTimer();
		}
		return () => {
			if (inactivityTimer.current) {
				clearTimeout(inactivityTimer.current);
			}
		};
	}, [messages, resetInactivityTimer]);

	// Auto-scroll to bottom when messages update
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Focus input after assistant response finishes
	useEffect(() => {
		if (status === "ready" && messages.length > 0) {
			inputRef.current?.focus();
		}
	}, [status, messages.length]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;

		sendMessage({ text: trimmed });
		setInput("");
		resetInactivityTimer();
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="flex min-h-dvh flex-col bg-background">
			{/* Header */}
			<header className="shrink-0 border-b bg-primary px-6 py-5">
				<h1 className="text-center text-2xl font-bold text-primary-foreground md:text-3xl">
					Digital Family Resource Navigator
				</h1>
				<p className="mt-1 text-center text-base text-primary-foreground/80">
					Ask a question about our programs, services, and resources.
				</p>
			</header>

			{/* Messages area */}
			<main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
				<div className="mx-auto max-w-2xl space-y-4">
					{messages.length === 0 && (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<p className="text-xl text-muted-foreground md:text-2xl">
								How can we help you today?
							</p>
							<p className="mt-2 text-base text-muted-foreground/70">
								Type your question below to get started.
							</p>
						</div>
					)}

					{messages.map((message) => (
						<MessageBubble key={message.id} message={message} />
					))}

					{isLoading && messages[messages.length - 1]?.role === "user" && (
						<div className="flex justify-start">
							<div className="rounded-2xl bg-muted px-5 py-4">
								<div className="flex items-center gap-1.5">
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
								</div>
							</div>
						</div>
					)}

					{error && (
						<Card className="border-destructive/50 bg-destructive/5">
							<CardContent>
								<p className="text-base text-destructive">
									Something went wrong. Please try again or ask a staff member
									for help.
								</p>
							</CardContent>
						</Card>
					)}

					<div ref={messagesEndRef} />
				</div>
			</main>

			{/* Input area */}
			<footer className="shrink-0 border-t bg-card px-4 py-4 md:px-8">
				<div className="mx-auto flex max-w-2xl items-center gap-3">
					<form onSubmit={handleSubmit} className="flex flex-1 items-center gap-3">
						<textarea
							ref={inputRef}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type your question here..."
							rows={1}
							disabled={isLoading}
							className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-lg placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 md:text-xl"
						/>
						<Button
							type="submit"
							size="lg"
							disabled={isLoading || !input.trim()}
							className="h-12 px-6 text-lg"
						>
							Ask
						</Button>
					</form>
					{messages.length > 0 && (
						<Button
							type="button"
							variant="outline"
							size="lg"
							onClick={resetSession}
							className="h-12 shrink-0 px-4 text-base"
						>
							Start Over
						</Button>
					)}
				</div>
			</footer>
		</div>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	const metadata = message.metadata as MessageMetadata | undefined;
	const sources = metadata?.sources;

	// Extract text from parts
	const text = message.parts
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("");

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-5 py-4 ${
					isUser
						? "bg-primary text-primary-foreground"
						: "bg-muted text-foreground"
				}`}
			>
				{isUser ? (
					<p className="whitespace-pre-wrap text-base leading-relaxed md:text-lg">
						{text}
					</p>
				) : (
					<div className="markdown-content text-base leading-relaxed md:text-lg">
						<Markdown>{text}</Markdown>
					</div>
				)}

				{/* Sources */}
				{!isUser && sources && sources.length > 0 && (
					<div className="mt-3 border-t border-foreground/10 pt-3">
						<p className="mb-1.5 text-sm font-medium text-muted-foreground">
							Sources:
						</p>
						<ul className="space-y-1">
							{sources.map((source, i) => (
								<li key={`${source.title}-${i}`} className="text-sm">
									{source.url ? (
										<a
											href={source.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary underline underline-offset-2 hover:text-primary/80"
										>
											{source.title}
										</a>
									) : (
										<span className="text-muted-foreground">
											{source.title}
										</span>
									)}
									{source.sectionTitle && (
										<span className="text-muted-foreground">
											{" "}
											&mdash; {source.sectionTitle}
										</span>
									)}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
