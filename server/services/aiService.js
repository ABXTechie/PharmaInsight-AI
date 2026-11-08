import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { getDashboardAnalytics } from "./analyticsService.js";
import { getPatternInsights } from "./patternService.js";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const AI_MODEL = "gemini-3.5-flash-lite";

// Map SDK errors to the user-facing messages the app already uses.
export const toAIError = (error, subject = "AI") => {
  if (error?.name === "TimeoutError" || error?.name === "AbortError") {
    const timeoutError = new Error(`${subject} took too long to respond. Please try again.`);
    timeoutError.statusCode = 504;
    return timeoutError;
  }

  if (
    error?.status === 429 ||
    error?.code === 429 ||
    error?.message?.includes("RESOURCE_EXHAUSTED")
  ) {
    const quotaError = new Error(
      `${subject} is temporarily unavailable because the AI usage limit has been reached. Please try again later.`
    );
    quotaError.statusCode = 429;
    return quotaError;
  }

  const aiError = new Error(`${subject} is temporarily unavailable. Please try again later.`);
  aiError.statusCode = 503;
  return aiError;
};

// Human-readable figures so the model quotes them naturally.
export const inr = (value) =>
  value === null || value === undefined
    ? null
    : `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

export const readableDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

/*
 * Compact view of the pattern signals for prompts. The numbers are computed
 * by patternService (deterministic); the model only explains them.
 */
export const buildPatternContext = (patterns, { includeIds = false, maxCustomers = 60 } = {}) => {
  const withId = (id, obj) => (includeIds ? { id, ...obj } : obj);

  return {
    customerStatusCounts: patterns.summary.statusCounts,
    statusMeaning: {
      at_risk: "well past their usual ordering gap, or overdue and buying much less",
      slipping: "overdue for an order, or buying noticeably less over recent orders",
      lost: "no order for a long time compared with their rhythm",
      growing: "buying noticeably more over recent orders",
      steady: "ordering on their usual rhythm",
      new: "first ordered recently",
      insufficient_history: "fewer than 3 order days; no pattern yet",
    },
    needsAttention: patterns.attention.slice(0, 20).map((a) => ({
      type: a.type,
      tone: a.tone,
      severity: a.severity,
      title: a.title,
      detail: a.message,
      ...(includeIds && a.customerId ? { customerId: a.customerId } : {}),
      ...(includeIds && a.productId ? { productId: a.productId } : {}),
    })),
    customers: patterns.customers.slice(0, maxCustomers).map((c) =>
      withId(c.customerId, {
        shop: c.shopName || c.name,
        owner: c.name,
        status: c.status,
        orders: c.orders,
        usualGapDays: c.usualGapDays,
        daysSinceLastOrder: c.daysSinceLastOrder,
        overdue: c.overdue,
        lastOrderDate: readableDate(c.lastOrder),
        lifetimeRevenue: inr(c.lifetimeRevenue),
        spendingTrendPercent: c.trend.changePercent,
        spendingRecentPerMonth: inr(c.trend.recentMonthlyRate),
        spendingBeforePerMonth: inr(c.trend.previousMonthlyRate),
        usuallyBuys: c.usuallyBuys.map((u) => u.name),
        stoppedBuying: c.stoppedBuying.map((x) => x.name),
        pitchNext: c.pitchNext.map((x) => x.name),
      })
    ),
    products: patterns.products.map((x) =>
      withId(x.productId, {
        name: x.name,
        company: x.company,
        trend: x.trend.status,
        unitsChangePercent30d: x.trend.changePercent,
        units30d: x.trend.unitsRecent,
        customers: x.customerCount,
        reachPercent: x.reachPercent,
        stoppedBy: x.lapsedCustomers.map((l) => l.shopName),
        neverOrderedByActiveCustomers: x.opportunities.map((o) => o.shopName),
        priceRange: x.price?.flagged ? `₹${x.price.min}–₹${x.price.max}` : undefined,
      })
    ),
  };
};

// Validated recent conversation → Gemini turns (oldest first).
const MAX_HISTORY_TURNS = 12;
const MAX_TURN_CHARS = 4000;

export const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (turn) =>
        turn &&
        (turn.role === "user" || turn.role === "assistant") &&
        typeof turn.content === "string" &&
        turn.content.trim()
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.content.slice(0, MAX_TURN_CHARS) }],
    }));
};

const buildChatContents = async (message, userId, history) => {
  const [analytics, patterns] = await Promise.all([
    getDashboardAnalytics(userId),
    getPatternInsights(userId),
  ]);

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

PATTERN SIGNALS (computed from recorded sales):
${JSON.stringify(buildPatternContext(patterns))}

USER QUESTION:
${message}
`;

  // Fresh data rides on the latest turn; earlier turns give conversational context.
  return [...sanitizeHistory(history), { role: "user", parts: [{ text: prompt }] }];
};

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

9. Customer & Product Patterns
PATTERN SIGNALS describe each customer's ordering rhythm (usualGapDays,
daysSinceLastOrder, overdue), spending trend over their recent orders, status,
the products they usually buy, products they stopped buying, and products to
pitch; and for each product its 30-day trend, reach, who stopped buying it and
which active customers never ordered it.
Use them for questions about retention, which customers to call or visit,
who is ordering less, what a customer usually takes, which customers use a
product, what is doing well or badly, and what to pitch to whom.
Quote these figures exactly; do not recompute or extrapolate them. A status is
a rule-based signal, not a certainty — phrase it as "hasn't ordered in 28 days,
usually every 7" rather than "they have left".

10. Conversation
Earlier turns are included for context. Resolve follow-ups ("and which of
those…", "what about her?") against them, but always answer from the latest
BUSINESS DATA and PATTERN SIGNALS.
If a follow-up refers to someone or something that is not in the earlier
turns, ask which customer or product they mean instead of guessing, and never
claim the user said something they did not.
`;

export const generateAIResponse = async (message, userId, history = []) => {
  const contents = await buildChatContents(message, userId, history);

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents,
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

export const generateAIResponseStream = async function* (message, userId, history = []) {
  const contents = await buildChatContents(message, userId, history);

  try {
    const response = await ai.models.generateContentStream({
      model: AI_MODEL,
      contents,
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