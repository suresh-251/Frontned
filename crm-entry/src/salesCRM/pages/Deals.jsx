import "../styles/Leads.css";
import { useEffect, useMemo, useState } from "react";
import dealsAPI from "../api/deals.api";
import Toast from "../utils/toast";
import { IKanban, IRows } from "./leads/shared";

const STAGE_ORDER = [
  "New",
  "Prospect",
  "Qualification",
  "Qualified",
  "Proposal",
  "ProposalSent",
  "Negotiation",
  "ClosedWon",
  "ClosedLost",
];

const STAGE_META = {
  New: { color: "#0f766e", bg: "#ccfbf1" },
  Prospect: { color: "#2563eb", bg: "#dbeafe" },
  Qualification: { color: "#7c3aed", bg: "#ede9fe" },
  Qualified: { color: "#0891b2", bg: "#cffafe" },
  Proposal: { color: "#d97706", bg: "#fef3c7" },
  ProposalSent: { color: "#ea580c", bg: "#ffedd5" },
  Negotiation: { color: "#c2410c", bg: "#fed7aa" },
  ClosedWon: { color: "#15803d", bg: "#dcfce7" },
  ClosedLost: { color: "#dc2626", bg: "#fee2e2" },
};

const fmtCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs. 0.00";
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};

const normalizeStage = (deal) => deal?.stage || deal?.dealStage || deal?.status || "New";
const normalizeAmount = (deal) => Number(deal?.amount ?? deal?.dealValue ?? deal?.value ?? 0) || 0;
const normalizeClosingDate = (deal) => deal?.closingDate || deal?.expectedCloseDate || deal?.closeDate || null;
const getDealTitle = (deal) => deal?.title || deal?.subject || deal?.name || deal?.dealName || `Deal #${deal?.id ?? ""}`;
const getLeadRef = (deal) => deal?.leadName || deal?.leadTitle || deal?.lead?.name || (deal?.leadId ? `Lead ${deal.leadId}` : "-");
const getContactRole = (deal) => deal?.contactRole || deal?.role || deal?.contact?.role || "-";
const formatStageLabel = (value = "") => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").trim();

function DealsKanban({ deals }) {
  const grouped = useMemo(() => STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((deal) => normalizeStage(deal) === stage);
    return acc;
  }, {}), [deals]);

  return (
    <>
      <div className="kanban-toolbar">
        <div className="kanban-toolbar__title-wrap">
          <div className="kanban-toolbar__eyebrow">KANBAN VIEW</div>
          <div className="kanban-toolbar__title-row">
            <div className="kanban-toolbar__label">Deal stages</div>
            <div className="kanban-toolbar__hint">See every stage with its deal count and total annual revenue.</div>
          </div>
        </div>
      </div>
      <div className="kanban-board">
        {STAGE_ORDER.map((stage) => {
          const items = grouped[stage] || [];
          const totalAmount = items.reduce((sum, deal) => sum + normalizeAmount(deal), 0);
          const meta = STAGE_META[stage] || { color: "#334155", bg: "#e2e8f0" };
          return (
            <div key={stage} className="kanban-column" style={{ "--kanban-accent": meta.color, "--kanban-accent-bg": meta.bg }}>
              <div className="kanban-column__header" style={{ alignItems: "flex-start" }}>
                <div>
                  <div className="kanban-column__label">{formatStageLabel(stage)}</div>
                  <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: "#334155" }}>{fmtCurrency(totalAmount)}</div>
                </div>
                <span className="kanban-column__count">{items.length}</span>
              </div>
              <div className="kanban-column__list">
                {!items.length ? (
                  <div className="kanban-card" style={{ borderStyle: "dashed", color: "#94a3b8" }}>
                    No deals in this stage
                  </div>
                ) : items.map((deal) => (
                  <div key={deal.id || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="kanban-card">
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#334155" }}>{getDealTitle(deal)}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: "#475569" }}>{formatStageLabel(stage)}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: "#475569" }}>{getLeadRef(deal)}</div>
                    <div style={{ marginTop: 4, fontSize: 12.5, color: "#475569" }}>{getContactRole(deal)}</div>
                    <div style={{ marginTop: 8, fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>{fmtCurrency(normalizeAmount(deal))}</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, color: "#ef4444" }}>{fmtDate(normalizeClosingDate(deal))}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dealsAPI.getAll();
        setDeals(Array.isArray(data) ? data : []);
      } catch (error) {
        Toast.error(error?.response?.data?.message || "Unable to load deals");
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const totalValue = useMemo(() => deals.reduce((sum, deal) => sum + normalizeAmount(deal), 0), [deals]);
  const convertedCount = deals.filter((deal) => normalizeStage(deal) === "ClosedWon").length;

  return (
    <div className="page">
      <div className="stat-grid">
        <div className="stat-card" style={{ "--sc-card": "#f6fbf7", "--sc-icon": "#e6f6ea", "--sc-ink": "#2e7d32" }}>
          <div className="stat-header"><span className="stat-label">Total Deals</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{deals.length}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#f6f9fe", "--sc-icon": "#e3efff", "--sc-ink": "#1565c0" }}>
          <div className="stat-header"><span className="stat-label">Annual Revenue</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value" style={{ fontSize: 28 }}>{fmtCurrency(totalValue)}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#fffdf7", "--sc-icon": "#fff6dc", "--sc-ink": "#e65100" }}>
          <div className="stat-header"><span className="stat-label">Open Pipeline</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{deals.filter((deal) => !["ClosedWon", "ClosedLost"].includes(normalizeStage(deal))).length}</div></div></div>
        </div>
        <div className="stat-card" style={{ "--sc-card": "#fff6fa", "--sc-icon": "#ffe4ef", "--sc-ink": "#880e4f" }}>
          <div className="stat-header"><span className="stat-label">Closed Won</span></div>
          <div className="stat-body"><div className="stat-value-row"><div className="stat-value">{convertedCount}</div></div></div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-mid">
          <div style={{ display: "flex", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", background: "white" }}>
            {[{ k: "list", l: "List", I: IRows }, { k: "kanban", l: "Kanban", I: IKanban }].map(({ k, l, I }) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", border: "none", borderRight: k === "list" ? "1px solid #e5e7eb" : "none", background: viewMode === k ? "#eef2ff" : "transparent", color: viewMode === k ? "#4f46e5" : "#6b7280" }}>
                <I s={13} />{l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === "kanban" ? <DealsKanban deals={deals} /> : (
        <div className="table-card-shell">
          <div className="table-card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr className="thead-row">
                    <th className="th">Deal ID</th>
                    <th className="th">Deal Name</th>
                    <th className="th">Lead</th>
                    <th className="th">Stage</th>
                    <th className="th">Contact Role</th>
                    <th className="th">Annual Revenue</th>
                    <th className="th">Closing Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td className="td" colSpan={7}><span className="cell-txt">Loading deals...</span></td></tr> : null}
                  {!loading && !deals.length ? <tr><td className="td" colSpan={7}><span className="cell-txt">No deals available yet. Convert a lead to see it here.</span></td></tr> : null}
                  {!loading && deals.map((deal) => (
                    <tr key={deal.id || `${getDealTitle(deal)}-${normalizeClosingDate(deal) || "none"}`} className="row">
                      <td className="td"><span className="cell-txt">{deal.id ?? "-"}</span></td>
                      <td className="td"><span className="cell-txt" style={{ fontWeight: 800 }}>{getDealTitle(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{getLeadRef(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{formatStageLabel(normalizeStage(deal))}</span></td>
                      <td className="td"><span className="cell-txt">{getContactRole(deal)}</span></td>
                      <td className="td"><span className="cell-txt">{fmtCurrency(normalizeAmount(deal))}</span></td>
                      <td className="td"><span className="date-txt">{fmtDate(normalizeClosingDate(deal))}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
