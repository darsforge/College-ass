import { COLORS, rupees, compact, monthLabel } from "../constants.js";

export default function Analysis({ summary }) {
  if (!summary) return <section className="card analysis"><h2>Spending analysis</h2><p className="muted">Loading...</p></section>;

  if (summary.count === 0) {
    return (
      <section className="card analysis">
        <h2>Spending analysis</h2>
        <p className="empty">No expenses in {monthLabel(summary.month, "long")} yet. Add one and the charts will appear here.</p>
      </section>
    );
  }

  // Donut: one conic-gradient segment per category
  let acc = 0;
  const stops = summary.byCategory
    .map((c) => {
      const from = acc;
      acc += c.percent;
      return `${COLORS[c.category]} ${from}% ${acc}%`;
    })
    .join(", ");

  const maxTrend = Math.max(...summary.trend.map((t) => t.total), 1);

  return (
    <section className="card analysis">
      <h2>Spending analysis</h2>

      <div className="split">
        <div className="donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label="Spending by category">
          <div className="donut-hole">
            <strong>{rupees(summary.total)}</strong>
            <span>{monthLabel(summary.month, "long")}</span>
          </div>
        </div>

        <ul className="legend">
          {summary.byCategory.map((c) => (
            <li key={c.category}>
              <span className="dot" style={{ background: COLORS[c.category] }} />
              <span className="legend-name">{c.category}</span>
              <span className="legend-pct">{Math.round(c.percent)}%</span>
              <span className="legend-amt">{rupees(c.total)}</span>
            </li>
          ))}
        </ul>
      </div>

      <h3>Last 6 months</h3>
      <div className="trend">
        {summary.trend.map((t, i) => (
          <div className={"trend-col" + (i === summary.trend.length - 1 ? " current" : "")} key={t.month}>
            <span className="trend-val">{t.total ? compact(t.total) : ""}</span>
            <div className="trend-bar" style={{ height: `${(t.total / maxTrend) * 100}%` }} />
            <span className="trend-label">{monthLabel(t.month)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
