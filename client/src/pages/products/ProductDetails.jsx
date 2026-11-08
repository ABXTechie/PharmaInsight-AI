import { Link, useParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import usePatterns from "../../hooks/usePatterns";
import Icon from "../../components/ui/Icon";
import { Alert, EmptyState, KpiCard, PageHeader, Section, Skeleton } from "../../components/ui/Primitives";
import AttentionList from "../../components/patterns/AttentionList";
import { ShareBar, TrendBadge } from "../../components/patterns/PatternBadges";
import { formatDate, formatINR, formatNumber } from "../../utils/format";

const MonthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="tabular text-sm font-semibold text-slate-900">{formatNumber(row.units)} units</p>
      <p className="tabular text-xs text-slate-500">{formatINR(row.revenue)}</p>
    </div>
  );
};

const CustomerRow = ({ to, title, children, right }) => (
  <li>
    <Link to={to} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{title}</p>
        {children && <p className="mt-0.5 truncate text-xs text-slate-500">{children}</p>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </Link>
  </li>
);

const ProductDetails = () => {
  const { id } = useParams();
  const { patterns, loading, error } = usePatterns();
  const product = patterns?.products?.find((p) => p.productId === id);
  const alerts = (patterns?.attention || []).filter((a) => a.productId === id && !a.customerId);
  const buyingCustomers = patterns?.summary?.buyingCustomers || 0;

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading product">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <PageHeader backTo="/products" backLabel="Back to Products" title="Product" />
        <Alert>{error || "Product not found."}</Alert>
      </div>
    );
  }

  const hasSales = product.sales > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        backTo="/products"
        backLabel="Back to Products"
        eyebrow={product.category}
        title={product.name}
        description={product.company}
        actions={<TrendBadge trend={product.trend} />}
      />

      <section aria-label="Product metrics" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard label="Revenue" value={formatINR(product.revenue)} icon="rupee" accent="brand" hint="All recorded sales" />
        <KpiCard label="Units sold" value={formatNumber(product.units)} icon="package" hint={`${product.sales} orders`} />
        <KpiCard
          label="Last 30 days"
          value={`${formatNumber(product.trend.unitsRecent)} units`}
          icon="trend"
          hint={`${formatNumber(product.trend.unitsPrevious)} in the 30 days before`}
        />
        <KpiCard
          label="Customer reach"
          value={`${product.customerCount} / ${buyingCustomers}`}
          icon="users"
          hint={`${product.reachPercent}% of buying customers`}
        />
      </section>

      {alerts.length > 0 && (
        <Section title="What's changed" bodyClassName="">
          <AttentionList items={alerts} getLink={() => null} />
        </Section>
      )}

      {!hasSales ? (
        <div className="card">
          <EmptyState
            icon="pill"
            title="No sales recorded for this product yet"
            description="Once it's sold, you'll see who buys it, trends and opportunities here."
          />
        </div>
      ) : (
        <>
          <Section title="Monthly sales" description="Units sold over the last 6 months." bodyClassName="px-2 pb-4 pt-5 sm:px-4">
            <figure className="h-56">
              <figcaption className="sr-only">
                Units per month: {product.monthly.map((m) => `${m.month} ${m.units}`).join(", ")}.
              </figcaption>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={product.monthly} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef0f4" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#939cad", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#939cad", fontSize: 12 }} width={40} allowDecimals={false} />
                  <Tooltip content={<MonthTooltip />} cursor={{ fill: "#f6f7f9" }} />
                  <Bar dataKey="units" fill="#129977" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            </figure>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Who buys it" description="Customers ranked by revenue from this product." bodyClassName="">
              <ul className="divide-y divide-slate-100">
                {product.topCustomers.map((c) => (
                  <CustomerRow
                    key={c.customerId}
                    to={`/customers/${c.customerId}`}
                    title={c.shopName}
                    right={
                      <>
                        <p className="tabular text-sm font-semibold text-slate-900">{formatINR(c.revenue)}</p>
                        <p className="text-xs text-slate-400">{formatNumber(c.units)} units</p>
                      </>
                    }
                  >
                    {c.purchases} {c.purchases === 1 ? "order" : "orders"} · last {formatDate(c.lastBought, { day: "numeric", month: "short" })}
                  </CustomerRow>
                ))}
              </ul>
            </Section>

            <Section
              title="Sales opportunities"
              description="Active customers who have never ordered this product."
              bodyClassName=""
            >
              {product.opportunities.length ? (
                <ul className="divide-y divide-slate-100">
                  {product.opportunities.map((o) => (
                    <CustomerRow
                      key={o.customerId}
                      to={`/customers/${o.customerId}`}
                      title={o.shopName}
                      right={<Icon name="arrowUpRight" className="h-4 w-4 text-blue-600" />}
                    >
                      {o.similarCustomersBuying > 0
                        ? `${o.similarCustomersBuying} similar ${o.similarCustomersBuying === 1 ? "shop buys" : "shops buy"} it`
                        : "Active customer · never ordered"}
                    </CustomerRow>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">Every active customer already buys it.</p>
              )}
            </Section>

            <Section title="Stopped buying it" description="Regular buyers who dropped it from recent orders." bodyClassName="">
              {product.lapsedCustomers.length ? (
                <ul className="divide-y divide-slate-100">
                  {product.lapsedCustomers.map((c) => (
                    <CustomerRow key={c.customerId} to={`/customers/${c.customerId}`} title={c.shopName}>
                      <span className="text-red-700">Missing from their last {c.ordersSince} orders</span> · last bought{" "}
                      {formatDate(c.lastBought)}
                    </CustomerRow>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">No regular buyer has dropped it.</p>
              )}
            </Section>

            <Section title="Often bought with" description="Products that appear in the same orders." bodyClassName="">
              {product.boughtWith.length ? (
                <ul className="divide-y divide-slate-100">
                  {product.boughtWith.map((b) => (
                    <li key={b.productId}>
                      <Link
                        to={`/products/${b.productId}`}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80 sm:px-6"
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{b.name}</span>
                        <ShareBar value={b.percentOfSales} className="w-16" />
                        <span className="tabular w-24 shrink-0 text-right text-xs text-slate-500">
                          {b.percentOfSales}% of orders
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-slate-500 sm:px-6">Not enough shared orders yet.</p>
              )}
            </Section>
          </div>

          {product.price && (
            <Section
              title="Price check"
              description={`Average selling price per customer, last ${product.price.windowDays} days.`}
              bodyClassName=""
              actions={
                product.price.flagged ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                    {product.price.spreadPercent}% price gap
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Consistent pricing</span>
                )
              }
            >
              <ul className="divide-y divide-slate-100">
                {product.price.byCustomer.map((row) => (
                  <li key={row.customerId} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                    <Link to={`/customers/${row.customerId}`} className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-blue-700">
                      {row.shopName}
                    </Link>
                    <span className="tabular text-xs text-slate-400">{formatNumber(row.units)} units</span>
                    <span
                      className={`tabular w-24 text-right text-sm font-semibold ${
                        product.price.flagged && row.averagePrice === product.price.min ? "text-amber-700" : "text-slate-900"
                      }`}
                    >
                      {formatINR(row.averagePrice)}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      )}
    </div>
  );
};

export default ProductDetails;
