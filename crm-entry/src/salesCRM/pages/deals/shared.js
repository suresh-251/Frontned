export const STAGE_ORDER = [
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

export const STAGE_META = {
  New: { color: "#2563eb", bg: "#dbeafe" },
  Prospect: { color: "#0284c7", bg: "#e0f2fe" },
  Qualification: { color: "#7c3aed", bg: "#ede9fe" },
  Qualified: { color: "#0f766e", bg: "#ccfbf1" },
  Proposal: { color: "#b45309", bg: "#fef3c7" },
  ProposalSent: { color: "#c2410c", bg: "#ffedd5" },
  Negotiation: { color: "#ea580c", bg: "#fed7aa" },
  ClosedWon: { color: "#166534", bg: "#dcfce7" },
  ClosedLost: { color: "#b91c1c", bg: "#fee2e2" },
};

export const GET_ALL_DEALS_CLOSING_DATE = "2026-04-15T10:00:00Z";

export const SEARCH_FIELD_OPTIONS = [
  { value: "all", label: "All Details" },
  { value: "dealName", label: "Deal Name" },
  { value: "accountName", label: "Account" },
  { value: "contactName", label: "Contact" },
  { value: "dealOwner", label: "Owner" },
  { value: "stage", label: "Stage" },
  { value: "nextStep", label: "Next Step" },
  { value: "nextActivity", label: "Next Activity" },
  { value: "leadSource", label: "Lead Source" },
  { value: "campaignSource", label: "Campaign Source" },
  { value: "tags", label: "Tags" },
];

export const DEFAULT_DEAL_FILTERS = {
  stage: "All",
  owner: "",
  priority: "All",
  leadSource: "",
  campaignSource: "",
  minAmount: "",
  maxAmount: "",
  minExpectedRevenue: "",
  maxExpectedRevenue: "",
  closingDateFrom: "",
  closingDateTo: "",
};

export const RANGE_FILTER_SECTIONS = [
  {
    minKey: "minAmount",
    maxKey: "maxAmount",
    title: "Deal value",
    helper: "Total value of the opportunity",
    minPlaceholder: "Min amount",
    maxPlaceholder: "Max amount",
  },
  {
    minKey: "minExpectedRevenue",
    maxKey: "maxExpectedRevenue",
    title: "Expected revenue",
    helper: "Forecasted earnings",
    minPlaceholder: "Min expected revenue",
    maxPlaceholder: "Max expected revenue",
  },
];

export const fmtCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Rs. 0.00";
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
};

export const fmtDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB");
};

export const normalizeStage = (deal) => {
  const raw = deal?.stage || deal?.dealStage || deal?.status || "New";
  return STAGE_ORDER.includes(raw) ? raw : "New";
};

export const normalizeAmount = (deal) => Number(deal?.amount ?? deal?.dealValue ?? deal?.value ?? 0) || 0;
export const normalizeClosingDate = (deal) => deal?.closingDate || deal?.expectedCloseDate || deal?.closeDate || null;
export const getDealTitle = (deal) => deal?.dealName || deal?.title || deal?.subject || deal?.name || `Deal #${deal?.dealId ?? deal?.id ?? ""}`;
export const getDealId = (deal) => Number(deal?.dealId ?? deal?.id ?? 0);
export const getDealType = (deal) => deal?.type || deal?.dealType || "-";
export const formatStageLabel = (value = "") => String(value).replace(/([a-z])([A-Z])/g, "$1 $2").trim();
export const getAccountName = (deal) => deal?.accountName || deal?.account?.accountName || "-";
export const getContactName = (deal) => deal?.contactName || deal?.contact?.contactName || "-";
export const getCreatedTime = (deal) => deal?.createdTime || deal?.createdAt || null;
export const normalizeFilterText = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
