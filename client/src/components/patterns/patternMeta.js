// Display metadata for pattern statuses (labels, colours, plain explanations).

export const CUSTOMER_STATUS = {
  at_risk: {
    label: "At risk",
    className: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
    help: "Well past their usual ordering gap, or overdue and buying much less.",
    rank: 0,
  },
  slipping: {
    label: "Slipping",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
    help: "Overdue for an order, or buying noticeably less than before.",
    rank: 1,
  },
  lost: {
    label: "Lost",
    className: "bg-slate-100 text-slate-600 ring-slate-300",
    dot: "bg-slate-500",
    help: "Hasn't ordered for a long time compared with their usual rhythm.",
    rank: 2,
  },
  growing: {
    label: "Growing",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
    help: "Buying noticeably more over their recent orders.",
    rank: 3,
  },
  steady: {
    label: "Steady",
    className: "bg-slate-50 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
    help: "Ordering on their usual rhythm at a similar level.",
    rank: 4,
  },
  new: {
    label: "New",
    className: "bg-mint-50 text-mint-700 ring-mint-200",
    dot: "bg-mint-500",
    help: "First ordered recently; not enough history for patterns yet.",
    rank: 5,
  },
  insufficient_history: {
    label: "Not enough history",
    className: "bg-slate-50 text-slate-500 ring-slate-200",
    dot: "bg-slate-300",
    help: "Needs at least 3 order days before patterns are reliable.",
    rank: 6,
  },
};

export const PRODUCT_TREND = {
  rising: { label: "Rising", className: "bg-blue-50 text-blue-700 ring-blue-200", icon: "trend" },
  falling: { label: "Falling", className: "bg-red-50 text-red-700 ring-red-200", icon: "trend", flip: true },
  steady: { label: "Steady", className: "bg-slate-50 text-slate-600 ring-slate-200", icon: "activity" },
  low_volume: { label: "Low volume", className: "bg-slate-50 text-slate-500 ring-slate-200", icon: "activity" },
  no_sales: { label: "No sales", className: "bg-slate-50 text-slate-400 ring-slate-200", icon: "activity" },
};

export const STATUS_ORDER = ["at_risk", "slipping", "lost", "growing", "steady", "new", "insufficient_history"];
