import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { ALL_COLUMNS, LEAD_FIELDS, LEAD_SOURCE_OPTIONS, LEAD_TYPES } from "./constants";
import { formatLeadSource, guessField, leadToUpdatePayload, parseCSV, sanitizeLeadSource, sanitizeStatus, splitFullName } from "./utils";
import { IChevD, IPlus, IUpload, IX, parseDateTimeValue, toDateTimeValue, useClickOutside } from "./shared";

const autoGrowTextarea = (event) => {
  const textarea = event.currentTarget;
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export function AddLeadDropdown({ onSelectType }) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const ref = useRef(null);
  const primaryLeadTypes = LEAD_TYPES.slice(0, 3);
  const secondaryLeadTypes = LEAD_TYPES.slice(3);
  useClickOutside(ref, () => {
    setOpen(false);
    setShowMore(false);
  });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn-primary" onClick={() => setOpen((current) => !current)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <IPlus s={12} />Add Lead<IChevD s={10} c="white" />
      </button>
      {open && (
        <div className="add-lead-menu">
          {primaryLeadTypes.map((leadType) => {
            const IconComp = leadType.icon;
            return (
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); setShowMore(false); onSelectType(leadType); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{leadType.label}
              </button>
            );
          })}
          {secondaryLeadTypes.length ? <div className="add-lead-divider" /> : null}
          {secondaryLeadTypes.length ? <button type="button" className={`add-lead-more-toggle ${showMore ? "add-lead-more-toggle--open" : ""}`} onClick={() => setShowMore((current) => !current)}>
            <span>More Types</span>
            <IChevD s={11} />
          </button> : null}
          {showMore && secondaryLeadTypes.map((leadType) => {
            const IconComp = leadType.icon;
            return (
              <button key={leadType.key} className="add-lead-option" onClick={() => { setOpen(false); setShowMore(false); onSelectType(leadType); }}>
                <span className="add-lead-opt-icon"><IconComp size={13} strokeWidth={1.8} /></span>{leadType.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CreateLeadModal({ leadType, onClose, onSave }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    secondaryEmail: "",
    phone: "",
    secondaryPhone: "",
    company: "",
    position: "",
    industry: "",
    website: "",
    source: leadType?.source || "CustomizedInput",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    comments: "",
    description: "",
    whatsappEnabled: false,
  });
  const handle = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    const splitName = splitFullName(form.fullName);
    if (!splitName.firstName) return;
    onSave({
      firstName: splitName.firstName,
      lastName: splitName.lastName,
      title: "",
      email: form.email,
      secondaryEmail: form.secondaryEmail,
      phone: form.phone,
      secondaryPhone: form.secondaryPhone,
      company: form.company,
      position: form.position,
      industry: form.industry,
      website: form.website,
      source: form.source,
      tags: "",
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      zipCode: form.zipCode,
      comments: form.comments,
      description: form.description,
      whatsappEnabled: !!form.whatsappEnabled,
    });
    onClose();
  };

  const inputStyle = { width: "100%", padding: "10px 12px", border: "1.5px solid #dbe4f0", borderRadius: "12px", fontSize: "13px", outline: "none", color: "#334155", background: "#ffffff" };
  const textareaStyle = { ...inputStyle, minHeight: 52, lineHeight: 1.5, resize: "none", overflow: "hidden" };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div><div className="modal-title">Create {leadType?.label || "New Lead"}</div><div className="modal-sub">Fill in the lead details below</div></div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", maxHeight: "70vh", overflowY: "auto" }}>
          {[
            { label: "Full Name *", key: "fullName", span: 2 },
            { label: "Company", key: "company" },
            { label: "Email", key: "email", type: "email" },
            { label: "Secondary Email", key: "secondaryEmail", type: "email" },
            { label: "Phone", key: "phone" },
            { label: "Secondary Phone", key: "secondaryPhone" },
            { label: "Position", key: "position" },
            { label: "Industry", key: "industry" },
            { label: "Website", key: "website", span: 2 },
            { label: "Address", key: "address", span: 2 },
            { label: "City", key: "city" },
            { label: "State", key: "state" },
            { label: "Country", key: "country" },
            { label: "Zip Code", key: "zipCode" },
            { label: "Comments", key: "comments", span: 2 },
            { label: "Description", key: "description", span: 2 },
          ].map((field) => (
            <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{field.label}</label>
              {field.key === "comments" || field.key === "description" ? (
                <textarea
                  rows={1}
                  value={form[field.key]}
                  onChange={(event) => handle(field.key, event.target.value)}
                  onInput={autoGrowTextarea}
                  style={textareaStyle}
                />
              ) : (
                <input type={field.type || "text"} value={form[field.key]} onChange={(event) => handle(field.key, event.target.value)} style={inputStyle} />
              )}
            </div>
          ))}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Source</label>
            <select value={form.source} onChange={(event) => handle("source", event.target.value)} style={{ ...inputStyle, background: "white" }}>{LEAD_SOURCE_OPTIONS.map((source) => <option key={source} value={source}>{formatLeadSource(source)}</option>)}</select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 24 }}>
            <input type="checkbox" checked={!!form.whatsappEnabled} onChange={(event) => handle("whatsappEnabled", event.target.checked)} />
            WhatsApp Enabled
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>Create Lead</button>
        </div>
      </div>
    </div>
  );
}

export function EditModal({ lead, onClose, onSave, onDelete, salesUsers = [], saving = false, deleting = false }) {
  const [form, setForm] = useState(() => leadToUpdatePayload(lead));

  useEffect(() => {
    setForm(leadToUpdatePayload(lead));
  }, [lead]);

  const handle = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const inputStyle = { width: "100%", padding: "10px 12px", border: "1.5px solid #dbe4f0", borderRadius: "12px", fontSize: "13px", outline: "none", color: "#334155", background: "#ffffff" };
  const textareaStyle = { ...inputStyle, minHeight: 52, lineHeight: 1.5, resize: "none", overflow: "hidden" };
  const fields = [
    { label: "First Name", key: "firstName" },
    { label: "Last Name", key: "lastName" },
    { label: "Email", key: "email", type: "email" },
    { label: "Secondary Email", key: "secondaryEmail", type: "email" },
    { label: "Phone", key: "phone" },
    { label: "Company", key: "company" },
    { label: "Position", key: "position" },
    { label: "Industry", key: "industry" },
    { label: "Tags", key: "tags" },
    { label: "Rating", key: "rating" },
    { label: "Address", key: "address", span: 2 },
    { label: "City", key: "city" },
    { label: "State", key: "state" },
    { label: "Country", key: "country" },
    { label: "Zip Code", key: "zipCode" },
    { label: "Comments", key: "comments" },
    { label: "Description", key: "description" },
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 760, maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr"><div><div className="modal-title">Edit Lead</div><div className="modal-sub">{lead.name}</div></div><button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button></div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", overflowY: "auto" }}>
          {fields.map((field) => (
            <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>{field.label}</label>
              {field.key === "comments" || field.key === "description" ? (
                <textarea
                  rows={1}
                  value={form[field.key] || ""}
                  onChange={(event) => handle(field.key, event.target.value)}
                  onInput={autoGrowTextarea}
                  style={textareaStyle}
                />
              ) : (
                <input type={field.type || "text"} value={form[field.key] || ""} onChange={(event) => handle(field.key, event.target.value)} style={inputStyle} />
              )}
            </div>
          ))}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Assigned Sales User</label>
            <select value={form.assignedToUserId || 0} onChange={(event) => handle("assignedToUserId", parseInt(event.target.value, 10) || 0)} style={{ ...inputStyle, background: "white" }}>
              <option value={0}>Unassigned</option>
              {salesUsers.map((user) => <option key={user.id || user.userId} value={user.id || user.userId}>{user.name || user.username || user.email}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "5px" }}>Next Follow-Up</label>
            <DatePicker
              selected={parseDateTimeValue(form.nextFollowUpAt)}
              onChange={(date) => handle("nextFollowUpAt", date ? `${toDateTimeValue(date)}:00` : null)}
              showTimeSelect
              timeIntervals={15}
              dateFormat="MMM d, yyyy h:mm aa"
              className="lead-followup-datepicker"
              wrapperClassName="lead-followup-datepicker-wrapper"
              customInput={<input style={inputStyle} />}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 24 }}>
            <input type="checkbox" checked={!!form.whatsappEnabled} onChange={(event) => handle("whatsappEnabled", event.target.checked)} />
            WhatsApp Enabled
          </label>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <button className="btn-ghost" onClick={() => onDelete(lead.id)} disabled={deleting || saving} style={{ color: "#dc2626", borderColor: "#fecaca" }}>{deleting ? "Deleting..." : "Delete Lead"}</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={onClose} disabled={saving || deleting}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(lead.id, form)} disabled={saving || deleting}>{saving ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ManageColumnsPanel({ visibleCols, setVisibleCols, rowsPerPage, setRowsPerPage, wrapText, setWrapText, onClose }) {
  const toggleColumn = (key, always) => {
    if (always) return;
    setVisibleCols((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr"><div><div className="modal-title">Manage Columns</div><div className="modal-sub">Choose what appears in the leads table</div></div><button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button></div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {ALL_COLUMNS.map((column) => <label key={column.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}><input type="checkbox" checked={column.always || visibleCols.includes(column.key)} disabled={column.always} onChange={() => toggleColumn(column.key, column.always)} />{column.label}</label>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Rows Per Page</label>
              <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))} style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 6, background: "white" }}>
                {[10, 20, 30, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginTop: 24 }}>
              <input type="checkbox" checked={wrapText} onChange={(event) => setWrapText(event.target.checked)} />Wrap table text
            </label>
          </div>
        </div>
        <div className="modal-footer"><button className="btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

export function ImportModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    try {
      setImporting(true);
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      const dataRows = rows.filter((row) => Object.values(row || {}).some(Boolean));
      const imported = dataRows.map((row) => {
        const mapped = {
          firstName: "",
          lastName: "",
          email: "",
          secondaryEmail: "",
          phone: "",
          secondaryPhone: "",
          company: "",
          position: "",
          industry: "",
          website: "",
          source: "CustomizedInput",
          tags: "",
          address: "",
          city: "",
          state: "",
          country: "",
          zipCode: "",
          comments: "",
          description: "",
          whatsappEnabled: false,
          name: "",
        };

        headers.forEach((header) => {
          const field = guessField(header, LEAD_FIELDS);
          if (field) mapped[field] = row[header] || "";
        });

        if (mapped.name && !mapped.firstName && !mapped.lastName) {
          const parts = splitFullName(mapped.name);
          mapped.firstName = parts.firstName;
          mapped.lastName = parts.lastName;
        }

        mapped.status = sanitizeStatus(mapped.status);
        mapped.source = sanitizeLeadSource(mapped.source);

        delete mapped.name;
        return mapped;
      });
      await onImport(imported);
      onClose();
    } catch (importError) {
      setError(importError.message || "Failed to import file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr"><div><div className="modal-title">Import Leads</div><div className="modal-sub">Upload a CSV file to add leads in bulk</div></div><button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button></div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 10, padding: 18, border: "1.5px dashed #cbd5e1", borderRadius: 12, background: "#f8fafc", cursor: "pointer", textAlign: "center" }}>
            <IUpload s={16} c="#4f46e5" />
            <span>{fileName || "Choose CSV file"}</span>
            <span className="drop-hint">name, email, phone, company, status, source, assignee</span>
            <input type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} disabled={importing} />
          </label>
          {importing && <div style={{ fontSize: 12, color: "#475569" }}>Importing leads...</div>}
          {error && <div style={{ fontSize: 12, color: "#dc2626" }}>{error}</div>}
        </div>
        <div className="modal-footer"><button className="btn-ghost" onClick={onClose} disabled={importing}>Cancel</button></div>
      </div>
    </div>
  );
}
