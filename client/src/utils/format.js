// Display formatting helpers (presentation only — never alter source values).

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatINR = (value) => inr.format(Number(value) || 0);

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

// Compact INR for chart axes: ₹1.2L, ₹3.4Cr, ₹12K
export const formatINRCompact = (value) => {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `₹${n}`;
};

export const formatDate = (value, options) =>
  new Date(value).toLocaleDateString(
    "en-IN",
    options || { day: "numeric", month: "short", year: "numeric" }
  );

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
