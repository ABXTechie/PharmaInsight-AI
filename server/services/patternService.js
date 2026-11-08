import Sale from "../models/Sale.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";

/*
 * Customer & product pattern signals.
 *
 * Everything here is deterministic arithmetic over the user's own sales —
 * no estimation and no AI. The AI layer (phase 3) only explains these
 * numbers; it never produces them.
 */

const DAY = 24 * 60 * 60 * 1000;

// Tunable thresholds. Returned in the response so the UI can explain itself.
export const RULES = {
  minOrderDaysForPattern: 3, // need 3 order days (2 gaps) to learn a rhythm
  newCustomerDays: 30, // first order within this many days → "new"
  trendMaxOrders: 4, // compare the last ≤4 order days with the ≤4 before them
  trendMinOrders: 2, // need at least 2 order days on each side
  overdueFactor: 1.5, // overdue when silent > 1.5 × usual gap …
  overdueMinExtraDays: 3, // … and at least 3 days past the usual gap
  atRiskGapFactor: 2, // silent > 2 × usual gap → at risk
  lostMinDays: 60, // silent this long (or 3 × gap if longer) → lost
  lostGapFactor: 3,
  lostReportMaxDays: 180, // don't keep nagging about long-gone customers
  trendChange: 0.25, // ±25% = growing / slipping
  atRiskDrop: 0.3, // −30% while overdue = at risk
  regularShare: 0.4, // in ≥40% of a customer's orders = "usually buys"
  stoppedMinPurchases: 2, // bought at least twice …
  stoppedRegularShare: 0.3, // … in ≥30% of orders up to then …
  stoppedAfterOrders: 3, // … but missing from their last 3+ orders
  activeDays: 60, // ordered within 60 days = active customer
  productTrendDays: 30,
  productTrendMinUnits: 10, // ignore trends on tiny volumes
  boughtWithMinSales: 2,
  priceWindowDays: 90,
  priceSpreadFlag: 0.1, // ≥10% gap between cheapest and dearest customer price
};

/* ---------------------------------------------------------------- utils */

const round = (value, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Fractional change; null when there is no base to compare against.
const change = (current, previous) =>
  previous > 0 ? (current - previous) / previous : null;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (later, earlier) =>
  Math.floor((startOfDay(later) - startOfDay(earlier)) / DAY);

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared += 1;
  return shared / (a.size + b.size - shared);
};

const pct = (fraction) => (fraction === null ? null : round(fraction * 100));

// "Singh Chemists" → "Singh Chemists'", "CarePlus" → "CarePlus's"
const possessive = (name) => (/s$/i.test(name) ? `${name}'` : `${name}'s`);

const inr = (value) => `₹${round(value).toLocaleString("en-IN")}`;

/* ------------------------------------------------------------- service */

export const getPatternInsights = async (userId, { now = new Date() } = {}) => {
  const [sales, customerDocs, productDocs] = await Promise.all([
    Sale.find({ createdBy: userId, saleDate: { $lte: now } })
      .select("customer items saleDate totalAmount")
      .sort({ saleDate: 1 })
      .lean(),
    Customer.find({ createdBy: userId }).select("name shopName").lean(),
    Product.find({ createdBy: userId }).select("name company category").lean(),
  ]);

  const customerInfo = new Map(
    customerDocs.map((c) => [String(c._id), { name: c.name, shopName: c.shopName }])
  );
  const productInfo = new Map(
    productDocs.map((p) => [
      String(p._id),
      { name: p.name, company: p.company, category: p.category },
    ])
  );

  const customerLabel = (id) => {
    const info = customerInfo.get(id);
    return info ? info.shopName || info.name : "Deleted customer";
  };
  const productLabel = (id) => productInfo.get(id)?.name || "Deleted product";

  /* ---- normalise sales ------------------------------------------------ */

  const salesByCustomer = new Map();
  const productAgg = new Map();

  const getProductAgg = (pid) => {
    if (!productAgg.has(pid)) {
      productAgg.set(pid, {
        revenue: 0,
        units: 0,
        sales: 0,
        customers: new Map(), // cid → { revenue, units, purchases, lastBought }
        monthly: new Map(),
        unitsRecent: 0,
        unitsPrevious: 0,
        revenueRecent: 0,
        revenuePrevious: 0,
        coOccurrence: new Map(),
        recentPrices: new Map(), // cid → { units, revenue }
      });
    }
    return productAgg.get(pid);
  };

  const productTrendStart = new Date(now - RULES.productTrendDays * DAY);
  const productTrendPrevStart = new Date(now - 2 * RULES.productTrendDays * DAY);
  const priceWindowStart = new Date(now - RULES.priceWindowDays * DAY);

  for (const sale of sales) {
    const cid = String(sale.customer);
    const date = new Date(sale.saleDate);
    const items = sale.items.map((item) => ({
      pid: String(item.product),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      subtotal: Number(item.subtotal) || 0,
    }));

    if (!salesByCustomer.has(cid)) salesByCustomer.set(cid, []);
    salesByCustomer.get(cid).push({ date, total: Number(sale.totalAmount) || 0, items });

    const pidsInSale = [...new Set(items.map((i) => i.pid))];

    for (const item of items) {
      const agg = getProductAgg(item.pid);
      agg.revenue += item.subtotal;
      agg.units += item.quantity;

      const perCustomer = agg.customers.get(cid) || {
        revenue: 0,
        units: 0,
        purchases: 0,
        lastBought: null,
      };
      perCustomer.revenue += item.subtotal;
      perCustomer.units += item.quantity;
      agg.customers.set(cid, perCustomer);

      const key = monthKey(date);
      const month = agg.monthly.get(key) || { units: 0, revenue: 0 };
      month.units += item.quantity;
      month.revenue += item.subtotal;
      agg.monthly.set(key, month);

      if (date > productTrendStart) {
        agg.unitsRecent += item.quantity;
        agg.revenueRecent += item.subtotal;
      } else if (date > productTrendPrevStart) {
        agg.unitsPrevious += item.quantity;
        agg.revenuePrevious += item.subtotal;
      }

      if (date > priceWindowStart) {
        const price = agg.recentPrices.get(cid) || { units: 0, revenue: 0 };
        price.units += item.quantity;
        price.revenue += item.quantity * item.unitPrice;
        agg.recentPrices.set(cid, price);
      }
    }

    // Per-sale counters (a product listed twice in one sale counts once)
    for (const pid of pidsInSale) {
      const agg = getProductAgg(pid);
      agg.sales += 1;
      const perCustomer = agg.customers.get(cid);
      perCustomer.purchases += 1;
      perCustomer.lastBought = date;

      for (const other of pidsInSale) {
        if (other !== pid) {
          agg.coOccurrence.set(other, (agg.coOccurrence.get(other) || 0) + 1);
        }
      }
    }
  }

  /* ---- customers ------------------------------------------------------ */

  const customerProductSets = new Map();
  for (const [cid, list] of salesByCustomer) {
    customerProductSets.set(
      cid,
      new Set(list.flatMap((sale) => sale.items.map((i) => i.pid)))
    );
  }

  // How strongly "customers like cid" buy pid (sum of basket similarity).
  const similarityScore = (cid, pid) => {
    const mine = customerProductSets.get(cid) || new Set();
    let score = 0;
    let buyers = 0;
    for (const [otherId, otherSet] of customerProductSets) {
      if (otherId === cid || !otherSet.has(pid)) continue;
      const similarity = jaccard(mine, otherSet);
      if (similarity > 0) {
        score += similarity;
        buyers += 1;
      }
    }
    return { score, buyers };
  };

  const customers = [];

  for (const [cid, list] of salesByCustomer) {
    const orderDays = [...new Set(list.map((s) => startOfDay(s.date).getTime()))]
      .sort((a, b) => a - b)
      .map((t) => new Date(t));

    const gaps = orderDays.slice(1).map((day, i) => daysBetween(day, orderDays[i]));
    const usualGapDays =
      orderDays.length >= RULES.minOrderDaysForPattern ? round(median(gaps), 1) : null;

    const firstOrder = list[0].date;
    const lastOrder = list[list.length - 1].date;
    const daysSinceLastOrder = daysBetween(now, lastOrder);

    // Spending trend: the customer's last k order days vs the k before.
    // Each order day's revenue is spread over the gap that preceded it, giving
    // "rupees per day". This ignores calendar-window boundaries (where one order
    // more or less would swing the result) while still reflecting both smaller
    // orders and longer gaps between orders.
    const dailyRevenue = new Map();
    let lifetimeRevenue = 0;
    for (const sale of list) {
      lifetimeRevenue += sale.total;
      const key = startOfDay(sale.date).getTime();
      dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + sale.total);
    }
    const dayRevenue = orderDays.map((d) => dailyRevenue.get(d.getTime()) || 0);

    const k = Math.min(RULES.trendMaxOrders, Math.floor((orderDays.length - 1) / 2));
    let trend = {
      basis: "orders",
      ordersCompared: 0,
      recentMonthlyRate: null,
      previousMonthlyRate: null,
      recentAverageOrder: null,
      previousAverageOrder: null,
      changePercent: null,
    };
    let revenueChange = null;

    if (k >= RULES.trendMinOrders) {
      const n = orderDays.length;
      const groupRate = (from, to) => {
        // order days [from, to) — each covers the gap since the previous order day
        let revenue = 0;
        let days = 0;
        for (let i = from; i < to; i += 1) {
          revenue += dayRevenue[i];
          days += gaps[i - 1];
        }
        return { perDay: days > 0 ? revenue / days : 0, average: revenue / (to - from) };
      };
      const recent = groupRate(n - k, n);
      const previous = groupRate(n - 2 * k, n - k);
      revenueChange = change(recent.perDay, previous.perDay);
      trend = {
        basis: "orders",
        ordersCompared: k,
        recentMonthlyRate: round(recent.perDay * 30),
        previousMonthlyRate: round(previous.perDay * 30),
        recentAverageOrder: round(recent.average, 2),
        previousAverageOrder: round(previous.average, 2),
        changePercent: pct(revenueChange),
      };
    }

    // Plain calendar figure for display only (not used for status)
    const last30Start = new Date(now - 30 * DAY);
    const revenueLast30Days = round(
      list.filter((sale) => sale.date > last30Start).reduce((sum, sale) => sum + sale.total, 0),
      2
    );


    const overdue =
      usualGapDays !== null &&
      daysSinceLastOrder > usualGapDays * RULES.overdueFactor &&
      daysSinceLastOrder - usualGapDays >= RULES.overdueMinExtraDays;

    const lostAfterDays = Math.max(
      RULES.lostMinDays,
      usualGapDays ? usualGapDays * RULES.lostGapFactor : 0
    );

    let status;
    if (daysSinceLastOrder >= lostAfterDays) status = "lost";
    else if (
      daysBetween(now, firstOrder) <= RULES.newCustomerDays &&
      orderDays.length < RULES.minOrderDaysForPattern
    )
      status = "new";
    else if (usualGapDays === null) status = "insufficient_history";
    else if (
      overdue &&
      (daysSinceLastOrder > usualGapDays * RULES.atRiskGapFactor ||
        (revenueChange !== null && revenueChange <= -RULES.atRiskDrop))
    )
      status = "at_risk";
    else if (overdue || (revenueChange !== null && revenueChange <= -RULES.trendChange))
      status = "slipping";
    else if (revenueChange !== null && revenueChange >= RULES.trendChange)
      status = "growing";
    else status = "steady";

    /* products this customer buys */
    const orderCount = list.length;
    const perProduct = new Map();

    list.forEach((sale, saleIndex) => {
      const seen = new Set();
      for (const item of sale.items) {
        const entry = perProduct.get(item.pid) || {
          purchases: 0,
          units: 0,
          revenue: 0,
          firstIndex: saleIndex,
          lastIndex: saleIndex,
          lastBought: sale.date,
        };
        entry.units += item.quantity;
        entry.revenue += item.subtotal;
        if (!seen.has(item.pid)) {
          entry.purchases += 1;
          seen.add(item.pid);
        }
        entry.lastIndex = saleIndex;
        entry.lastBought = sale.date;
        perProduct.set(item.pid, entry);
      }
    });

    const productRows = [...perProduct].map(([pid, entry]) => ({
      productId: pid,
      name: productLabel(pid),
      company: productInfo.get(pid)?.company || "",
      purchases: entry.purchases,
      share: round(entry.purchases / orderCount, 2),
      units: entry.units,
      revenue: round(entry.revenue, 2),
      averageQuantity: round(entry.units / entry.purchases, 1),
      averagePrice: round(entry.units ? entry.revenue / entry.units : 0, 2),
      lastBought: entry.lastBought,
      ordersSinceLastBought: orderCount - 1 - entry.lastIndex,
      shareUntilLastBought: entry.purchases / (entry.lastIndex + 1),
    }));

    const usuallyBuys = productRows
      // Regular products only — anything they've since dropped goes to stoppedBuying
      .filter(
        (p) =>
          orderCount >= 2 &&
          p.share >= RULES.regularShare &&
          p.ordersSinceLastBought < RULES.stoppedAfterOrders
      )
      .sort((a, b) => b.share - a.share || b.revenue - a.revenue)
      .slice(0, 6)
      .map(({ shareUntilLastBought: _s, ordersSinceLastBought: _o, ...rest }) => rest);

    const stoppedBuying = productRows
      .filter(
        (p) =>
          p.purchases >= RULES.stoppedMinPurchases &&
          p.shareUntilLastBought >= RULES.stoppedRegularShare &&
          p.ordersSinceLastBought >= RULES.stoppedAfterOrders
      )
      .sort((a, b) => b.revenue - a.revenue)
      .map((p) => ({
        productId: p.productId,
        name: p.name,
        company: p.company,
        purchases: p.purchases,
        lastBought: p.lastBought,
        ordersSince: p.ordersSinceLastBought,
        revenueBefore: p.revenue,
      }));

    customers.push({
      customerId: cid,
      name: customerInfo.get(cid)?.name || "Deleted customer",
      shopName: customerInfo.get(cid)?.shopName || "",
      status,
      orders: orderCount,
      orderDays: orderDays.length,
      firstOrder,
      lastOrder,
      daysSinceLastOrder,
      usualGapDays,
      expectedNextOrder: usualGapDays
        ? new Date(startOfDay(lastOrder).getTime() + usualGapDays * DAY)
        : null,
      overdue,
      overdueByDays: overdue ? round(daysSinceLastOrder - usualGapDays) : 0,
      lifetimeRevenue: round(lifetimeRevenue, 2),
      averageOrderValue: round(lifetimeRevenue / orderCount, 2),
      revenueLast30Days,
      trend,
      usuallyBuys,
      stoppedBuying,
      pitchNext: [], // filled below once every basket is known
    });
  }

  const activeCustomerIds = new Set(
    customers.filter((c) => c.daysSinceLastOrder <= RULES.activeDays).map((c) => c.customerId)
  );

  for (const customer of customers) {
    const mine = customerProductSets.get(customer.customerId);
    if (!mine || mine.size < 2) continue;

    customer.pitchNext = [...productAgg.keys()]
      .filter((pid) => !mine.has(pid) && productInfo.has(pid))
      .map((pid) => {
        const { score, buyers } = similarityScore(customer.customerId, pid);
        return {
          productId: pid,
          name: productLabel(pid),
          company: productInfo.get(pid)?.company || "",
          similarCustomersBuying: buyers,
          score: round(score, 2),
        };
      })
      .filter((p) => p.similarCustomersBuying > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  /* ---- products ------------------------------------------------------- */

  const customerById = new Map(customers.map((c) => [c.customerId, c]));
  const buyingCustomerCount = customers.length;

  const recentMonths = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    recentMonths.push({ key: monthKey(d), label: d.toLocaleString("en-US", { month: "short" }) });
  }

  const products = [];

  for (const product of productDocs) {
    const pid = String(product._id);
    const agg = productAgg.get(pid);

    if (!agg) {
      products.push({
        productId: pid,
        name: product.name,
        company: product.company,
        category: product.category,
        revenue: 0,
        units: 0,
        sales: 0,
        customerCount: 0,
        reachPercent: 0,
        trend: { status: "no_sales", unitsRecent: 0, unitsPrevious: 0, changePercent: null },
        monthly: recentMonths.map((m) => ({ month: m.label, units: 0, revenue: 0 })),
        topCustomers: [],
        lapsedCustomers: [],
        opportunities: [...activeCustomerIds].slice(0, 5).map((cid) => ({
          customerId: cid,
          shopName: customerLabel(cid),
          similarCustomersBuying: 0,
        })),
        boughtWith: [],
        price: null,
      });
      continue;
    }

    const volume = Math.max(agg.unitsRecent, agg.unitsPrevious);
    const unitsChange = change(agg.unitsRecent, agg.unitsPrevious);
    let trendStatus;
    if (volume < RULES.productTrendMinUnits) trendStatus = "low_volume";
    else if (agg.unitsPrevious === 0) trendStatus = "rising";
    else if (unitsChange >= RULES.trendChange) trendStatus = "rising";
    else if (unitsChange <= -RULES.trendChange) trendStatus = "falling";
    else trendStatus = "steady";

    const topCustomers = [...agg.customers]
      .map(([cid, c]) => ({
        customerId: cid,
        shopName: customerLabel(cid),
        name: customerInfo.get(cid)?.name || "",
        revenue: round(c.revenue, 2),
        units: c.units,
        purchases: c.purchases,
        lastBought: c.lastBought,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const lapsedCustomers = customers
      .filter((c) => c.stoppedBuying.some((s) => s.productId === pid))
      .map((c) => {
        const s = c.stoppedBuying.find((x) => x.productId === pid);
        return {
          customerId: c.customerId,
          shopName: c.shopName || c.name,
          lastBought: s.lastBought,
          ordersSince: s.ordersSince,
        };
      });

    const opportunities = [...activeCustomerIds]
      .filter((cid) => !agg.customers.has(cid))
      .map((cid) => {
        const { score, buyers } = similarityScore(cid, pid);
        return {
          customerId: cid,
          shopName: customerLabel(cid),
          similarCustomersBuying: buyers,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ score: _score, ...rest }) => rest);

    const boughtWith = [...agg.coOccurrence]
      .filter(([, count]) => count >= RULES.boughtWithMinSales)
      .map(([otherId, count]) => ({
        productId: otherId,
        name: productLabel(otherId),
        togetherInSales: count,
        percentOfSales: round((count / agg.sales) * 100),
      }))
      .sort((a, b) => b.togetherInSales - a.togetherInSales)
      .slice(0, 3);

    let price = null;
    const priceRows = [...agg.recentPrices]
      .filter(([, p]) => p.units > 0)
      .map(([cid, p]) => ({
        customerId: cid,
        shopName: customerLabel(cid),
        averagePrice: round(p.revenue / p.units, 2),
        units: p.units,
      }))
      .sort((a, b) => a.averagePrice - b.averagePrice);

    if (priceRows.length) {
      const totalUnits = priceRows.reduce((sum, r) => sum + r.units, 0);
      const min = priceRows[0].averagePrice;
      const max = priceRows[priceRows.length - 1].averagePrice;
      const spread = max > 0 ? (max - min) / max : 0;
      price = {
        windowDays: RULES.priceWindowDays,
        min,
        max,
        average: round(
          priceRows.reduce((sum, r) => sum + r.averagePrice * r.units, 0) / totalUnits,
          2
        ),
        spreadPercent: round(spread * 100),
        flagged: priceRows.length >= 2 && spread >= RULES.priceSpreadFlag,
        byCustomer: priceRows,
      };
    }

    products.push({
      productId: pid,
      name: product.name,
      company: product.company,
      category: product.category,
      revenue: round(agg.revenue, 2),
      units: agg.units,
      sales: agg.sales,
      customerCount: agg.customers.size,
      reachPercent: buyingCustomerCount
        ? round((agg.customers.size / buyingCustomerCount) * 100)
        : 0,
      trend: {
        status: trendStatus,
        windowDays: RULES.productTrendDays,
        unitsRecent: agg.unitsRecent,
        unitsPrevious: agg.unitsPrevious,
        revenueRecent: round(agg.revenueRecent, 2),
        revenuePrevious: round(agg.revenuePrevious, 2),
        changePercent: pct(unitsChange),
      },
      monthly: recentMonths.map((m) => {
        const month = agg.monthly.get(m.key);
        return { month: m.label, units: month?.units || 0, revenue: round(month?.revenue || 0, 2) };
      }),
      topCustomers: topCustomers.slice(0, 5),
      lapsedCustomers,
      opportunities,
      boughtWith,
      price,
    });
  }

  products.sort((a, b) => b.revenue - a.revenue);

  /* ---- attention feed ------------------------------------------------- */

  const attention = [];

  for (const c of customers) {
    const shop = c.shopName || c.name;

    if (c.status === "lost" && c.daysSinceLastOrder <= RULES.lostReportMaxDays) {
      attention.push({
        type: "customer_lost",
        tone: "risk",
        severity: "high",
        customerId: c.customerId,
        title: `${shop} has stopped ordering`,
        message: `No order in ${c.daysSinceLastOrder} days${
          c.usualGapDays ? ` (they used to order every ${round(c.usualGapDays)} days)` : ""
        }.`,
        metrics: { daysSinceLastOrder: c.daysSinceLastOrder, usualGapDays: c.usualGapDays },
      });
    } else if (c.overdue) {
      attention.push({
        type: "customer_overdue",
        tone: "risk",
        severity: c.status === "at_risk" ? "high" : "medium",
        customerId: c.customerId,
        title: `${shop} is overdue for an order`,
        message: `Usually orders every ${round(c.usualGapDays)} days — last order was ${c.daysSinceLastOrder} days ago.`,
        metrics: {
          daysSinceLastOrder: c.daysSinceLastOrder,
          usualGapDays: c.usualGapDays,
          overdueByDays: c.overdueByDays,
        },
      });
    }

    if (
      c.status !== "lost" &&
      !c.overdue &&
      c.trend.changePercent !== null &&
      c.trend.changePercent <= -RULES.trendChange * 100
    ) {
      attention.push({
        type: "customer_declining",
        tone: "risk",
        severity: c.trend.changePercent <= -50 ? "high" : "medium",
        customerId: c.customerId,
        title: `${possessive(shop)} purchases are falling`,
        message: `Buying ${Math.abs(c.trend.changePercent)}% less — about ${inr(
          c.trend.recentMonthlyRate
        )}/month over their last ${c.trend.ordersCompared} orders vs ${inr(
          c.trend.previousMonthlyRate
        )}/month before.`,
        metrics: c.trend,
      });
    }

    if (c.status !== "lost") {
      for (const s of c.stoppedBuying) {
        attention.push({
          type: "customer_stopped_product",
          tone: "risk",
          severity: "medium",
          customerId: c.customerId,
          productId: s.productId,
          title: `${shop} stopped buying ${s.name}`,
          message: `Bought it ${s.purchases} times before, but not in their last ${s.ordersSince} orders.`,
          metrics: { purchases: s.purchases, ordersSince: s.ordersSince, lastBought: s.lastBought },
        });
      }
    }

    if (c.status === "growing") {
      attention.push({
        type: "customer_growing",
        tone: "opportunity",
        severity: "low",
        customerId: c.customerId,
        title: `${shop} is buying more`,
        message: `Buying ${c.trend.changePercent}% more — about ${inr(
          c.trend.recentMonthlyRate
        )}/month over their last ${c.trend.ordersCompared} orders vs ${inr(
          c.trend.previousMonthlyRate
        )}/month before.`,
        metrics: c.trend,
      });
    }
  }

  for (const p of products) {
    if (p.trend.status === "falling") {
      attention.push({
        type: "product_falling",
        tone: "risk",
        severity: "medium",
        productId: p.productId,
        title: `${p.name} is selling less`,
        message: `Units fell ${Math.abs(p.trend.changePercent)}% in the last ${p.trend.windowDays} days (${p.trend.unitsRecent} vs ${p.trend.unitsPrevious}).`,
        metrics: p.trend,
      });
    }

    if (p.trend.status === "rising" && p.opportunities.length) {
      attention.push({
        type: "product_rising",
        tone: "opportunity",
        severity: "medium",
        productId: p.productId,
        title: `${p.name} is doing well`,
        message: `${
          p.trend.changePercent === null
            ? `${p.trend.unitsRecent} units in the last ${p.trend.windowDays} days`
            : `Up ${p.trend.changePercent}% in the last ${p.trend.windowDays} days`
        } — ${p.opportunities.length} active ${
          p.opportunities.length === 1 ? "customer has" : "customers have"
        } never ordered it.`,
        metrics: { ...p.trend, opportunities: p.opportunities.length },
      });
    }

    if (p.price?.flagged) {
      attention.push({
        type: "product_price_spread",
        tone: "info",
        severity: "low",
        productId: p.productId,
        title: `${p.name} is sold at different prices`,
        message: `Between ${inr(p.price.min)} and ${inr(p.price.max)} per unit across customers in the last ${p.price.windowDays} days.`,
        metrics: { min: p.price.min, max: p.price.max, spreadPercent: p.price.spreadPercent },
      });
    }
  }

  const toneRank = { risk: 0, opportunity: 1, info: 2 };
  const severityRank = { high: 0, medium: 1, low: 2 };
  attention.sort(
    (a, b) =>
      toneRank[a.tone] - toneRank[b.tone] || severityRank[a.severity] - severityRank[b.severity]
  );
  attention.forEach((item, index) => {
    item.id = `${item.type}:${item.customerId || ""}:${item.productId || ""}:${index}`;
  });

  /* ---- customer × product matrix -------------------------------------- */

  const matrixCells = {};
  for (const [pid, agg] of productAgg) {
    for (const [cid, c] of agg.customers) {
      matrixCells[cid] = matrixCells[cid] || {};
      matrixCells[cid][pid] = {
        units: c.units,
        revenue: round(c.revenue, 2),
        purchases: c.purchases,
        lastBought: c.lastBought,
      };
    }
  }

  /* ---- summary -------------------------------------------------------- */

  const statusCounts = customers.reduce((counts, c) => {
    counts[c.status] = (counts[c.status] || 0) + 1;
    return counts;
  }, {});

  customers.sort((a, b) => b.lifetimeRevenue - a.lifetimeRevenue);

  return {
    generatedAt: now,
    rules: RULES,
    summary: {
      totalCustomers: customerDocs.length,
      buyingCustomers: buyingCustomerCount,
      activeCustomers: activeCustomerIds.size,
      neverOrdered: customerDocs.length - buyingCustomerCount,
      statusCounts,
      attention: {
        total: attention.length,
        risks: attention.filter((a) => a.tone === "risk").length,
        opportunities: attention.filter((a) => a.tone === "opportunity").length,
      },
    },
    attention,
    customers,
    products,
    matrix: {
      customers: customers.map((c) => ({
        customerId: c.customerId,
        name: c.name,
        shopName: c.shopName,
      })),
      products: products.map((p) => ({ productId: p.productId, name: p.name })),
      cells: matrixCells,
    },
  };
};
