"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

type Source = {
  filename: string;
  chunk_id: string;
  content: string;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/+$/, "");

const suggestions = [
  "How much paid vacation do full-time employees receive?",
  "Compare the WattWatch One and WattWatch Pro.",
  "What should I do if my WattWatch One stops reporting?",
];

function isSource(value: unknown): value is Source {
  if (typeof value !== "object" || value === null) return false;
  const source = value as Record<string, unknown>;
  return (
    typeof source.filename === "string" &&
    typeof source.chunk_id === "string" &&
    typeof source.content === "string"
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [question]);

  async function sendQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setQuestion("");
    setError("");
    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      content: trimmed,
    };
    setMessages((current) => [...current, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(
          response.ok
            ? "The backend returned an invalid response."
            : `The backend returned an error (${response.status}) without a readable message.`,
        );
      }
      if (!response.ok) {
        const detail =
          typeof payload === "object" &&
          payload !== null &&
          "detail" in payload &&
          typeof payload.detail === "string"
            ? payload.detail
            : `The backend returned an error (${response.status}).`;
        throw new Error(detail);
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        !("answer" in payload) ||
        typeof payload.answer !== "string" ||
        !("sources" in payload) ||
        !Array.isArray(payload.sources) ||
        !payload.sources.every(isSource)
      ) {
        throw new Error("The backend returned an unexpected response.");
      }

      const assistantMessage: Message = {
        id: nextId.current++,
        role: "assistant",
        content: payload.answer,
        sources: payload.sources,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Something went wrong while contacting the assistant.";
      setError(message);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendQuestion(question);
    }
  }

  function resetConversation() {
    setMessages([]);
    setQuestion("");
    setError("");
    textareaRef.current?.focus();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Asterion Assist home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">asterion<span>assist</span></span>
        </Link>
        <div className="topbar-right">
          <span className="knowledge-label">Company knowledge</span>
          <button
            className="reset-button"
            type="button"
            onClick={resetConversation}
            disabled={isLoading || (messages.length === 0 && !error)}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <span aria-hidden="true">↺</span>
            <span className="reset-label">New chat</span>
          </button>
        </div>
      </header>

      <section className="chat-layout" aria-label="Asterion Assist chat">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon" aria-hidden="true">
              <span className="spark spark-one">✦</span>
              <span className="spark spark-two">✧</span>
              <span className="welcome-orbit">a</span>
            </div>
            <p className="eyebrow">YOUR COMPANY, WITH CLARITY</p>
            <h1>What can I help<br />you find?</h1>
            <p className="welcome-copy">
              Ask about Asterion Works policies, products, and support. Answers
              are grounded in your company documents.
            </p>
            <div className="suggestions" aria-label="Suggested questions">
              {suggestions.map((suggestion, index) => (
                <button
                  className="suggestion"
                  key={suggestion}
                  type="button"
                  onClick={() => void sendQuestion(suggestion)}
                  disabled={isLoading}
                >
                  <span className="suggestion-number">0{index + 1}</span>
                  <span>{suggestion}</span>
                  <span className="suggestion-arrow" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="conversation" aria-live="polite">
            {messages.map((message) => (
              <article
                className={`message message-${message.role}`}
                key={message.id}
              >
                <div className="message-avatar" aria-hidden="true">
                  {message.role === "user" ? "Y" : "a"}
                </div>
                <div className="message-body">
                  <p className="message-label">
                    {message.role === "user" ? "YOU" : "ASTERION ASSIST"}
                  </p>
                  <p className="message-content">{message.content}</p>
                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="sources">
                        <p className="sources-heading">
                          <span aria-hidden="true">⌕</span>
                          SOURCES <span className="source-count">{message.sources.length}</span>
                        </p>
                        {message.sources.map((source, index) => (
                          <details className="source-card" key={`${source.filename}-${source.chunk_id}-${index}`}>
                            <summary>
                              <span className="file-icon" aria-hidden="true">
                                {source.filename.split(".").pop()?.toUpperCase() ?? "DOC"}
                              </span>
                              <span className="source-filename">{source.filename}</span>
                              <span className="source-chunk">CHUNK {source.chunk_id}</span>
                              <span className="source-expand" aria-hidden="true">⌄</span>
                            </summary>
                            <p className="source-excerpt">{source.content}</p>
                          </details>
                        ))}
                      </div>
                    )}
                </div>
              </article>
            ))}
            {isLoading && (
              <div className="message message-assistant loading-message" role="status">
                <div className="message-avatar" aria-hidden="true">a</div>
                <div className="message-body">
                  <p className="message-label">ASTERION ASSIST</p>
                  <div className="typing-indicator" aria-label="Finding an answer">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="request-error" role="alert">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>We couldn&apos;t get an answer</strong>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => void sendQuestion(messages.at(-1)?.content ?? "")}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="composer-area">
          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="question-input">Ask Asterion Assist</label>
            <textarea
              id="question-input"
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about Asterion Works..."
              rows={1}
              maxLength={2000}
              disabled={isLoading}
            />
            <div className="composer-footer">
              <span className="composer-hint">
                <kbd>↵</kbd> to send <span className="hint-divider">·</span> <kbd>shift + ↵</kbd> for a new line
              </span>
              <button
                className="send-button"
                type="submit"
                disabled={!question.trim() || isLoading}
                aria-label="Send question"
              >
                <span>{isLoading ? "Thinking" : "Ask"}</span>
                <span aria-hidden="true">↑</span>
              </button>
            </div>
          </form>
          <p className="disclaimer">
            Answers are generated from company documents and may not cover every situation.
          </p>
        </div>
      </section>
      <footer className="footer">
        <span>ASTERION WORKS</span>
        <span>INTERNAL KNOWLEDGE ASSISTANT</span>
      </footer>
    </main>
  );
}
