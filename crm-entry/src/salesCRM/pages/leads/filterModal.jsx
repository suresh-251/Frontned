import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import { CLEARED_FILTERS, LEAD_SOURCE_OPTIONS, RESPONSE_TYPES, STATUS_LIST } from "./constants";
import { formatLeadSource, formatStatus } from "./utils";
import { IFilter, IX, parseDateTimeValue, toDateTimeValue } from "./shared";

export function FilterModal({ onClose, filters, activeFilterCount, onApply, assignees = [] }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateField, setDateField] = useState(null);
  const [dateMode, setDateMode] = useState("date");
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => setLocalFilters((prev) => ({ ...prev, [key]: value }));
  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };
  const handleClear = () => setLocalFilters(CLEARED_FILTERS);
  const datePrefixLabel = dateField === "createdDate" ? "Created Date" : "Follow-Up";
  const fromKey = `${dateField}From`;
  const toKey = `${dateField}To`;
  const selectedSingleDate = dateField ? parseDateTimeValue(localFilters[fromKey] || localFilters[toKey]) : null;
  const panelBg = "var(--bg-card)";
  const panelBorder = "var(--border-color)";
  const primaryText = "var(--text-main)";
  const mutedText = "color-mix(in srgb, var(--text-main) 70%, #94a3b8)";
  const subtleText = "color-mix(in srgb, var(--text-main) 56%, #94a3b8)";
  const fieldStyle = { width: "100%", padding: "8px 12px", border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", background: panelBg, color: primaryText };

  const setSingleDate = (date) => {
    if (!date) {
      updateFilter(fromKey, "");
      updateFilter(toKey, "");
      return;
    }
    if (dateField === "followUpDate") {
      updateFilter(fromKey, toDateTimeValue(date));
      updateFilter(toKey, toDateTimeValue(date));
      return;
    }
    const fromDate = new Date(date);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(date);
    toDate.setHours(23, 59, 0, 0);
    updateFilter(fromKey, toDateTimeValue(fromDate));
    updateFilter(toKey, toDateTimeValue(toDate));
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "340px", background: panelBg, boxShadow: "4px 0 20px rgba(0,0,0,0.15)", zIndex: 501, display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease-out", borderRight: `1px solid ${panelBorder}` }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: primaryText }}>Filter Leads</span>
            {activeFilterCount > 0 && <span style={{ background: "#4f46e5", color: "white", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "12px" }}>{activeFilterCount}</span>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "4px" }}><IX s={16} c="#6b7280" /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Lead Filters</h4>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Status</label>
              <select value={localFilters.status} onChange={(event) => updateFilter("status", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Statuses</option>
                {STATUS_LIST.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Source</label>
              <select value={localFilters.source} onChange={(event) => updateFilter("source", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="All">All Sources</option>
                {LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{formatLeadSource(source)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Assignee</label>
              <select value={localFilters.assignee} onChange={(event) => updateFilter("assignee", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                {["All", ...assignees].map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Activity</h4>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Follow-Up Bucket</label>
              <select value={localFilters.followUp || "All"} onChange={(event) => updateFilter("followUp", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                {["All", "Today", "Overdue", "Upcoming"].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Last Contacted (days)</label>
              <input type="number" placeholder="Enter days" min="0" value={localFilters.lastContactedDays} onChange={(event) => updateFilter("lastContactedDays", event.target.value)} style={fieldStyle} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 500, color: mutedText, display: "block", marginBottom: "4px" }}>Responded To</label>
              <select value={localFilters.respondedTo} onChange={(event) => updateFilter("respondedTo", event.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
                {RESPONSE_TYPES.map((responseType) => <option key={responseType} value={responseType}>{responseType}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Date Range</h4>
            <div style={{ display: "inline-flex", gap: 6, padding: 4, borderRadius: 999, background: "color-mix(in srgb, var(--bg-card) 72%, var(--bg-body))", marginBottom: 12 }}>
              {[["createdDate", "Created Date"], ["followUpDate", "Follow-Up"]].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setDateField(value); setActiveDatePicker(null); }} style={{ padding: "6px 12px", border: "none", borderRadius: 999, background: dateField === value ? panelBg : "transparent", color: dateField === value ? "#4f46e5" : subtleText, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: dateField === value ? "0 1px 3px rgba(15,23,42,0.08)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>
            {dateField && <div style={{ display: "inline-flex", gap: 6, padding: 4, borderRadius: 999, background: "color-mix(in srgb, var(--bg-card) 72%, var(--bg-body))", marginBottom: 12 }}>
              {[["date", "Date"], ["range", "Time Range"]].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setDateMode(value); setActiveDatePicker(null); }} style={{ padding: "6px 12px", border: "none", borderRadius: 999, background: dateMode === value ? panelBg : "transparent", color: dateMode === value ? "#4f46e5" : subtleText, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: dateMode === value ? "0 1px 3px rgba(15,23,42,0.08)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>}
            {dateField && dateMode === "date" ? (
              <div style={{ position: "relative" }}>
                <button type="button" onClick={() => setActiveDatePicker((current) => current === "single" ? null : "single")} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${panelBorder}`, borderRadius: 10, background: panelBg, fontSize: 13, fontWeight: 600, color: primaryText, textAlign: "left", cursor: "pointer" }}>
                  {selectedSingleDate ? selectedSingleDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : `Select ${datePrefixLabel}`}
                </button>
                {activeDatePicker === "single" && (
                  <div style={{ marginTop: 10, border: `1.5px solid ${panelBorder}`, borderRadius: 14, overflow: "hidden", background: panelBg, width: "fit-content" }}>
                    <DatePicker
                      selected={selectedSingleDate}
                      onChange={(date) => { setSingleDate(date); setActiveDatePicker(null); }}
                      inline
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={12}
                      showTimeSelect={dateField === "followUpDate"}
                      timeIntervals={15}
                      dateFormat={dateField === "followUpDate" ? "MMM d, yyyy h:mm aa" : "MMM d, yyyy"}
                      calendarClassName="followup-datepicker"
                    />
                  </div>
                )}
              </div>
            ) : dateField ? (
              <div style={{ display: "grid", gap: 12 }}>
                {[["from", `${datePrefixLabel} From`, fromKey], ["to", `${datePrefixLabel} To`, toKey]].map(([pickerKey, label, key]) => (
                  <div key={pickerKey} style={{ position: "relative" }}>
                    <button type="button" onClick={() => setActiveDatePicker((current) => current === pickerKey ? null : pickerKey)} style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${panelBorder}`, borderRadius: 10, background: panelBg, fontSize: 13, fontWeight: 600, color: primaryText, textAlign: "left", cursor: "pointer" }}>
                      {localFilters[key] ? parseDateTimeValue(localFilters[key])?.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : label}
                    </button>
                    {activeDatePicker === pickerKey && (
                      <div style={{ marginTop: 10, border: `1.5px solid ${panelBorder}`, borderRadius: 14, overflow: "hidden", background: panelBg, width: "fit-content" }}>
                        <DatePicker selected={parseDateTimeValue(localFilters[key])} onChange={(date) => { updateFilter(key, toDateTimeValue(date)); setActiveDatePicker(null); }} inline showTimeSelect timeIntervals={15} dateFormat="MMM d, yyyy h:mm aa" showMonthDropdown showYearDropdown dropdownMode="select" yearDropdownItemNumber={12} calendarClassName="followup-datepicker" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Location</h4>
            <div style={{ marginBottom: "8px" }}>
              <input type="text" placeholder="Address" value={localFilters.address || ""} onChange={(event) => updateFilter("address", event.target.value)} style={{ ...fieldStyle, marginBottom: "8px" }} />
            </div>
            <div style={{ marginBottom: "8px" }}>
              <input type="text" placeholder="City" value={localFilters.city} onChange={(event) => updateFilter("city", event.target.value)} style={{ ...fieldStyle, marginBottom: "8px" }} />
            </div>
            <div style={{ marginBottom: "8px" }}>
              <input type="text" placeholder="Country" value={localFilters.country} onChange={(event) => updateFilter("country", event.target.value)} style={fieldStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 116px", gap: "8px" }}>
              <input type="text" placeholder="State" value={localFilters.state} onChange={(event) => updateFilter("state", event.target.value)} style={fieldStyle} />
              <input type="text" placeholder="Zip" value={localFilters.zip} onChange={(event) => updateFilter("zip", event.target.value)} style={fieldStyle} />
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${panelBorder}`, display: "flex", gap: "8px", background: "color-mix(in srgb, var(--bg-card) 78%, var(--bg-body))" }}>
          <button onClick={handleClear} style={{ flex: 1, padding: "8px 12px", background: panelBg, border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: primaryText, cursor: "pointer" }}>Clear All</button>
          <button onClick={handleApply} style={{ flex: 1, padding: "8px 12px", background: "#4f46e5", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "white", cursor: "pointer" }}>Apply {activeFilterCount > 0 && `(${activeFilterCount})`}</button>
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
