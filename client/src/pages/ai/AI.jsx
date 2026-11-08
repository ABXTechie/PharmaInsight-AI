import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { streamChatWithAI } from "../../services/aiService";
import ReactMarkdown from "react-markdown";
import Icon from "../../components/ui/Icon";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/format";

const quickQuestions = [
  "How are my sales performing?",
  "Which customers should I call this week?",
  "Who stopped buying something they used to order?",
  "Which products are doing well or badly?",
];

const questionIcons = ["trend", "users", "alert", "pill"];

// Turns sent with each question so follow-ups keep their context
const HISTORY_TURNS = 10;

const chatStorageKey = (user) => `pi.chat.${user?._id || user?.email || "me"}`;

const readStoredChat = (key) => {
  try {
    const stored = JSON.parse(sessionStorage.getItem(key));
    return Array.isArray(stored) ? stored.filter((m) => m?.content) : [];
  } catch {
    return [];
  }
};

const markdownComponents = {
  h1: ({ children }) => (
    <h3 className="mb-2 mt-4 text-[15px] font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-2 mt-4 text-[15px] font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-[15px] font-semibold text-slate-900 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 marker:text-mint-500 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 marker:font-medium marker:text-slate-400 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs last:mb-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-mint-300 pl-3 text-slate-600 last:mb-0">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
};

const AssistantAvatar = () => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-mint-400">
    <Icon name="sparkles" className="h-4 w-4" />
  </span>
);

const AI = () => {
  const { user } = useAuth();
  const storageKey = chatStorageKey(user);
  const [searchParams] = useSearchParams();

  // Conversation survives navigating away and back (cleared by "New chat")
  const [messages, setMessages] = useState(() => readStoredChat(storageKey));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // ?q= pre-fills the composer (e.g. "Ask AI" from a customer page)
  const [message, setMessage] = useState(() => searchParams.get("q") || "");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // Persist completed conversation for this browser session
  useEffect(() => {
    if (loading) return;
    sessionStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, loading, storageKey]);

  const handleNewChat = () => {
    setMessages([]);
    setError("");
    sessionStorage.removeItem(storageKey);
    inputRef.current?.focus();
  };

  // Auto-size the composer to its content
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [message]);

  const handleSendMessage = async (text = message) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) return;

    setError("");

    // Recent completed turns, so follow-up questions keep their context
    const history = messages
      .filter((m) => m.content?.trim())
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      await streamChatWithAI(
        trimmedMessage,
        (chunk) => {
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessageIndex = updatedMessages.length - 1;

            updatedMessages[lastMessageIndex] = {
              ...updatedMessages[lastMessageIndex],
              content:
                updatedMessages[lastMessageIndex].content + chunk,
            };

            return updatedMessages;
          });
        },
        () => {
          setLoading(false);
        },
        history
      );
    } catch (error) {
      setLoading(false);

      setMessages((prev) => {
        const updatedMessages = [...prev];

        // Remove the empty/partial assistant message
        if (
          updatedMessages[updatedMessages.length - 1]?.role ===
          "assistant"
        ) {
          updatedMessages.pop();
        }

        return updatedMessages;
      });

      setError(
        error.message || "Unable to get a response from AI."
      );
    }
  };

  const handleKeyDown = (event) => {
    // Enter sends (as before); Shift+Enter inserts a new line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-4rem)] flex-col sm:-mx-6 sm:-my-8 lg:-mx-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AssistantAvatar />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold text-slate-900">
              PharmaInsight AI
            </h1>
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
              Your intelligent sales business assistant
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500 md:inline-flex">
            <Icon name="shield" className="h-3.5 w-3.5 text-blue-600" />
            Grounded in your sales & buying patterns
          </span>
          {hasConversation && (
            <button
              type="button"
              onClick={handleNewChat}
              disabled={loading}
              className="btn-secondary px-3 py-1.5 text-xs"
            >
              <Icon name="plus" className="h-3.5 w-3.5" />
              New chat
            </button>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          {!hasConversation ? (
            <div className="flex min-h-full animate-fade-in flex-col items-center pt-6 text-center sm:pt-12">
              <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-mint-400 shadow-pop">
                <Icon name="sparkles" className="h-6 w-6" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Ask PharmaInsight AI
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Ask questions about your sales, customers, products, and
                business performance.
              </p>

              <div className="mt-8 w-full">
                <p className="eyebrow mb-3 text-left">Quick Questions</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => handleSendMessage(question)}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm text-slate-700 shadow-card transition hover:border-mint-200 hover:bg-mint-50/40"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition group-hover:bg-mint-100 group-hover:text-mint-700">
                        <Icon name={questionIcons[index]} className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{question}</span>
                      <Icon name="arrowUpRight" className="h-4 w-4 text-slate-300 transition group-hover:text-mint-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ol className="space-y-7" aria-live="polite" aria-busy={loading}>
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isStreaming = loading && index === messages.length - 1 && !isUser;

                if (isUser) {
                  return (
                    <li key={index} className="flex animate-fade-in justify-end gap-3">
                      <div className="flex max-w-[88%] min-w-0 flex-col items-end sm:max-w-[80%]">
                        <span className="sr-only">You</span>
                        <div className="min-w-0 whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-ink-900 px-4 py-2.5 text-sm leading-6 text-slate-50">
                          {msg.content}
                        </div>
                      </div>
                      <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 sm:flex">
                        {initials(user?.name)}
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={index} className="flex animate-fade-in gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="mb-1.5 text-xs font-semibold text-slate-900">
                        PharmaInsight AI
                        <span className="ml-2 font-normal text-slate-400">AI-generated</span>
                      </p>

                      {isStreaming && !msg.content ? (
                        <div className="flex items-center gap-2 py-1 text-sm text-slate-500" role="status">
                          <span className="flex gap-1" aria-hidden="true">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="h-1.5 w-1.5 animate-bounce rounded-full bg-mint-500"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </span>
                          Analyzing your business data…
                        </div>
                      ) : (
                        <div className="min-w-0 break-words text-sm leading-7 text-slate-700">
                          <ReactMarkdown components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                          {isStreaming && (
                            <span
                              className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-sm bg-mint-500"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-3 sm:px-6">
          {hasConversation && (
            <div className="no-scrollbar -mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => handleSendMessage(question)}
                  disabled={loading}
                  className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-mint-200 hover:bg-mint-50 hover:text-mint-700 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-card transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50"
          >
            <label htmlFor="ai-message" className="sr-only">
              Ask about your business
            </label>
            <textarea
              id="ai-message"
              ref={inputRef}
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your business..."
              className="max-h-40 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
              style={{ outline: "none" }}
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label={loading ? "Thinking" : "Send message"}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <Icon name="refresh" className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Thinking...</span>
                </>
              ) : (
                <>
                  <Icon name="send" className="h-4 w-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            AI responses are based on your PharmaInsight business data. Enter to send · Shift+Enter for a new line.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AI;
