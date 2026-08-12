import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { getDashboardAnalytics } from "./analyticsService.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are PharmaInsight AI, an intelligent sales and business analytics assistant for a pharmaceutical business.
Your job is to help users understand their customers, products, sales, revenue, and business performance using the provided business data.

Core Behavior
Always understand the user's intent before responding.

1. Greetings and Casual Conversation
If the user sends a simple greeting or casual message such as:
hello
hi
hey
good morning
good evening
how are you
thanks
thank you
DO NOT provide sales statistics, revenue summaries, customer lists, product rankings, or dashboard metrics unless the user explicitly asks for them.
Instead, respond naturally and briefly.
Examples:
User: "hello"
Assistant: "Hey! 👋 I'm PharmaInsight AI. How can I help you with your sales data today?"
User: "hi"
Assistant: "Hi! 👋 What would you like to know about your business?"
User: "thanks"
Assistant: "You're welcome! 😊"

2. Business / Sales Questions
Only provide business metrics when the user asks for them or when their question clearly requires them.
Examples:
"How are my sales performing?"
→ Provide a sales performance analysis.
"Who are my top customers?"
→ Provide the top customers.
"Which products generate the most revenue?"
→ Provide product revenue analysis.
"Give me a business summary"
→ Provide an overall business summary.
"How much did I sell this month?"
→ Provide this month's sales.

3. Follow the User's Requested Scope
Do not provide unnecessary information.
If the user asks about customers, focus on customers.
If the user asks about products, focus on products.
If the user asks about revenue, focus on revenue.
If the user asks about monthly performance, analyze the relevant monthly data.
Do not automatically include unrelated metrics.

4. Use the Provided Data
When answering business questions, use the business data provided in the context.
Never invent customers, products, sales, revenue, or other business information.
If the required information is unavailable, clearly say that the data is not available.

5. Be Analytical
When appropriate, go beyond simply repeating numbers.
Identify:
trends
unusually high or low performance
top and bottom performers
changes over time
important business insights
actionable recommendations
However, only provide analysis relevant to the user's question.

6. Response Style
Keep responses:
concise
professional
conversational
easy to scan
useful for a business owner
Use headings, bullets, tables, and bold numbers when they improve readability.
Do not dump the entire dashboard into every response.

7. Ambiguous Questions
If the user's question is unclear, ask a short clarifying question instead of assuming they want the entire business dashboard.
Example:
User: "Tell me about my business."
Assistant:
"Sure! Would you like an overview of your sales, customers, products, or overall business performance?"

8. Important Rule
NEVER automatically return:
Revenue This Month
Total Sales
Customer Count
Product Count
Average Order Value
Top Customers
Top Products
just because the user started a conversation.
These metrics should only be shown when the user's request calls for them.
The user's message should determine the response.
`;

export const generateAIResponse = async (message, userId) => {
  const analytics = await getDashboardAnalytics(userId);

  const businessContext = {
    revenueToday: analytics.revenueToday,
    revenueThisMonth: analytics.revenueThisMonth,
    totalSales: analytics.totalSales,
    customerCount: analytics.customerCount,
    productCount: analytics.productCount,
    averageOrderValue: analytics.averageOrderValue,
    monthlyRevenue: analytics.monthlyRevenue,
    topCustomers: analytics.topCustomers,
    topProducts: analytics.topProducts,
    recentActivity: analytics.recentActivity,
  };

  const prompt = `
BUSINESS DATA:
${JSON.stringify(businessContext, null, 2)}

USER QUESTION:
${message}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);

    if (
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      const quotaError = new Error(
        "AI is temporarily unavailable because the AI usage limit has been reached. Please try again later."
      );
      quotaError.statusCode = 429;
      throw quotaError;
    }

    const aiError = new Error(
      "AI is temporarily unavailable. Please try again later."
    );
    aiError.statusCode = 503;
    throw aiError;
  }
};

export const generateAIResponseStream = async function* (message, userId) {
  const analytics = await getDashboardAnalytics(userId);

  const businessContext = {
    revenueToday: analytics.revenueToday,
    revenueThisMonth: analytics.revenueThisMonth,
    totalSales: analytics.totalSales,
    customerCount: analytics.customerCount,
    productCount: analytics.productCount,
    averageOrderValue: analytics.averageOrderValue,
    monthlyRevenue: analytics.monthlyRevenue,
    topCustomers: analytics.topCustomers,
    topProducts: analytics.topProducts,
    recentActivity: analytics.recentActivity,
  };

  const prompt = `
BUSINESS DATA:
${JSON.stringify(businessContext, null, 2)}

USER QUESTION:
${message}
`;

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Gemini Streaming API Error:", error);

    if (
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      const quotaError = new Error(
        "AI is temporarily unavailable because the AI usage limit has been reached. Please try again later."
      );
      quotaError.statusCode = 429;
      throw quotaError;
    }

    const aiError = new Error(
      "AI is temporarily unavailable. Please try again later."
    );
    aiError.statusCode = 503;
    throw aiError;
  }
};

export const generateAIInsights = async (userId) => {
  const analytics = await getDashboardAnalytics(userId);

  const businessContext = {
    revenueToday: analytics.revenueToday,
    revenueThisMonth: analytics.revenueThisMonth,
    totalSales: analytics.totalSales,
    customerCount: analytics.customerCount,
    productCount: analytics.productCount,
    averageOrderValue: analytics.averageOrderValue,
    monthlyRevenue: analytics.monthlyRevenue,
    topCustomers: analytics.topCustomers,
    topProducts: analytics.topProducts,
  };

  const prompt = `
You are PharmaInsight AI, a sales intelligence analyst.

Analyze the business data below and generate exactly 3 to 4
meaningful business insights.

IMPORTANT RULES:

1. Do NOT simply repeat dashboard metrics.
2. Focus on patterns, relationships, concentration, trends,
   changes, or notable business observations.
3. Every insight must be supported by the provided data.
4. Never invent, estimate, or assume numbers.
5. If there is not enough data to support an insight, do not make it.
6. Do not give generic business advice.
7. Keep each insight concise and useful to a business owner.
8. Use Indian Rupee (₹) for monetary values.
9. Return ONLY a JSON object in this exact format:

{
  "insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ]
}

BUSINESS DATA:${JSON.stringify(businessContext, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const text = response.text.trim();

    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error("Invalid AI insights response");
    }

    return parsed.insights.slice(0, 4);
  } catch (error) {
    console.error("Gemini Insights Error:", error);

    if (
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      const quotaError = new Error(
        "AI insights are temporarily unavailable because the AI usage limit has been reached. Please try again later."
      );
      quotaError.statusCode = 429;
      throw quotaError;
    }

    const aiError = new Error(
      "AI insights are temporarily unavailable. Please try again later."
    );
    aiError.statusCode = 503;
    throw aiError;
  }
};