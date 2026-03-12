import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Globe,
  Handshake,
  Mail,
  Megaphone,
  Phone,
  Share2,
  Star,
  Upload,
  User,
  Users,
} from "lucide-react";

export const AVATAR_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
];

export const INITIAL_STATS = {
  totalNewLeads: 0,
  totalNewLeadsDueToday: 0,
  callsToMake: 0,
  callsToMakeDueToday: 0,
  emailsToSend: 0,
  emailsToSendDueToday: 0,
  meetingsToSchedule: 0,
  meetingsToScheduleDueToday: 0,
};

export const DEFAULT_FILTERS = {
  status: "All",
  source: "All",
  assignee: "All",
  createdDateFrom: "",
  createdDateTo: "",
  followUpDateFrom: "",
  followUpDateTo: "",
  lastContactedDays: "",
  respondedTo: "All",
  city: "",
  state: "",
  country: "",
  zip: "",
  followUp: "All",
};

export const CLEARED_FILTERS = {
  status: "All",
  source: "All",
  assignee: "All",
  createdDateFrom: "",
  createdDateTo: "",
  followUpDateFrom: "",
  followUpDateTo: "",
  lastContactedDays: "",
  respondedTo: "All",
  city: "",
  state: "",
  country: "",
  zip: "",
};

export const STAT_CARDS = [
  {
    label: "Total New Leads",
    key: "totalNewLeads",
    detailKey: "totalNewLeadsDueToday",
    detailLabel: "due today",
    helper: "Fresh opportunities waiting for action",
    icon: Users,
    alert: Bell,
    c: { card: "#f6fbf7", icon: "#e6f6ea", ink: "#2e7d32" },
  },
  {
    label: "Calls to Make",
    key: "callsToMake",
    detailKey: "callsToMakeDueToday",
    detailLabel: "due today",
    helper: "Outbound follow-ups needing attention",
    icon: Phone,
    alert: Bell,
    c: { card: "#f6f9fe", icon: "#e3efff", ink: "#1565c0" },
  },
  {
    label: "Emails to Send",
    key: "emailsToSend",
    detailKey: "emailsToSendDueToday",
    detailLabel: "due today",
    helper: "Pending email outreach in queue",
    icon: Mail,
    alert: AlertTriangle,
    c: { card: "#fffdf7", icon: "#fff6dc", ink: "#e65100" },
  },
  {
    label: "Meetings to Schedule",
    key: "meetingsToSchedule",
    detailKey: "meetingsToScheduleDueToday",
    detailLabel: "due today",
    helper: "Appointments ready to be booked",
    icon: Calendar,
    alert: CheckCircle,
    c: { card: "#fff6fa", icon: "#ffe4ef", ink: "#880e4f" },
  },
];

export const STATUS_LIST = [
  "FreshLead",
  "Contacted",
  "FollowUp",
  "Interested",
  "Qualified",
  "Negotiation",
  "Converted",
  "Lost",
  "NotInterested",
  "UnableToContact",
  "JunkLead",
  "Need Review",
];

export const STATUS_META = {
  FreshLead: { color: "#2563eb", bg: "#e0ecff" },
  Contacted: { color: "#0ea5e9", bg: "#e0f2fe" },
  FollowUp: { color: "#7c3aed", bg: "#ede9fe" },
  Interested: { color: "#16a34a", bg: "#dcfce7" },
  Qualified: { color: "#059669", bg: "#d1fae5" },
  Negotiation: { color: "#d97706", bg: "#fef3c7" },
  Converted: { color: "#047857", bg: "#d1fae5" },
  Lost: { color: "#dc2626", bg: "#fee2e2" },
  NotInterested: { color: "#ef4444", bg: "#fee2e2" },
  UnableToContact: { color: "#6b7280", bg: "#f3f4f6" },
  JunkLead: { color: "#374151", bg: "#e5e7eb" },
  "Need Review": { color: "#9333ea", bg: "#f3e8ff" },
};

export const RESPONSE_TYPES = ["All", "Email", "Call", "Message"];

export const LEAD_SOURCE_OPTIONS = [
  "AffiliateMarketingLeads",
  "ClientReferral",
  "ColdCall",
  "ContactUsForm",
  "CustomizedInput",
  "DubaiColdLeads",
  "DubaiNetworkingEvent",
  "EmailCampaign",
  "EmployeeReferrals",
  "FreshLead",
  "FxEducationJ1",
  "FxEducationJ2",
  "FxEducationJT01",
  "HotMarket",
  "IBReferrals",
  "LeadGenerationAgencies",
  "NetworkingEventsLeads",
  "PromotionalLeads",
  "SocialMedia",
  "SocialMediaAdvertising",
  "TelegramWhatsappLiveChat",
  "WebsiteSeoBlog",
  "WebsiteLiveChat",
  "WTMasterClassWebinar",
];

export const ALL_COLUMNS = [
  { key: "id", label: "ID", always: true },
  { key: "name", label: "Lead Name", always: true },
  { key: "company", label: "Company", always: false },
  { key: "phone", label: "Phone", always: false },
  { key: "email", label: "Email", always: false },
  { key: "status", label: "Status", always: false },
  { key: "followUp", label: "Follow-Up", always: false },
  { key: "assignee", label: "Assignee", always: false },
  { key: "source", label: "Source", always: false },
  { key: "score", label: "Score", always: false },
  { key: "deposits", label: "Deposits", always: false },
  { key: "comments", label: "Comments", always: false },
  { key: "createdDate", label: "Created At", always: false },
];

export const LEAD_TYPES = [
  { key: "manual", label: "Manual Lead", icon: User, source: "CustomizedInput" },
  { key: "social", label: "Social Lead", icon: Share2, source: "SocialMedia" },
  { key: "import", label: "Import Leads", icon: Upload, source: null },
  { key: "website", label: "Website Lead", icon: Globe, source: "ContactUsForm" },
  { key: "campaign", label: "Campaign Lead", icon: Megaphone, source: "EmailCampaign" },
  { key: "referral", label: "Referral Lead", icon: Handshake, source: "ClientReferral" },
  { key: "event", label: "Event Lead", icon: Calendar, source: "NetworkingEventsLeads" },
  { key: "partner", label: "Partner Lead", icon: Star, source: "IBReferrals" },
];

export const SOURCE_META = Object.fromEntries(LEAD_SOURCE_OPTIONS.map((source) => [source, {}]));

export const CSV_FIELD_MAP = {
  name: ["name", "lead name", "full name", "contact"],
  company: ["company", "organization", "org", "business"],
  email: ["email", "e-mail", "email address"],
  phone: ["phone", "phone number", "mobile", "tel"],
  address: ["address", "location", "street"],
  status: ["status", "lead status", "stage"],
  source: ["source", "lead source", "channel"],
  score: ["score", "lead score", "rating"],
  assignee: ["assignee", "owner", "assigned to", "rep"],
  createdDate: ["created", "created date", "date created", "created at"],
  followUpDate: ["follow up", "follow-up", "follow up date", "follow-up date", "followup"],
};

export const LEAD_FIELDS = [
  { key: "name", label: "Lead Name" },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status" },
  { key: "source", label: "Source" },
  { key: "score", label: "Score" },
  { key: "assignee", label: "Assignee" },
  { key: "createdDate", label: "Created Date" },
  { key: "followUpDate", label: "Follow-Up Date" },
];
