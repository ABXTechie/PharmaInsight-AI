// PharmaInsight AI brand mark — a capsule split into data (emerald) and insight (mint).
const Logo = ({ showText = true, tone = "light", className = "" }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={tone === "light" ? "#131d33" : "#0b1324"} />
      <g transform="rotate(-45 16 16)">
        <rect x="7" y="11.5" width="18" height="9" rx="4.5" fill="#129977" />
        <path d="M16 11.5h4.5a4.5 4.5 0 0 1 0 9H16z" fill="#6fd2b1" />
      </g>
    </svg>

    {showText && (
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-slate-900"
        }`}
      >
        PharmaInsight
        <span className={tone === "light" ? "ml-1 text-mint-400" : "ml-1 text-blue-600"}>
          AI
        </span>
      </span>
    )}
  </span>
);

export default Logo;
