import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import {
  DEFAULT_DEAL_FILTERS,
  formatStageLabel,
  RANGE_FILTER_SECTIONS,
  STAGE_ORDER,
} from "./shared";
import { IFilter, IX } from "../leads/shared";

export default function DealFilterModal({ filters, onApply, onClose, activeFilterCount }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => setLocalFilters(DEFAULT_DEAL_FILTERS);
  const panelBg = "var(--bg-card)";
  const panelBorder = "var(--border-color)";
  const primaryText = "var(--text-main)";
  const mutedText = "color-mix(in srgb, var(--text-main) 70%, #94a3b8)";
  const subtleText = "color-mix(in srgb, var(--text-main) 56%, #94a3b8)";
  const fieldStyle = {
    width: "100%",
    padding: "8px 12px",
    border: `1.5px solid ${panelBorder}`,
    borderRadius: "6px",
    fontSize: "13px",
    background: panelBg,
    color: primaryText,
  };
  const pairRow = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 };
  const dateInputs = [
    { key: "closingDateFrom", label: "From", placeholder: "From date" },
    { key: "closingDateTo", label: "To", placeholder: "To date" },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "340px", background: panelBg, boxShadow: "4px 0 20px rgba(0,0,0,0.15)", zIndex: 501, display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease-out", borderRight: `1px solid ${panelBorder}` }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: primaryText }}>Filter Deals</span>
            {activeFilterCount > 0 ? <span style={{ background: "#4f46e5", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "12px" }}>{activeFilterCount}</span> : null}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}>
            <IX s={16} c="#6b7280" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Deal Filters</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Stage</label>
              <select value={localFilters.stage} onChange={(event) => updateFilter("stage", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Stages</option>
                {STAGE_ORDER.map((stage) => <option key={stage} value={stage}>{formatStageLabel(stage)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Priority</label>
              <select value={localFilters.priority} onChange={(event) => updateFilter("priority", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Priorities</option>
                {["Low", "Medium", "High"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Owner</label>
              <input type="text" value={localFilters.owner} onChange={(event) => updateFilter("owner", event.target.value)} placeholder="Owner name" style={fieldStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Source</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Lead Source</label>
              <input type="text" value={localFilters.leadSource} onChange={(event) => updateFilter("leadSource", event.target.value)} placeholder="Lead source" style={fieldStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Campaign Source</label>
              <input type="text" value={localFilters.campaignSource} onChange={(event) => updateFilter("campaignSource", event.target.value)} placeholder="Campaign source" style={fieldStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Amount Range</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {RANGE_FILTER_SECTIONS.map((section) => (
                <div key={section.minKey} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: primaryText }}>{section.title}</span>
                    <span style={{ fontSize: 11, color: subtleText }}>{section.helper}</span>
                  </div>
                  <div style={pairRow}>
                    <input type="number" value={localFilters[section.minKey]} onChange={(event) => updateFilter(section.minKey, event.target.value)} placeholder={section.minPlaceholder} style={fieldStyle} />
                    <input type="number" value={localFilters[section.maxKey]} onChange={(event) => updateFilter(section.maxKey, event.target.value)} placeholder={section.maxPlaceholder} style={fieldStyle} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Closing Date</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={pairRow}>
                {dateInputs.map((input) => (
                  <div key={input.key} style={{ display: "grid", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: subtleText }}>{input.label}</span>
                    <DatePicker
                      selected={localFilters[input.key] ? new Date(localFilters[input.key]) : null}
                      onChange={(date) => updateFilter(input.key, date ? date.toISOString() : "")}
                      dateFormat="MMM d, yyyy"
                      className="deal-datepicker"
                      customInput={<input style={fieldStyle} placeholder={input.placeholder} />}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${panelBorder}`, display: "flex", gap: 8, background: "color-mix(in srgb, var(--bg-card) 78%, var(--bg-body))" }}>
          <button onClick={handleClear} style={{ flex: 1, padding: "8px 12px", background: panelBg, border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: primaryText, cursor: "pointer" }}>Clear All</button>
          <button onClick={handleApply} style={{ flex: 1, padding: "8px 12px", background: "#4f46e5", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>Apply {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
