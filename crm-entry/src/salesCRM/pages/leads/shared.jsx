/* eslint-disable react-refresh/only-export-components */
import { memo, useEffect } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";

export const Icon = ({ id, size = 18, color = "currentColor", sw = 1.8 }) => {
  const Component = id;
  return <Component size={size} color={color} strokeWidth={sw} aria-hidden="true" />;
};

const mkI = (iconFactory) => {
  const Component = iconFactory;
  return ({ s = 14, c = "currentColor", sw = 1.7, ...rest }) => (
    <Component size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
  );
};

export const ISearch = mkI(Search);
export const IChevD = mkI(ChevronDown);
export const IChevU = mkI(ChevronUp);
export const IChevR = mkI(ChevronRight);
export const IChevL = mkI(ChevronLeft);
export const IX = mkI(X);
export const ICal = mkI(Calendar);
export const IPlus = ({ s = 14, c = "currentColor", sw = 2.2, ...rest }) => (
  <Plus size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);
export const IEdit = mkI(Edit2);
export const IPhone = mkI(Phone);
export const IMail = mkI(Mail);
export const ISettings = mkI(Settings);
export const ICheck = ({ s = 14, c = "currentColor", sw = 2.5, ...rest }) => (
  <Check size={s} color={c} strokeWidth={sw} aria-hidden="true" {...rest} />
);
export const IFilter = mkI(Filter);
export const IRows = mkI(List);
export const IUpload = mkI(Upload);
export const IKanban = mkI(LayoutGrid);
export const ITrash = mkI(Trash2);

export const parseDateTimeValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toDateTimeValue = (date) => {
  if (!date) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function useClickOutside(ref, cb) {
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) cb();
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [ref, cb]);
}

export const StatCard = memo(({ label, value, detailValue = 0, detailLabel = "due today", icon, alert, c, delay, onClick = null }) => {
  const CardTag = onClick ? "button" : "div";
  return (
  <CardTag
    className="stat-card"
    style={{ "--sc-delay": delay, "--sc-card": c.card, "--sc-icon": c.icon, "--sc-ink": c.ink, ...(onClick ? { padding: 0, textAlign: "left", cursor: "pointer" } : {}) }}
    onClick={onClick || undefined}
    type={onClick ? "button" : undefined}
  >
    <div className="stat-header">
      <div className="stat-icon-wrap"><Icon id={icon} size={18} color="var(--sc-ink)" /></div>
      <span className="stat-label">{label}</span>
      <div className="stat-alert">
        <Icon id={alert} size={14} color="var(--sc-ink)" sw={2} />
      </div>
    </div>
    <div className="stat-body">
      <div className="stat-value-row">
        <div className="stat-value">{value}</div>
        <div className="stat-change">
          <TrendingUp size={12} color="var(--sc-ink)" strokeWidth={2.5} aria-hidden="true" />
          <span>{detailValue} {detailLabel}</span>
        </div>
      </div>
    </div>
  </CardTag>
  );
});
