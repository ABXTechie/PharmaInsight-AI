import api from "./api";

export const chatWithAI = async (message) => {
  const response = await api.post("/ai/chat", {
    message,
  });

  return response.data.message;
};

export const streamChatWithAI = async (message, onChunk, onComplete) => {
  const token = localStorage.getItem("token");

  const baseURL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  const response = await fetch(`${baseURL}/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Unable to get a response from AI.";

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Keep default error message
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported by the server.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data: ")) continue;

      const data = JSON.parse(event.slice(6));

      if (data.type === "chunk") {
        onChunk(data.text);
      }

      if (data.type === "error") {
        throw new Error(data.message);
      }

      if (data.type === "done") {
        onComplete?.();
      }
    }
  }

  onComplete?.();
};

export const getAIInsights = async () => {
  const response = await api.post("/ai/insights");

  return response.data.insights;
};