import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";
import { getPatternInsights } from "./patternService.js";
import { ai, AI_MODEL, buildPatternContext, inr, readableDate, toAIError } from "./aiService.js";

/*
 * AI explanations on top of the deterministic pattern signals.
 * The model never produces numbers of its own: it receives computed figures,
 * returns structured JSON, and every id it returns is checked against the
 * user's real customers/products before reaching the client.
 */

const clip = (value, max) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";

const parseJSON = (text) => {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
};

// A stalled model call must not leave the UI spinning forever.
const AI_TIMEOUT_MS = 30 * 1000;

const generateJSON = async (prompt, subject) => {
  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
      },
    });
    return parseJSON(response.text);
  } catch (error) {
    console.error(`Gemini ${subject} Error:`, error);
    if (error instanceof SyntaxError) {
      const parseError = new Error(`${subject} could not be generated. Please try again.`);
      parseError.statusCode = 502;
      throw parseError;
    }
    throw toAIError(error, subject);
  }
};

const GROUNDING_RULES = `
RULES:
- Use ONLY the data provided. Never invent customers, products, numbers or dates.
- Quote figures exactly as given (₹ for money). Do not compute new statistics.
- Statuses are rule-based signals, not certainties. Say "hasn't ordered in 28 days,
  usually every 7", not "they have left".
- Be concrete and brief. No generic sales advice.
- Write naturally for a shop owner: plain sentences, no field names, no raw
  timestamps, no JSON-style values.
- Return ONLY the JSON object described.`;

/* ------------------------------------------------------- weekly brief */

const ACTION_TYPES = new Set(["call", "pitch", "watch", "price"]);

export const generateWeeklyBrief = async (userId) => {
  const patterns = await getPatternInsights(userId);
  const generatedAt = new Date();

  // Nothing to explain → don't spend an AI call.
  if (!patterns.attention.length) {
    return {
      generatedAt,
      source: "rules",
      summary: patterns.customers.length
        ? "No customer or product needs attention right now — everyone is ordering on their usual rhythm."
        : "Record a few sales to start seeing customer and product patterns here.",
      actions: [],
    };
  }

  const context = buildPatternContext(patterns, { includeIds: true });

  const prompt = `
You are PharmaInsight AI, writing a short weekly brief for the owner of a
pharmaceutical distribution business. The goal is to keep customers and grow
sales. Use the pattern signals below.

Return JSON exactly in this shape:
{
  "summary": "Two short sentences on the most important changes this week.",
  "actions": [
    {
      "type": "call" | "pitch" | "watch" | "price",
      "title": "Short imperative, max 70 characters, e.g. 'Call Quiet Regular'",
      "detail": "One sentence explaining why, quoting the figures given.",
      "customerId": "id from the data, if the action is about a customer",
      "productId": "id from the data, if the action is about a product"
    }
  ]
}

Give 3 to 5 actions, most important first: customers to call (overdue, at
risk, falling or stopped buying a product), products to pitch to specific
customers, things to watch, and price differences worth reviewing.
${GROUNDING_RULES}

PATTERN SIGNALS:
${JSON.stringify(context)}
`;

  const raw = await generateJSON(prompt, "Weekly brief");

  const customerIds = new Set(patterns.customers.map((c) => c.customerId));
  const productIds = new Set(patterns.products.map((p) => p.productId));

  const actions = (Array.isArray(raw.actions) ? raw.actions : [])
    .filter((a) => a && ACTION_TYPES.has(a.type) && clip(a.title, 90))
    .slice(0, 5)
    .map((a) => ({
      type: a.type,
      title: clip(a.title, 90),
      detail: clip(a.detail, 300),
      ...(customerIds.has(a.customerId) ? { customerId: a.customerId } : {}),
      ...(productIds.has(a.productId) ? { productId: a.productId } : {}),
    }));

  if (!clip(raw.summary, 500) && !actions.length) {
    const emptyError = new Error("Weekly brief could not be generated. Please try again.");
    emptyError.statusCode = 502;
    throw emptyError;
  }

  return {
    generatedAt,
    source: "ai",
    summary: clip(raw.summary, 500),
    actions,
  };
};

/* --------------------------------------------- customer talking points */

export const generateTalkingPoints = async (userId, customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    const err = new Error("Invalid customer ID");
    err.statusCode = 400;
    throw err;
  }

  const customerDoc = await Customer.findOne({ _id: customerId, createdBy: userId })
    .select("name shopName")
    .lean();

  if (!customerDoc) {
    const err = new Error("Customer not found");
    err.statusCode = 404;
    throw err;
  }

  const patterns = await getPatternInsights(userId);
  const pattern = patterns.customers.find((c) => c.customerId === String(customerId));

  if (!pattern) {
    const err = new Error("This customer has no orders yet, so there is nothing to base talking points on.");
    err.statusCode = 400;
    throw err;
  }

  const recentSales = await Sale.find({ customer: customerId, createdBy: userId })
    .populate("items.product", "name")
    .sort({ saleDate: -1 })
    .limit(6)
    .lean();

  const relatedProductIds = new Set([
    ...pattern.usuallyBuys.map((p) => p.productId),
    ...pattern.stoppedBuying.map((p) => p.productId),
    ...pattern.pitchNext.map((p) => p.productId),
  ]);

  const context = {
    customer: {
      shop: pattern.shopName || pattern.name,
      owner: pattern.name,
      status: pattern.status,
      orders: pattern.orders,
      firstOrder: readableDate(pattern.firstOrder),
      lastOrder: readableDate(pattern.lastOrder),
      daysSinceLastOrder: pattern.daysSinceLastOrder,
      usualGapDays: pattern.usualGapDays,
      overdue: pattern.overdue,
      overdueByDays: pattern.overdueByDays,
      lifetimeRevenue: inr(pattern.lifetimeRevenue),
      averageOrderValue: inr(pattern.averageOrderValue),
      spendingTrend:
        pattern.trend.changePercent === null
          ? "not enough orders to compare yet"
          : {
              changePercent: pattern.trend.changePercent,
              comparedOrders: pattern.trend.ordersCompared,
              recentPerMonth: inr(pattern.trend.recentMonthlyRate),
              beforePerMonth: inr(pattern.trend.previousMonthlyRate),
              recentAverageOrder: inr(pattern.trend.recentAverageOrder),
              beforeAverageOrder: inr(pattern.trend.previousAverageOrder),
            },
      usuallyBuys: pattern.usuallyBuys.map((p) => ({
        productId: p.productId,
        name: p.name,
        shareOfOrders: `${Math.round(p.share * 100)}%`,
        averageQuantity: p.averageQuantity,
        averagePrice: inr(p.averagePrice),
      })),
      stoppedBuying: pattern.stoppedBuying.map((p) => ({
        productId: p.productId,
        name: p.name,
        timesBoughtBefore: p.purchases,
        missingFromLastOrders: p.ordersSince,
        lastBought: readableDate(p.lastBought),
      })),
      pitchNext: pattern.pitchNext.map((p) => ({
        productId: p.productId,
        name: p.name,
        similarShopsBuyingIt: p.similarCustomersBuying,
      })),
    },
    recentOrders: recentSales.map((sale) => ({
      date: readableDate(sale.saleDate),
      total: inr(sale.totalAmount),
      items: sale.items.map((i) => `${i.product?.name || "Deleted product"} × ${i.quantity} @ ₹${i.unitPrice}`),
    })),
    relatedProducts: patterns.products
      .filter((p) => relatedProductIds.has(p.productId))
      .map((p) => ({
        productId: p.productId,
        name: p.name,
        trend30d: p.trend.status,
        unitsChangePercent30d: p.trend.changePercent,
        reachPercent: p.reachPercent,
      })),
  };

  const prompt = `
You are PharmaInsight AI, preparing the owner of a pharmaceutical distribution
business for a call or visit with one customer. The goal is to keep the
customer and grow what they buy.

Return JSON exactly in this shape:
{
  "summary": "One or two sentences on where this customer stands.",
  "points": ["3 to 5 specific talking points or questions to raise"],
  "suggestedProducts": [
    { "productId": "id from usuallyBuys, stoppedBuying or pitchNext", "reason": "One short sentence" }
  ]
}

Good points: ask about a dropped product, confirm their usual order if they
are overdue, mention a product similar shops buy. Suggest at most 3 products,
only from the ids provided.
${GROUNDING_RULES}

CUSTOMER DATA:
${JSON.stringify(context)}
`;

  const raw = await generateJSON(prompt, "Talking points");

  const productNames = new Map(
    [...pattern.usuallyBuys, ...pattern.stoppedBuying, ...pattern.pitchNext].map((p) => [p.productId, p.name])
  );

  const points = (Array.isArray(raw.points) ? raw.points : [])
    .map((point) => clip(point, 300))
    .filter(Boolean)
    .slice(0, 5);

  const suggestedProducts = (Array.isArray(raw.suggestedProducts) ? raw.suggestedProducts : [])
    .filter((p) => p && productNames.has(p.productId))
    .slice(0, 3)
    .map((p) => ({
      productId: p.productId,
      name: productNames.get(p.productId),
      reason: clip(p.reason, 200),
    }));

  if (!points.length) {
    const emptyError = new Error("Talking points could not be generated. Please try again.");
    emptyError.statusCode = 502;
    throw emptyError;
  }

  return {
    generatedAt: new Date(),
    customerId: String(customerId),
    summary: clip(raw.summary, 400),
    points,
    suggestedProducts,
  };
};
