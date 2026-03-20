import "../styles/Leads.css";
import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import accountsAPI from "../api/accounts.api";
import Toast from "../utils/toast";
import { IFilter, ISettings, ISearch, IX } from "./leads/shared";

const ACCOUNT_COLUMNS = [
  { key: "serial", label: "No.", always: true },
  { key: "companyName", label: "Company", always: true },
  { key: "industry", label: "Industry", always: true },
  { key: "website", label: "Website", always: true },
  { key: "phone", label: "Phone", always: true },
  { key: "category", label: "Category", always: true },
  { key: "creditLimit", label: "Credit Limit", always: false },
  { key: "region", label: "Region", always: false },
  { key: "createdAt", label: "Created", always: false },
];

const ACCOUNT_SEARCH_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "companyName", label: "Company" },
  { value: "industry", label: "Industry" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "region", label: "Region" },
];

const EMPTY_ACCOUNT_FORM = {
  companyName: "",
  industry: "",
  website: "",
  phone: "",
  category: "Enterprise",
  creditLimit: "",
  region: "",
};

const DEFAULT_FILTERS = {
  industry: "",
  category: "",
  region: "",
};

const VISIBLE_ACCOUNT_COLUMNS_STORAGE_KEY = "crm_accounts_visible_columns";

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const normalizeAccount = (account = {}) => ({
  id: account.id ?? account.accountId ?? 0,
  companyName: account.companyName || account.name || "",
  industry: account.industry || "",
  website: account.website || "",
  phone: account.phone || "",
  category: account.category || "",
  owner: account.owner || account.accountOwner || account.ownerName || "",
  status: account.status || account.accountStatus || "",
  score: account.score ?? 0,
  creditLimit: account.creditLimit ?? 0,
  region: account.region || "",
  createdAt: account.createdAt || account.createdDate || "",
  notes: Array.isArray(account.notes) ? account.notes : [],
});

const normalizeCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const normalizeAccountName = (value) => String(value || "").trim().toLowerCase();

const getApiErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message.trim();
  if (typeof payload?.title === "string" && payload.title.trim()) return payload.title.trim();
  if (Array.isArray(payload?.errors)) {
    const firstError = payload.errors.find((item) => typeof item === "string" && item.trim());
    if (firstError) return firstError.trim();
  }
  if (payload?.errors && typeof payload.errors === "object") {
    const firstEntry = Object.values(payload.errors).flat().find((item) => typeof item === "string" && item.trim());
    if (firstEntry) return firstEntry.trim();
  }
  return fallback;
};

const getAccountNameError = (companyName, existingAccounts = [], currentAccountId = 0) => {
  const normalizedName = normalizeAccountName(companyName);
  if (!normalizedName) return "";

  const isDuplicate = existingAccounts.some((account) => (
    Number(account.id) !== Number(currentAccountId || 0)
    && normalizeAccountName(account.companyName) === normalizedName
  ));

  return isDuplicate ? "Account name must be unique" : "";
};

function AccountDetailModal({ accountId, onClose, onEdit }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await accountsAPI.getById(accountId);
        if (!active) return;
        setAccount(normalizeAccount(data));
      } catch (error) {
        if (!active) return;
        const message = getApiErrorMessage(error, "Unable to load account");
        Toast.error(message);
        setAccount(null);
        setLoadError(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAccount();
    return () => {
      active = false;
    };
  }, [accountId]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 720, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Account Details</div>
            <div className="modal-sub">{account?.companyName || "Loading account..."}</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14, overflowY: "auto" }}>
          {loading ? <div style={{ fontSize: 13, color: "#64748b" }}>Loading account details...</div> : null}
          {!loading && account ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc" }}>
                {[
                  { label: "Company", value: account.companyName },
                  { label: "Industry", value: account.industry },
                  { label: "Category", value: account.category },
                  { label: "Region", value: account.region },
                  { label: "Phone", value: account.phone },
                  { label: "Website", value: account.website },
                  { label: "Credit Limit", value: normalizeCurrency(account.creditLimit) },
                  { label: "Created", value: fmtDate(account.createdAt) },
                ].map((item) => (
                  <div key={item.label} style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b" }}>{item.label}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a", wordBreak: "break-word" }}>{item.value || "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#ffffff" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Notes</div>
                {account.notes.length ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {account.notes.map((note, index) => (
                      <div key={`${note}-${index}`} style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{note}</div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>No notes available for this account.</div>
                )}
              </div>
            </>
          ) : null}
          {!loading && !account ? <div style={{ fontSize: 13, color: "#ef4444" }}>{loadError || "Unable to load account details."}</div> : null}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          {account ? <button className="btn-primary" onClick={() => onEdit(account)}>Edit Account</button> : null}
        </div>
      </div>
    </div>
  );
}

function AccountFormModal({ mode, initialValues, existingAccounts, submitError, onClearSubmitError, onClose, onSave, saving }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_ACCOUNT_FORM, ...initialValues }));

  useEffect(() => {
    setForm({ ...EMPTY_ACCOUNT_FORM, ...initialValues });
  }, [initialValues]);

  const companyNameError = useMemo(
    () => getAccountNameError(form.companyName, existingAccounts, initialValues?.id),
    [existingAccounts, form.companyName, initialValues?.id],
  );

  const title = mode === "edit" ? "Edit Account" : "Add Account";
  const subtitle = mode === "edit" ? "Update account details using the Accounts API" : "Create a new account manually in CRM";

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 620, maxHeight: "85vh", display: "flex", flexDirection: "column" }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div>
            <div className="modal-title">{title}</div>
            <div className="modal-sub">{subtitle}</div>
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, overflowY: "auto" }}>
          {[
            { key: "companyName", label: "Company Name *", span: 2 },
            { key: "industry", label: "Industry" },
            { key: "category", label: "Category" },
            { key: "website", label: "Website" },
            { key: "phone", label: "Phone" },
            { key: "creditLimit", label: "Credit Limit", type: "number" },
            { key: "region", label: "Region" },
          ].map((field) => (
            <div key={field.key} style={{ gridColumn: field.span === 2 ? "1 / -1" : "auto" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{field.label}</label>
              <input
                type={field.type || "text"}
                value={form[field.key] ?? ""}
                onChange={(event) => {
                  if (field.key === "companyName" && submitError) onClearSubmitError();
                  setForm((current) => ({ ...current, [field.key]: event.target.value }));
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: `1.5px solid ${field.key === "companyName" && (companyNameError || submitError) ? "#ef4444" : "#e5e7eb"}`,
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                }}
              />
              {field.key === "companyName" && (companyNameError || submitError) ? (
                <div style={{ marginTop: 5, fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
                  {companyNameError || submitError}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)} disabled={saving || Boolean(companyNameError)}>{saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Account"}</button>
        </div>
      </div>
    </div>
  );
}

function AccountFilterModal({ filters, onApply, onClose, activeFilterCount }) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key, value) => setLocalFilters((current) => ({ ...current, [key]: value }));
  const panelBg = "var(--bg-card)";
  const panelBorder = "var(--border-color)";
  const primaryText = "var(--text-main)";
  const mutedText = "color-mix(in srgb, var(--text-main) 70%, #94a3b8)";
  const subtleText = "color-mix(in srgb, var(--text-main) 56%, #94a3b8)";
  const fieldStyle = { width: "100%", padding: "8px 12px", border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", background: panelBg, color: primaryText, outline: "none" };
  const handleApply = () => { onApply(localFilters); onClose(); };
  const handleClear = () => setLocalFilters(DEFAULT_FILTERS);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.35)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: 20, top: "50%", transform: "translateY(-50%)", width: "300px", maxWidth: "calc(100vw - 40px)", background: panelBg, boxShadow: "0 18px 42px rgba(0,0,0,0.22)", zIndex: 501, display: "flex", flexDirection: "column", animation: "panelDropIn 0.22s ease-out", border: `1px solid ${panelBorder}`, borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${panelBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: primaryText }}>Filter Accounts</span>
            {activeFilterCount > 0 ? <span style={{ background: "#4f46e5", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 12 }}>{activeFilterCount}</span> : null}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 4 }}><IX s={16} c="#6b7280" /></button>
        </div>
        <div style={{ padding: "16px 20px 12px" }}>
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: subtleText, margin: "0 0 12px 0" }}>Account Filters</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Industry</label>
              <input type="text" value={localFilters.industry} onChange={(event) => updateFilter("industry", event.target.value)} placeholder="Industry" style={fieldStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Category</label>
              <input type="text" value={localFilters.category} onChange={(event) => updateFilter("category", event.target.value)} placeholder="Category" style={fieldStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: mutedText, display: "block", marginBottom: 4 }}>Region</label>
              <input type="text" value={localFilters.region} onChange={(event) => updateFilter("region", event.target.value)} placeholder="Region" style={fieldStyle} />
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${panelBorder}`, display: "flex", gap: 8, background: "color-mix(in srgb, var(--bg-card) 78%, var(--bg-body))" }}>
          <button onClick={handleClear} style={{ flex: 1, padding: "8px 12px", background: panelBg, border: `1.5px solid ${panelBorder}`, borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: primaryText, cursor: "pointer" }}>Clear All</button>
          <button onClick={handleApply} style={{ flex: 1, padding: "8px 12px", background: "#4f46e5", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>Apply {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}</button>
        </div>
      </div>
      <style>{`
        @keyframes panelDropIn {
          from { opacity: 0; transform: translateY(calc(-50% - 8px)) scale(0.98); }
          to { opacity: 1; transform: translateY(-50%) scale(1); }
        }
      `}</style>
    </>
  );
}

function ManageAccountColumnsPanel({ visibleCols, setVisibleCols, wrapText, setWrapText, onClose }) {
  const toggleColumn = (key, always) => {
    if (always) return;
    setVisibleCols((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 420 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr"><div><div className="modal-title">Manage Columns</div><div className="modal-sub">Choose what appears in the accounts table</div></div><button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button></div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {ACCOUNT_COLUMNS.map((column) => (
              <label key={column.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
                <input type="checkbox" checked={column.always || visibleCols.includes(column.key)} disabled={column.always} onChange={() => toggleColumn(column.key, column.always)} />
                {column.label}
              </label>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <input type="checkbox" checked={wrapText} onChange={(event) => setWrapText(event.target.checked)} />
            Wrap table text
          </label>
        </div>
        <div className="modal-footer"><button className="btn-primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilter, setShowFilter] = useState(false);
  const [showColPanel, setShowColPanel] = useState(false);
  const [wrapText, setWrapText] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem(VISIBLE_ACCOUNT_COLUMNS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const allowed = new Set(ACCOUNT_COLUMNS.map((column) => column.key));
      if (Array.isArray(parsed) && parsed.length) return parsed.filter((key) => allowed.has(key));
    } catch {}
    return ACCOUNT_COLUMNS.map((column) => column.key).filter((key) => key !== "serial");
  });
  const [detailAccountId, setDetailAccountId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [accountFormError, setAccountFormError] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkOwner, setBulkOwner] = useState("");
  const [bulkStatus, setBulkStatus] = useState("Active");

  useEffect(() => {
    localStorage.setItem(VISIBLE_ACCOUNT_COLUMNS_STORAGE_KEY, JSON.stringify(visibleCols));
  }, [visibleCols]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await accountsAPI.getAll();
      const items = Array.isArray(data) ? data : Array.isArray(data?.accounts) ? data.accounts : [];
      setAccounts(items.map(normalizeAccount));
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to load accounts"));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    setSelected((current) => {
      const validIds = new Set(accounts.map((account) => Number(account.id || 0)).filter(Boolean));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [accounts]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.industry) count++;
    if (filters.category) count++;
    if (filters.region) count++;
    return count;
  }, [filters]);

  const activeSearchFieldLabel = useMemo(() => ACCOUNT_SEARCH_OPTIONS.find((option) => option.value === searchField)?.label || "All Details", [searchField]);
  const activeCols = useMemo(() => ACCOUNT_COLUMNS.filter((column) => column.always || visibleCols.includes(column.key)), [visibleCols]);

  const filteredAccounts = useMemo(() => {
    const query = String(search).trim().toLowerCase();
    return accounts.filter((account) => {
      if (filters.industry && !String(account.industry || "").toLowerCase().includes(filters.industry.toLowerCase())) return false;
      if (filters.category && !String(account.category || "").toLowerCase().includes(filters.category.toLowerCase())) return false;
      if (filters.region && !String(account.region || "").toLowerCase().includes(filters.region.toLowerCase())) return false;
      if (!query) return true;
      if (searchField === "all") {
        return [account.companyName, account.industry, account.website, account.phone, account.category, account.region].join(" ").toLowerCase().includes(query);
      }
      return String(account[searchField] || "").toLowerCase().includes(query);
    });
  }, [accounts, filters, search, searchField]);

  const selectedAccounts = useMemo(
    () => filteredAccounts.filter((account) => selected.has(Number(account.id || 0))),
    [filteredAccounts, selected]
  );
  const allFilteredSelected = filteredAccounts.length > 0 && filteredAccounts.every((account) => selected.has(Number(account.id || 0)));

  const toggleAllFiltered = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filteredAccounts.forEach((account) => next.delete(Number(account.id || 0)));
      } else {
        filteredAccounts.forEach((account) => {
          const accountId = Number(account.id || 0);
          if (accountId) next.add(accountId);
        });
      }
      return next;
    });
  };

  const toggleOne = (accountId) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(accountId)) next.delete(accountId);
      else next.add(accountId);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleCreateAccount = async (form) => {
    if (!String(form.companyName).trim()) {
      Toast.error("Company name is required");
      return;
    }

    const duplicateError = getAccountNameError(form.companyName, accounts);
    if (duplicateError) {
      setAccountFormError(duplicateError);
      return;
    }
    setAccountFormError("");
    setSaving(true);
    try {
      const createdAccount = await accountsAPI.create({ ...form, creditLimit: Number(form.creditLimit || 0) });
      const normalizedCreatedAccount = normalizeAccount(createdAccount);
      setAccounts((current) => {
        const remainingAccounts = current.filter((item) => item.id !== normalizedCreatedAccount.id);
        return [normalizedCreatedAccount, ...remainingAccounts];
      });
      Toast.success("Account created");
      setShowCreate(false);
      await loadAccounts();
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to create account");
      if (message.toLowerCase().includes("unique")) {
        setAccountFormError("Account name must be unique");
      } else {
        Toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditAccount = async (form) => {
    if (!editAccount?.id) return;
    if (!String(form.companyName).trim()) {
      Toast.error("Company name is required");
      return;
    }

    const duplicateError = getAccountNameError(form.companyName, accounts, editAccount.id);
    if (duplicateError) {
      setAccountFormError(duplicateError);
      return;
    }
    setAccountFormError("");
    setSaving(true);
    try {
      const updatedAccount = await accountsAPI.update(editAccount.id, {
        id: editAccount.id,
        ...form,
        creditLimit: Number(form.creditLimit || 0),
      });
      const normalizedUpdatedAccount = normalizeAccount(updatedAccount?.id ? updatedAccount : { ...editAccount, ...form, id: editAccount.id });
      setAccounts((current) => current.map((account) => (
        Number(account.id) === Number(editAccount.id) ? normalizedUpdatedAccount : account
      )));
      Toast.success("Account updated");
      setEditAccount(null);
      await loadAccounts();
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to update account");
      if (message.toLowerCase().includes("unique")) {
        setAccountFormError("Account name must be unique");
      } else {
        Toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Delete account "${account.companyName}"?`)) return;
    try {
      await accountsAPI.delete(account.id);
      Toast.success("Account deleted");
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      if (detailAccountId === account.id) setDetailAccountId(null);
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to delete account"));
    }
  };

  const handleExportSelected = () => {
    if (!selectedAccounts.length) return;
    const rows = selectedAccounts.map((account) => ({
      "Account ID": account.id,
      Company: account.companyName || "",
      Industry: account.industry || "",
      Website: account.website || "",
      Phone: account.phone || "",
      Category: account.category || "",
      Owner: account.owner || "",
      Status: account.status || "",
      "Credit Limit": account.creditLimit || 0,
      Region: account.region || "",
      Created: account.createdAt || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
    XLSX.writeFile(workbook, "sales-crm-accounts.xlsx");
  };

  const handleBulkOwnerUpdate = async () => {
    const ids = selectedAccounts.map((account) => Number(account.id || 0)).filter(Boolean);
    const ownerName = String(bulkOwner || "").trim();
    if (!ids.length || !ownerName) return;
    try {
      await Promise.all(ids.map((id) => accountsAPI.update(id, { owner: ownerName, accountOwner: ownerName, ownerName })));
      setAccounts((current) => current.map((account) => (
        ids.includes(Number(account.id || 0)) ? { ...account, owner: ownerName } : account
      )));
      Toast.success(`Updated owner for ${ids.length} account${ids.length > 1 ? "s" : ""}`);
      setBulkOwner("");
      clearSelection();
      await loadAccounts();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to update account owners"));
    }
  };

  const handleBulkStatusUpdate = async () => {
    const ids = selectedAccounts.map((account) => Number(account.id || 0)).filter(Boolean);
    if (!ids.length || !bulkStatus) return;
    try {
      await Promise.all(ids.map((id) => accountsAPI.update(id, { status: bulkStatus, accountStatus: bulkStatus })));
      setAccounts((current) => current.map((account) => (
        ids.includes(Number(account.id || 0)) ? { ...account, status: bulkStatus } : account
      )));
      Toast.success(`Updated status for ${ids.length} account${ids.length > 1 ? "s" : ""}`);
      clearSelection();
      await loadAccounts();
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to update account statuses"));
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedAccounts.map((account) => Number(account.id || 0)).filter(Boolean);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} selected account${ids.length > 1 ? "s" : ""}?`)) return;
    try {
      await Promise.all(ids.map((id) => accountsAPI.delete(id)));
      setAccounts((current) => current.filter((account) => !ids.includes(Number(account.id || 0))));
      Toast.success(`Deleted ${ids.length} account${ids.length > 1 ? "s" : ""}`);
      clearSelection();
      if (detailAccountId && ids.includes(Number(detailAccountId))) setDetailAccountId(null);
    } catch (error) {
      Toast.error(getApiErrorMessage(error, "Unable to delete selected accounts"));
      await loadAccounts();
    }
  };

  return (
    <div className="page sales-accounts-page">
      <div className="toolbar">
        <div className="toolbar-mid">
          <button className={`btn-ghost ${activeFilterCount > 0 ? "btn-ghost--active" : ""}`} onClick={() => setShowFilter(true)}><IFilter s={12} />&ensp;Filter{activeFilterCount > 0 ? <span className="filter-badge">{activeFilterCount}</span> : null}</button>
          <div className="toolbar-divider" />
          <div className="unified-search">
            <select className="search-field-select" value={searchField} onChange={(event) => setSearchField(event.target.value)}>
              {ACCOUNT_SEARCH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <div className="unified-divider" />
            <div className="search-wrap">
              <span className="search-ico"><ISearch s={14} c="#9ca3af" /></span>
              <input type="text" className="search-inp unified-inp" placeholder={`Search by ${activeSearchFieldLabel.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>
          <div className="toolbar-divider" />
          <button className={`icon-btn-outline ${showColPanel ? "icon-btn-outline--on" : ""}`} onClick={() => setShowColPanel(true)}><ISettings s={13} /></button>
          <div className="toolbar-divider" />
          <button className="btn-primary" onClick={() => { setAccountFormError(""); setShowCreate(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} />Add Account
          </button>
        </div>
      </div>

      {selectedAccounts.length ? (
        <div className="table-card-shell" style={{ marginBottom: 16 }}>
          <div className="table-card" style={{ padding: "12px 14px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>{selectedAccounts.length} account{selectedAccounts.length > 1 ? "s" : ""} selected</div>
            <button className="btn-ghost" onClick={handleExportSelected}>Export selected</button>
            <input
              type="text"
              value={bulkOwner}
              onChange={(event) => setBulkOwner(event.target.value)}
              placeholder="Assign owner"
              style={{ minWidth: 160, padding: "8px 10px", border: "1.5px solid var(--cborder)", borderRadius: 10, background: "var(--cs)", color: "var(--text-main)", outline: "none" }}
            />
            <button className="btn-ghost" onClick={handleBulkOwnerUpdate} disabled={!bulkOwner.trim()}>Assign owner</button>
            <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} style={{ minWidth: 140, padding: "8px 10px", border: "1.5px solid var(--cborder)", borderRadius: 10, background: "var(--cs)", color: "var(--text-main)" }}>
              {["Active", "Inactive", "Prospect", "Customer"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button className="btn-ghost" onClick={handleBulkStatusUpdate}>Change status</button>
            <button className="btn-ghost" onClick={handleBulkDelete} style={{ color: "#dc2626", borderColor: "color-mix(in srgb, #dc2626 18%, var(--cborder))" }}>Delete</button>
            <button className="btn-ghost" onClick={clearSelection}>Clear</button>
          </div>
        </div>
      ) : null}

      {(search || activeFilterCount > 0) ? (
        <div className="chips-bar">
          {search ? <span className="chip">{activeSearchFieldLabel}: &ldquo;{search}&rdquo;<button className="chip-x" onClick={() => setSearch("")}><IX s={9} c="#4f46e5" /></button></span> : null}
          {filters.industry ? <span className="chip">Industry: {filters.industry}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, industry: "" }))}><IX s={9} c="#4f46e5" /></button></span> : null}
          {filters.category ? <span className="chip">Category: {filters.category}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, category: "" }))}><IX s={9} c="#4f46e5" /></button></span> : null}
          {filters.region ? <span className="chip">Region: {filters.region}<button className="chip-x" onClick={() => setFilters((current) => ({ ...current, region: "" }))}><IX s={9} c="#4f46e5" /></button></span> : null}
          <button className="chip-clearall" onClick={() => { setSearch(""); setFilters(DEFAULT_FILTERS); }}>Clear all</button>
        </div>
      ) : null}

      <div className="table-card-shell">
        <div className="table-card">
          <div className="table-scroll">
            <table className={`table ${wrapText ? "table--wrap" : ""}`}>
              <thead>
                <tr className="thead-row">
                  <th className="th th-check"><input type="checkbox" className="cb" checked={allFilteredSelected} onChange={toggleAllFiltered} /></th>
                  {activeCols.map((col) => <th key={col.key} className={`th th-${col.key}`}>{col.label}</th>)}
                  <th className="th th-actions"><span className="th-inner">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="td" colSpan={activeCols.length + 2}><span className="cell-txt">Loading accounts...</span></td></tr> : null}
                {!loading && !filteredAccounts.length ? <tr><td className="td" colSpan={activeCols.length + 2}><span className="cell-txt">No accounts found.</span></td></tr> : null}
                {!loading && filteredAccounts.map((account, index) => (
                  <tr key={account.id || `${account.companyName}-${index}`} className="row">
                    <td className="td td-check"><input type="checkbox" className="cb" checked={selected.has(Number(account.id || 0))} onChange={() => toggleOne(Number(account.id || 0))} /></td>
                    {activeCols.map((col) => {
                      switch (col.key) {
                        case "serial":
                          return <td key="serial" className="td"><span className="cell-txt">{index + 1}</span></td>;
                        case "companyName":
                          return (
                            <td key="companyName" className="td td-name">
                              <div className="name-cell">
                                <div className="avatar sales-accounts-avatar"><Building2 size={14} /></div>
                                <div className="name-block">
                                  <button className="name-link sales-accounts-name-link" onClick={() => setDetailAccountId(account.id)}>{account.companyName || "-"}</button>
                                </div>
                              </div>
                            </td>
                          );
                        case "website":
                          return <td key="website" className="td td-contact"><div className="contact-cell">{account.website ? <span className="contact-email">{account.website}</span> : <span className="cell-txt">-</span>}</div></td>;
                        case "createdAt":
                          return <td key="createdAt" className="td"><span className="date-txt">{fmtDate(account.createdAt)}</span></td>;
                        case "creditLimit":
                          return <td key="creditLimit" className="td"><span className="cell-txt">{normalizeCurrency(account.creditLimit)}</span></td>;
                        default:
                          return <td key={col.key} className="td"><span className="cell-txt">{String(account[col.key] ?? "-")}</span></td>;
                      }
                    })}
                    <td className="td td-actions">
                      <div className="row-acts sales-accounts-row-actions" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <button className="act-btn act-btn--edit" onClick={() => { setAccountFormError(""); setEditAccount(account); }}><Pencil size={12} /></button>
                        <button className="act-btn act-btn--edit sales-accounts-delete-button" onClick={() => handleDeleteAccount(account)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailAccountId ? <AccountDetailModal accountId={detailAccountId} onClose={() => setDetailAccountId(null)} onEdit={(account) => { setAccountFormError(""); setDetailAccountId(null); setEditAccount(account); }} /> : null}
      {showCreate ? <AccountFormModal mode="create" initialValues={EMPTY_ACCOUNT_FORM} existingAccounts={accounts} submitError={accountFormError} onClearSubmitError={() => setAccountFormError("")} onClose={() => { setAccountFormError(""); setShowCreate(false); }} onSave={handleCreateAccount} saving={saving} /> : null}
      {editAccount ? <AccountFormModal mode="edit" initialValues={editAccount} existingAccounts={accounts} submitError={accountFormError} onClearSubmitError={() => setAccountFormError("")} onClose={() => { setAccountFormError(""); setEditAccount(null); }} onSave={handleEditAccount} saving={saving} /> : null}
      {showFilter ? <AccountFilterModal filters={filters} onApply={setFilters} onClose={() => setShowFilter(false)} activeFilterCount={activeFilterCount} /> : null}
      {showColPanel ? <ManageAccountColumnsPanel visibleCols={visibleCols} setVisibleCols={setVisibleCols} wrapText={wrapText} setWrapText={setWrapText} onClose={() => setShowColPanel(false)} /> : null}
    </div>
  );
}
