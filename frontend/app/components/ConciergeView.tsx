"use client";

import { FormEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BottomNav from "@/app/components/BottomNav";
import DesktopSidebar from "@/app/components/DesktopSidebar";
import Header from "@/app/components/Header";
import { useSaved } from "@/app/components/SavedProvider";
import {
  type ConciergeApproval,
  type ConciergeResponse,
  type ConciergeToolCall,
  streamConciergeMessage,
  streamConciergeSaveResolution,
} from "@/app/data/concierge";
import pageStyles from "@/app/page.module.css";
import styles from "./ConciergeView.module.css";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "Free family events in Queens this weekend",
  "Outdoor events that do not require registration",
] as const;

export default function ConciergeView() {
  const saved = useSaved();
  const nextMessageId = useRef(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [approval, setApproval] = useState<ConciergeApproval | null>(null);
  const [toolCalls, setToolCalls] = useState<ConciergeToolCall[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendMessage = (role: ChatMessage["role"], content: string) => {
    const id = nextMessageId.current++;
    setMessages((current) => [...current, { id, role, content }]);
    return id;
  };

  const appendAssistantToken = (id: number, text: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, content: message.content + text }
          : message,
      ),
    );
  };

  const acceptResponse = (
    response: ConciergeResponse,
    streamedMessageId: number | null,
  ) => {
    setConversationId(response.conversationId);
    if (streamedMessageId !== null && response.response) {
      setMessages((current) =>
        current.map((message) =>
          message.id === streamedMessageId
            ? { ...message, content: response.response ?? message.content }
            : message,
        ),
      );
    } else if (response.response) {
      appendMessage("assistant", response.response);
    }
    setApproval(response.approval);
  };

  const updateToolCall = (toolCall: ConciergeToolCall) => {
    setToolCalls((current) => {
      const existing = current.findIndex((item) => item.id === toolCall.id);
      if (existing === -1) return [...current, toolCall];
      return current.map((item, index) =>
        index === existing ? { ...item, ...toolCall } : item,
      );
    });
  };

  const send = async (prompt: string) => {
    const message = prompt.trim();
    if (!message || busy || approval) return;
    setBusy(true);
    setError(null);
    setToolCalls([]);
    appendMessage("user", message);
    setInput("");
    let streamedMessageId: number | null = null;
    try {
      const response = await streamConciergeMessage(message, conversationId, {
        onConversation: setConversationId,
        onToken: (text) => {
          if (streamedMessageId === null) {
            streamedMessageId = appendMessage("assistant", "");
          }
          appendAssistantToken(streamedMessageId, text);
        },
        onTool: updateToolCall,
      });
      acceptResponse(response, streamedMessageId);
      if (!response.response && !response.approval) {
        throw new Error("The concierge did not return an answer.");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The concierge is unavailable right now.",
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(input);
  };

  const decide = async (decision: "approve" | "reject") => {
    if (!approval || !conversationId || busy) return;
    setBusy(true);
    setError(null);
    setToolCalls([]);
    let streamedMessageId: number | null = null;
    try {
      const response = await streamConciergeSaveResolution(
        conversationId,
        approval,
        decision,
        {
          onConversation: setConversationId,
          onToken: (text) => {
            if (streamedMessageId === null) {
              streamedMessageId = appendMessage("assistant", "");
            }
            appendAssistantToken(streamedMessageId, text);
          },
          onTool: updateToolCall,
        },
      );
      if (!response.response && !response.approval) {
        throw new Error("The concierge did not return an answer.");
      }
      setApproval(null);
      acceptResponse(response, streamedMessageId);
      if (decision === "approve") saved?.reload();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The approval could not be resolved.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${pageStyles.appLayout} app-page`}>
      <a className="skip-link" href="#main-content">
        Skip to concierge
      </a>
      <DesktopSidebar />
      <div className={pageStyles.mainArea}>
        <Header />
        <main
          id="main-content"
          className={`${pageStyles.mainContent} ${styles.main}`}
          tabIndex={-1}
        >
          <section className={styles.hero} aria-labelledby="concierge-title">
            <span className={styles.eyebrow}>
              Grounded in current NYC Parks data
            </span>
            <h2 id="concierge-title">Event Concierge</h2>
            <p>
              Describe what you are looking for. I can search the latest event
              snapshot and ask before saving anything to your plans.
            </p>
          </section>

          <section className={styles.chat} aria-label="Concierge conversation">
            <div
              className={styles.messages}
              aria-live="polite"
              aria-busy={busy}
              data-testid="concierge-messages"
            >
              {messages.length === 0 ? (
                <div className={styles.welcome}>
                  <p>Try a plain-language search:</p>
                  <div className={styles.prompts}>
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void send(prompt)}
                        disabled={busy}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={`${styles.message} ${
                      message.role === "user"
                        ? styles.userMessage
                        : styles.assistantMessage
                    }`}
                    data-role={message.role}
                  >
                    <span>{message.role === "user" ? "You" : "Concierge"}</span>
                    {message.role === "user" ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className={styles.markdown}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </article>
                ))
              )}
              {toolCalls.length > 0 ? (
                <div className={styles.toolCalls} aria-label="Tool activity">
                  {toolCalls.map((toolCall) => (
                    <div
                      key={toolCall.id}
                      className={styles.toolCall}
                      data-testid="concierge-tool-call"
                      data-status={toolCall.status}
                    >
                      <span className={styles.toolCallLabel}>Tool</span>
                      <span>{toolCall.name}</span>
                      <span className={styles.toolCallStatus}>
                        {toolCall.status === "started"
                          ? "Running"
                          : toolCall.status === "completed"
                            ? "Completed"
                            : "Could not complete"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {busy ? (
                <p className={styles.thinking}>Concierge is thinking…</p>
              ) : null}
            </div>

            {approval ? (
              <section
                className={styles.approval}
                aria-labelledby="save-approval-title"
                data-testid="save-approval"
              >
                <div>
                  <span className={styles.approvalLabel}>
                    Approval required
                  </span>
                  <h3 id="save-approval-title">
                    {approval.events.length === 1
                      ? "Save this event?"
                      : `Save these ${approval.events.length} events?`}
                  </h3>
                  {approval.events.length === 1 ? (
                    <>
                      <p>{approval.description}</p>
                      <code>{approval.eventId}</code>
                    </>
                  ) : (
                    <ul className={styles.approvalEvents}>
                      {approval.events.map((event) => (
                        <li key={event.eventId}>
                          <span>{event.description}</span>
                          <code>{event.eventId}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={styles.approvalActions}>
                  <button
                    type="button"
                    className={styles.rejectButton}
                    onClick={() => void decide("reject")}
                    disabled={busy}
                  >
                    Don&apos;t save
                  </button>
                  <button
                    type="button"
                    className={styles.approveButton}
                    onClick={() => void decide("approve")}
                    disabled={busy}
                  >
                    Approve save
                  </button>
                </div>
              </section>
            ) : null}

            {error ? (
              <div className={styles.error} role="alert">
                <p>{error}</p>
              </div>
            ) : null}

            <form className={styles.composer} onSubmit={submit}>
              <label htmlFor="concierge-message">
                Ask about current events
              </label>
              <div className={styles.composerRow}>
                <textarea
                  ref={inputRef}
                  id="concierge-message"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  maxLength={2000}
                  rows={2}
                  placeholder="For example: free nature events in Brooklyn tomorrow"
                  disabled={busy || approval !== null}
                />
                <button
                  type="submit"
                  disabled={
                    busy || approval !== null || input.trim().length === 0
                  }
                >
                  Send
                </button>
              </div>
              <p className={styles.composerHint}>
                Event facts come from the latest stored snapshot. Verify details
                with the official listing before you go.
              </p>
            </form>
          </section>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
