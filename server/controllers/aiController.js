import asyncHandler from "express-async-handler";
import { generateAIResponse, generateAIResponseStream,generateAIInsights } from "../services/aiService.js";
import { generateWeeklyBrief, generateTalkingPoints } from "../services/aiPatternService.js";

export const chatWithAI = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message || !message.trim()) {
    res.status(400);
    throw new Error("Message is required");
  }

  const response = await generateAIResponse(message, req.user._id, history);

  res.status(200).json({
    message: response,
  });
});

export const streamChatWithAI = async (req, res) => {
  // history (optional): recent [{ role: "user" | "assistant", content }] turns
  const { message, history } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      message: "Message is required",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = generateAIResponseStream(
      message,
      req.user._id,
      history
    );

    for await (const chunk of stream) {
      res.write(
        `data: ${JSON.stringify({
          type: "chunk",
          text: chunk,
        })}\n\n`
      );
    }

    res.write(
      `data: ${JSON.stringify({
        type: "done",
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error("AI Streaming Controller Error:", error);

    res.write(
      `data: ${JSON.stringify({
        type: "error",
        message:
          error.statusCode === 429
            ? "AI is temporarily unavailable because the AI usage limit has been reached. Please try again later."
            : "AI is temporarily unavailable. Please try again later.",
      })}\n\n`
    );

    res.end();
  }
};

export const getAIInsights = async (req, res) => {
  try {
    const insights = await generateAIInsights(req.user._id);

    res.status(200).json({
      insights,
    });
  } catch (error) {
    console.error("AI Insights Controller Error:", error);

    res.status(error.statusCode || 500).json({
      message:
        error.message ||
        "Unable to generate AI insights.",
    });
  }
};

// Weekly brief: AI explanation of the current pattern signals
export const getWeeklyBrief = async (req, res) => {
  try {
    const brief = await generateWeeklyBrief(req.user._id);

    res.status(200).json(brief);
  } catch (error) {
    console.error("AI Brief Controller Error:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Unable to generate the weekly brief.",
    });
  }
};

// Talking points for a call or visit with one customer
export const getTalkingPoints = async (req, res) => {
  try {
    const talkingPoints = await generateTalkingPoints(req.user._id, req.params.id);

    res.status(200).json(talkingPoints);
  } catch (error) {
    console.error("AI Talking Points Controller Error:", error);

    res.status(error.statusCode || 500).json({
      message: error.message || "Unable to generate talking points.",
    });
  }
};
