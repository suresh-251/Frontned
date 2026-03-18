import "../styles/Leads.css";
import { useEffect, useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
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

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      setLoading(true);
      try {
        const data = await accountsAPI.getById(accountId);
        if (!active) return;
        setAccount(normalizeAccount(data));
      } catch (error) {
        if (!active) return;
        Toast.error(error?.response?.data?.message || "Unable to load account");
        setAccount(null);
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
          {!loading && !account ? <div style={{ fontSize: 13, color: "#ef4444" }}>Unable to load account details.</div> : null}
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
  const inputStyle = { width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", background: "white", outline: "none" };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="modal-hdr">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <IFilter s={16} c="#4f46e5" />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Filter Accounts</span>
            {activeFilterCount > 0 ? <span style={{ background: "#4f46e5", color: "white", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 12 }}>{activeFilterCount}</span> : null}
          </div>
          <button className="icon-btn modal-close" onClick={onClose}><IX s={15} /></button>
        </div>
        <div className="modal-body" style={{ padding: "20px 24px", display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Industry</label>
            <input type="text" value={localFilters.industry} onChange={(event) => updateFilter("industry", event.target.value)} placeholder="Industry" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Category</label>
            <input type="text" value={localFilters.category} onChange={(event) => updateFilter("category", event.target.value)} placeholder="Category" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Region</label>
            <input type="text" value={localFilters.region} onChange={(event) => updateFilter("region", event.target.value)} placeholder="Region" style={inputStyle} />
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <button className="btn-ghost" onClick={() => setLocalFilters(DEFAULT_FILTERS)}>Clear</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => { onApply(localFilters); onClose(); }}>Apply</button>
          </div>
        </div>
      </div>
    </div>
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
      Toast.error(error?.response?.data?.message || "Unable to load accounts");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

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
      const message = String(error?.response?.data?.message || error?.response?.data || "");
      if (message.toLowerCase().includes("unique")) {
        setAccountFormError("Account name must be unique");
      } else {
        Toast.error(message || "Unable to create account");
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
      const message = String(error?.response?.data?.message || error?.response?.data || "");
      if (message.toLowerCase().includes("unique")) {
        setAccountFormError("Account name must be unique");
      } else {
        Toast.error(message || "Unable to update account");
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
      Toast.error(error?.response?.data?.message || "Unable to delete account");
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
                  {activeCols.map((col) => <th key={col.key} className={`th th-${col.key}`}>{col.label}</th>)}
                  <th className="th th-actions"><span className="th-inner">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="td" colSpan={activeCols.length + 1}><span className="cell-txt">Loading accounts...</span></td></tr> : null}
                {!loading && !filteredAccounts.length ? <tr><td className="td" colSpan={activeCols.length + 1}><span className="cell-txt">No accounts found.</span></td></tr> : null}
                {!loading && filteredAccounts.map((account, index) => (
                  <tr key={account.id || `${account.companyName}-${index}`} className="row">
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
