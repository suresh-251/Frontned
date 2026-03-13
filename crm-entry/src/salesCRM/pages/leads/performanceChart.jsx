import { useEffect, useMemo, useState } from "react";
import { BarChart2, TrendingUp, X } from "lucide-react";
import { offsetDay, todayStr } from "./utils";

export function LeadsPerformanceChart({ onClose, leads }) {
  const [animated, setAnimated] = useState(false);
  const [tooltip, setTooltip] = useState(null);
  const [activeRange, setActiveRange] = useState("30");
  const [customRange, setCustomRange] = useState({ from: offsetDay(29), to: todayStr() });

  useEffect(() => {
    const timeoutId = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(timeoutId);
  }, []);

  const rangeInfo = useMemo(() => {
    if (activeRange === "custom") {
      const from = customRange.from ? new Date(`${customRange.from}T00:00:00`) : null;
      const to = customRange.to ? new Date(`${customRange.to}T00:00:00`) : null;
      if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
        return { days: 0, startDate: null, label: "Choose a valid range" };
      }
      const days = Math.max(1, Math.floor((to - from) / 86400000) + 1);
      return { days, startDate: from, label: `${customRange.from} to ${customRange.to}` };
    }

    const days = { 7: 7, 30: 30, 90: 90 }[activeRange];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    return { days, startDate, label: `${days} day window` };
  }, [activeRange, customRange]);

  const data = useMemo(() => {
    if (!rangeInfo.startDate || rangeInfo.days <= 0) return [];
    return Array.from({ length: rangeInfo.days }, (_, index) => {
      const date = new Date(rangeInfo.startDate);
      date.setDate(rangeInfo.startDate.getDate() + index);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const base = 10 + Math.sin(index * 0.4) * 8 + Math.random() * 18;
      const value = Math.round(Math.max(3, base));
      return { label, value, date };
    });
  }, [rangeInfo]);

  const safeData = data.length > 0 ? data : [{ label: "N/A", value: 0, date: new Date() }];
  const max = Math.max(...safeData.map((item) => item.value), 1);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const avg = data.length > 0 ? Math.round(total / data.length) : 0;
  const peak = data.length > 0 ? data.reduce((best, current) => (best.value > current.value ? best : current)) : { value: 0, label: "N/A" };
  const W = 720;
  const H = 220;
  const PAD = { t: 20, r: 20, b: 40, l: 48 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  const points = safeData.map((item, index) => ({
    x: PAD.l + (safeData.length === 1 ? 0.5 : index / (safeData.length - 1)) * chartW,
    y: PAD.t + chartH - (item.value / (max * 1.15 || 1)) * chartH,
    ...item,
  }));

  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previousPoint = points[index - 1];
    const controlX = (previousPoint.x + point.x) / 2;
    return `${acc} C ${controlX} ${previousPoint.y} ${controlX} ${point.y} ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${PAD.t + chartH} L ${points[0].x} ${PAD.t + chartH} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({ y: PAD.t + chartH - fraction * chartH, val: Math.round(fraction * max * 1.15) }));
  const xStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <>
      <div className="chart-overlay" onClick={onClose} />
      <div className="chart-stage">
        <div className={`chart-modal ${animated ? "chart-modal--open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <div className="chart-modal__header">
            <div className="chart-modal__header-main">
              <div className="chart-modal__icon"><BarChart2 size={17} color="#4f46e5" strokeWidth={2} /></div>
              <div>
                <div className="chart-modal__title">Leads Performance</div>
                <div className="chart-modal__subtitle">New leads over time</div>
              </div>
            </div>
            <div className="chart-modal__header-actions">
              <div className="chart-range-tabs">
                {[["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["custom", "Custom"]].map(([value, label]) => (
                  <button key={value} className={`chart-range-tab ${activeRange === value ? "chart-range-tab--active" : ""}`} onClick={() => setActiveRange(value)}>{label}</button>
                ))}
              </div>
              <button className="chart-modal__close" onClick={onClose}><X size={16} strokeWidth={2} /></button>
            </div>
          </div>

          {activeRange === "custom" && (
            <div className="chart-custom-range">
              <div className="chart-custom-range__field">
                <label>From</label>
                <input type="date" value={customRange.from} onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))} />
              </div>
              <div className="chart-custom-range__field">
                <label>To</label>
                <input type="date" value={customRange.to} onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))} />
              </div>
              <div className="chart-custom-range__summary">{rangeInfo.label}</div>
            </div>
          )}

          <div className="chart-summary-grid">
            {[
              { label: "Total New Leads", val: total, color: "#4f46e5" },
              { label: "Daily Average", val: avg, color: "#10b981" },
              { label: "Peak Day", val: peak.value, sub: peak.label, color: "#f59e0b" },
            ].map((stat, index) => (
              <div key={index} className="chart-summary-card">
                <div className="chart-summary-label">{stat.label} {stat.sub && <span className="chart-summary-sub">({stat.sub})</span>}</div>
                <div className="chart-summary-value" style={{ color: stat.color }}>{stat.val}</div>
              </div>
            ))}
          </div>

          <div className="chart-canvas-wrap" onMouseLeave={() => setTooltip(null)}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="chart-svg">
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" /></linearGradient>
                <clipPath id="chartClip"><rect x={PAD.l} y={PAD.t} width={chartW} height={chartH} /></clipPath>
                <filter id="lineShadow" x="-5%" y="-20%" width="110%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#4f46e5" floodOpacity="0.18" /></filter>
              </defs>
              {yTicks.map((tick, index) => <g key={index}><line x1={PAD.l} x2={W - PAD.r} y1={tick.y} y2={tick.y} stroke="#e8edf6" strokeWidth="1" /><text x={PAD.l - 8} y={tick.y + 4} textAnchor="end" fill="#94a3b8" fontFamily="Inter,sans-serif">{tick.val}</text></g>)}
              {points.filter((_, index) => index % xStep === 0 || index === points.length - 1).map((point, index) => <text key={index} x={point.x} y={H - 8} textAnchor="middle" fill="#94a3b8" fontFamily="Inter,sans-serif">{point.label}</text>)}
              {data.length > 0 && <g clipPath="url(#chartClip)"><path d={areaD} fill="url(#areaGrad)" style={{ opacity: animated ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }} /><path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" filter="url(#lineShadow)" style={{ strokeDasharray: 2000, strokeDashoffset: animated ? 0 : 2000, transition: "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1) 0.1s" }} /></g>}
              {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="14" fill="transparent" style={{ cursor: data.length > 0 ? "crosshair" : "default" }} onMouseEnter={() => data.length > 0 && setTooltip({ ...point, idx: index })} />)}
              {tooltip && data.length > 0 && <g><line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + chartH} stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" /><circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#4f46e5" stroke="white" strokeWidth="2.5" /></g>}
            </svg>

            {tooltip && data.length > 0 && <div className="chart-tooltip" style={{ left: `calc(${(tooltip.x / W) * 100}% - 70px)`, top: `${((tooltip.y - PAD.t) / H) * 100}%` }}><div className="chart-tooltip__label">{tooltip.label}</div><div className="chart-tooltip__value">{tooltip.value}</div><div className="chart-tooltip__meta"><TrendingUp size={10} strokeWidth={2.5} /> New Leads</div></div>}
            {data.length === 0 && <div className="chart-empty-state">Choose a valid custom date range to render the chart.</div>}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
}
