import { useEffect, useRef, useState } from "react";
import { streamChatWithAI } from "../../services/aiService";
import ReactMarkdown from "react-markdown";

const quickQuestions = [
  "How are my sales performing?",
  "Who are my top customers?",
  "Which products generate the most revenue?",
  "Summarize this month's performance",
];

const AI = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSendMessage = async (text = message) => {
    const trimmedMessage = text.trim();

    if (!trimmedMessage || loading) return;

    setError("");

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
        }
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

  return (
    <div className="min-h-full overflow-x-hidden bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            PharmaInsight AI
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your intelligent sales business assistant
          </p>
        </div>

        {/* Quick Questions */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick Questions
          </h2>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleSendMessage(question)}
                className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:min-h-[500px]">
          <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-3 sm:p-5">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <h2 className="text-lg font-medium text-slate-800">
                    Ask PharmaInsight AI
                  </h2>

                  <p className="mt-2 max-w-md text-sm text-slate-500">
                    Ask questions about your sales, customers, products, and
                    business performance.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[92%] min-w-0 flex-col sm:max-w-[85%] ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="mb-1 px-1 text-xs font-medium text-slate-400">
                      {msg.role === "user" ? "You" : "PharmaInsight AI"}
                    </span>

                    <div
                      className={`min-w-0 break-words rounded-xl px-3 py-2.5 text-sm leading-6 sm:px-4 sm:py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <>
                          <ReactMarkdown
                            components={{
                              h3: ({ children }) => (
                                <h3 className="mb-2 text-base font-semibold text-slate-900">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2 list-disc space-y-1 pl-5">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-2 list-decimal space-y-1 pl-5">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => (
                                <strong className="font-semibold">{children}</strong>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          {loading &&
                            index === messages.length - 1 &&
                            msg.role === "assistant" && (
                              <span className="ml-1 inline-block animate-pulse">▋</span>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your business..."
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:px-4"
              />

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                {loading ? "Thinking..." : "Send"}
              </button>
            </form>
          </div>
        </div>

        {/* Data Grounding Notice */}
        <p className="text-center text-xs text-slate-400">
          AI responses are based on your PharmaInsight business data.
        </p>
      </div>
    </div>
  );
};

export default AI;