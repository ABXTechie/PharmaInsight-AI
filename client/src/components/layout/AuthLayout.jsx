import Icon from "../ui/Icon";
import Logo from "../ui/Logo";

const highlights = [
  { icon: "activity", title: "Live sales analytics", text: "Revenue, orders and customer performance in one view." },
  { icon: "sparkles", title: "AI business insights", text: "Gemini-powered analysis grounded in your own data." },
  { icon: "report", title: "Exportable reports", text: "Sales, customer, product and monthly reports with PDF export." },
];

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-screen bg-white">
    {/* Brand panel */}
    <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden bg-ink-900 p-12 text-slate-300 lg:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at 30% 40%, black 20%, transparent 75%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-3xl"
        aria-hidden="true"
      />

      <Logo className="relative" />

      <div className="relative">
        <p className="eyebrow text-mint-400">Pharmaceutical sales intelligence</p>
        <h2 className="mt-4 max-w-md text-[34px] font-semibold leading-tight tracking-tight text-white">
          The command center for your pharma business decisions.
        </h2>

        <ul className="mt-10 space-y-6">
          {highlights.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-mint-400">
                <Icon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-400">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative flex items-center gap-2 text-xs text-slate-500">
        <Icon name="shield" className="h-4 w-4" />
        Secured with token-based authentication
      </p>
    </aside>

    {/* Form panel */}
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-12 sm:px-8 lg:bg-white">
      <div className="w-full max-w-[400px] animate-fade-in">
        <Logo tone="dark" className="mb-10 lg:hidden" />

        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>

        {children}

        {footer && <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>}
      </div>
    </main>
  </div>
);

export default AuthLayout;
