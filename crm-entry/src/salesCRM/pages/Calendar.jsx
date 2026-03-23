import { useCallback, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import DatePicker from "react-datepicker";
import activitiesAPI from "../api/activities.api";
import leadsAPI from "../api/leads.api";
import { getAccessToken } from "../../utils/authStorage";

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 92;
const RANGE_OPTIONS = [
  { value: "day", label: "Day", days: 1 },
  { value: "workweek", label: "Work week", days: 5 },
  { value: "week", label: "Week", days: 7 },
  { value: "month", label: "Month" },
];

const pad = (value) => String(value).padStart(2, "0");
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};
const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};
const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};
const startOfWeek = (date) => {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
};
const startOfWorkWeek = (date) => {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = (day + 6) % 7;
  next.setDate(next.getDate() - diff);
  return next;
};
const endOfWeek = (date) => addDays(startOfWeek(date), 6);
const endOfWorkWeek = (date) => addDays(startOfWorkWeek(date), 4);
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const toApiDateTime = (date) => date.toISOString();
const toInputDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const sameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime();
const fmtHeaderMonth = (date) => date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
const fmtMonthYear = (date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
const fmtDayName = (date) => date.toLocaleDateString("en-US", { weekday: "short" });
const fmtDayNumber = (date) => date.toLocaleDateString("en-US", { day: "numeric" });
const fmtRangeHeader = (start, end) => {
  if (sameDay(start, end)) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};
const fmtTime = (value) => {
  if (!value) return "All day";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
const fmtLongDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
const fmtRangeHeaderSafe = (start, end) => {
  if (sameDay(start, end)) {
    return start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
};
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getMonthMatrix = (date) => {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  const weeks = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};
const getUserId = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return Number(decoded?.sub || decoded?.id || decoded?.userId || 0) || null;
  } catch {
    return null;
  }
};
const activityTypeMeta = (type = "") => {
  const raw = String(type).toLowerCase();
  if (raw.includes("task")) return { label: "Task", color: "#1d4ed8", background: "#e0f2fe" };
  if (raw.includes("meeting")) return { label: "Meeting", color: "#0f766e", background: "#dcfce7" };
  if (raw.includes("call")) return { label: "Call", color: "#0f4c81", background: "#e0f2fe" };
  if (raw.includes("email")) return { label: "Email", color: "#a16207", background: "#fef9c3" };
  return { label: "Activity", color: "#334155", background: "#f1f5f9" };
};
const parseActivityDate = (item) => {
  const value = item?.startTime || item?.activityDate || item?.dueDate || item?.createdAt || item?.date;
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};
const getEventDurationMinutes = (item) => {
  const start = parseActivityDate(item);
  const endValue = item?.endTime || item?.dueDateEnd || item?.scheduledEndTime || null;
  const end = endValue ? new Date(endValue) : null;
  if (start && end && !Number.isNaN(end.getTime()) && end > start) {
    return Math.max(30, Math.round((end - start) / 60000));
  }
  return 45;
};
const layoutDayEvents = (items) => {
  const positioned = items.map((item) => {
    const date = parseActivityDate(item);
    const durationMinutes = getEventDurationMinutes(item);
    const visualMinutes = 30;
    const endDate = date ? new Date(date.getTime() + durationMinutes * 60000) : null;
    const hour = date ? date.getHours() + (date.getMinutes() / 60) : HOUR_START;
    const normalizedHour = Math.max(HOUR_START, Math.min(HOUR_END - 0.25, hour));
    return {
      ...item,
      date,
      endDate,
      durationMinutes,
      top: (normalizedHour - HOUR_START) * HOUR_HEIGHT,
      height: (visualMinutes / 60) * HOUR_HEIGHT,
      column: 0,
      columnCount: 1,
      clusterId: "",
      clusterSize: 1,
    };
  }).sort((left, right) => {
    const leftTime = left.date ? left.date.getTime() : 0;
    const rightTime = right.date ? right.date.getTime() : 0;
    return leftTime - rightTime;
  });

  let clusterStart = 0;
  while (clusterStart < positioned.length) {
    let clusterEnd = clusterStart;
    let clusterMaxEnd = positioned[clusterStart].endDate?.getTime() || 0;

    while (clusterEnd + 1 < positioned.length) {
      const nextStart = positioned[clusterEnd + 1].date?.getTime() || 0;
      if (nextStart >= clusterMaxEnd) break;
      clusterEnd += 1;
      clusterMaxEnd = Math.max(clusterMaxEnd, positioned[clusterEnd].endDate?.getTime() || 0);
    }

    const columns = [];
    const clusterId = `${positioned[clusterStart].date?.getTime() || clusterStart}-${clusterStart}`;
    const clusterSize = (clusterEnd - clusterStart) + 1;
    for (let index = clusterStart; index <= clusterEnd; index += 1) {
      const event = positioned[index];
      let assignedColumn = columns.findIndex((endAt) => (event.date?.getTime() || 0) >= endAt);
      if (assignedColumn === -1) {
        assignedColumn = columns.length;
        columns.push(0);
      }
      columns[assignedColumn] = event.endDate?.getTime() || 0;
      event.column = assignedColumn;
      event.columnCount = columns.length;
      event.clusterId = clusterId;
      event.clusterSize = clusterSize;
    }

    for (let index = clusterStart; index <= clusterEnd; index += 1) {
      positioned[index].columnCount = columns.length;
      positioned[index].clusterId = clusterId;
      positioned[index].clusterSize = clusterSize;
    }

    clusterStart = clusterEnd + 1;
  }

  return positioned;
};

const getPresetDates = (mode, customStart, customEnd) => {
  const today = startOfDay(new Date());
  if (mode === "day") return { start: today, end: endOfDay(today) };
  if (mode === "workweek") return { start: startOfWorkWeek(today), end: endOfDay(endOfWorkWeek(today)) };
  if (mode === "week") return { start: startOfWeek(today), end: endOfDay(endOfWeek(today)) };
  if (mode === "custom") return { start: startOfDay(customStart), end: endOfDay(customEnd) };
  const days = RANGE_OPTIONS.find((item) => item.value === mode)?.days || 3;
  return { start: today, end: endOfDay(addDays(today, days - 1)) };
};

function EventCard({ item, onOpen }) {
  const meta = activityTypeMeta(item?.type);
  const title = item?.subject || item?.title || meta.label;
  const showTitle = !!(item.showTitle && title && title !== meta.label);
  return (
    <div
      title={`${title}\n${fmtTime(item?.date)}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      style={{
        position: "absolute",
        left: item.leftCss,
        width: item.widthCss,
        minHeight: 38,
        padding: "7px 8px 7px 10px",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.98) 100%)",
        color: "#0f172a",
        border: "1px solid rgba(203, 213, 225, 0.9)",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.07)",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 7, bottom: 7, width: 4, borderRadius: 999, background: meta.color, opacity: 0.95 }} />
      <div style={{ display: "grid", gap: showTitle ? 4 : 0, width: "100%", minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: meta.color, whiteSpace: "nowrap", letterSpacing: "0.01em", overflow: "hidden", textOverflow: "ellipsis" }}>
          {meta.label}
        </div>
        {showTitle ? (
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0f172a", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EventClusterCard({ items, height, columnWidth, onOpen }) {
  const firstMeta = activityTypeMeta(items[0]?.type);
  const cardHeight = Math.max(62, Math.min(76, height));
  return (
    <div
      onClick={(event) => {
        event.stopPropagation();
        onOpen(items);
      }}
      style={{
        position: "absolute",
        left: "8px",
        width: "calc(100% - 16px)",
        minHeight: 48,
        height: Math.max(48, Math.min(58, cardHeight)),
        padding: "8px 10px",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(248,250,252,0.98) 100%)",
        border: "1px solid rgba(203, 213, 225, 0.9)",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minWidth: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 24, height: 24, padding: "0 7px", borderRadius: 999, background: "#e0ecff", color: "#1d4ed8", fontSize: 10, fontWeight: 800 }}>
          {items.length}
        </span>
        <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: firstMeta.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Multiple events
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Open to view this time slot
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthEventChip({ item, onOpen }) {
  const meta = activityTypeMeta(item?.type);
  const title = item?.subject || item?.title || meta.label;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1fr)",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 10,
        border: "1px solid rgba(148, 163, 184, 0.16)",
        background: meta.background,
        color: meta.color,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 800, whiteSpace: "nowrap" }}>{fmtTime(parseActivityDate(item))}</span>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "#0f172a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </button>
  );
}

function MonthGrid({
  anchorDate,
  monthMatrix,
  today,
  itemsByDay,
  onSelectDay,
  onCreateEvent,
  onOpenEvent,
  onOpenCluster,
}) {
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", minHeight: "calc(100vh - 220px)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)", position: "sticky", top: 0, zIndex: 2 }}>
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            style={{
              padding: "10px 12px",
              borderRight: "1px solid var(--border-color)",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: "color-mix(in srgb, var(--text-main) 55%, #64748b)",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridAutoRows: "minmax(144px, 1fr)" }}>
        {monthMatrix.flat().map((day) => {
          const inMonth = day.getMonth() === anchorDate.getMonth();
          const isToday = sameDay(day, today);
          const dayItems = itemsByDay[toInputDate(day)] || [];
          const previewItems = dayItems.slice(0, 3);
          const hiddenCount = Math.max(0, dayItems.length - previewItems.length);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              style={{
                display: "grid",
                gridTemplateRows: "auto 1fr",
                minHeight: 144,
                padding: 10,
                borderRight: "1px solid var(--border-color)",
                borderBottom: "1px solid var(--border-color)",
                background: isToday
                  ? "color-mix(in srgb, var(--ci, #2563eb) 10%, var(--bg-card))"
                  : inMonth
                    ? "var(--bg-card)"
                    : "color-mix(in srgb, var(--bg-body) 84%, var(--bg-card))",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span
                    style={{
                      minWidth: 28,
                      height: 28,
                      padding: "0 8px",
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? "var(--ci, #2563eb)" : "transparent",
                      color: isToday ? "#fff" : inMonth ? "var(--text-main)" : "color-mix(in srgb, var(--text-main) 35%, #94a3b8)",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {day.getDate()}
                  </span>
                  {!inMonth ? (
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: "color-mix(in srgb, var(--text-main) 34%, #94a3b8)" }}>
                      {day.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCreateEvent(day, HOUR_HEIGHT * 2);
                  }}
                  title={`Add event on ${day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "color-mix(in srgb, var(--bg-card) 90%, var(--bg-body))",
                    color: "color-mix(in srgb, var(--text-main) 55%, #64748b)",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>

              <div style={{ display: "grid", alignContent: "start", gap: 6, minHeight: 0 }}>
                {previewItems.length ? (
                  previewItems.map((item) => (
                    <MonthEventChip
                      key={item.id ?? `${item.subject || item.title || "event"}-${item.date}`}
                      item={item}
                      onOpen={onOpenEvent}
                    />
                  ))
                ) : (
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: "color-mix(in srgb, var(--text-main) 46%, #94a3b8)", paddingTop: 2 }}>
                    No events
                  </div>
                )}

                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenCluster(dayItems);
                    }}
                    style={{
                      justifySelf: "start",
                      border: "none",
                      background: "transparent",
                      color: "var(--ci, #2563eb)",
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    +{hiddenCount} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayColumn({ day, items, columnWidth, fillWidth = false, onCreateEvent, onOpenEvent, onOpenCluster }) {
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  const positionedItems = layoutDayEvents(items).map((item) => {
    const columnCount = Math.max(1, item.columnCount || 1);
    const usableWidth = Math.max(128, columnWidth - 16);
    const numericWidth = usableWidth / columnCount;
    return {
      ...item,
      leftCss: fillWidth
        ? `calc(8px + (${item.column || 0} * ((100% - 16px) / ${columnCount})))`
        : `${8 + ((item.column || 0) * numericWidth)}px`,
      widthCss: fillWidth
        ? `calc(((100% - 16px) / ${columnCount}) - 8px)`
        : `${Math.max(96, numericWidth - 8)}px`,
      showTitle: (fillWidth ? columnCount <= 2 : numericWidth >= 124) && item.height >= 38,
    };
  });
  const renderItems = [];
  const handledClusters = new Set();

  positionedItems.forEach((item) => {
    if (handledClusters.has(item.clusterId)) return;
    const clusterItems = positionedItems.filter((entry) => entry.clusterId === item.clusterId);
    handledClusters.add(item.clusterId);

    if (clusterItems.length > 2) {
      const top = Math.min(...clusterItems.map((entry) => entry.top));
      renderItems.push({
        type: "cluster",
        clusterId: item.clusterId,
        top,
        height: 68,
        items: clusterItems,
      });
      return;
    }

    clusterItems.forEach((entry) => {
      renderItems.push({
        type: "event",
        event: entry,
        top: entry.top,
        height: entry.height,
      });
    });
  });

  return (
    <div style={{ minWidth: fillWidth ? 0 : columnWidth, width: fillWidth ? "100%" : columnWidth, background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)", position: "relative", boxSizing: "border-box", borderRight: "1px solid var(--border-color)" }}>
      <div
        style={{ position: "relative", height: totalHeight }}
        onClick={(event) => {
          const offsetY = event.nativeEvent.offsetY || 0;
          onCreateEvent(day, offsetY);
        }}
      >
        {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => (
          <div key={index} style={{ position: "absolute", left: 0, right: 0, top: index * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: "1px dashed color-mix(in srgb, var(--border-color) 78%, #cbd5e1)" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: HOUR_HEIGHT / 2, borderBottom: "1px dashed color-mix(in srgb, var(--border-color) 46%, #cbd5e1)" }} />
          </div>
        ))}
        {renderItems.map((entry) => (
          <div key={entry.type === "cluster" ? entry.clusterId : `${entry.event.id}-${entry.event.subject || entry.event.title || entry.event.date}`} style={{ position: "absolute", top: entry.top, left: 0, right: 0, height: entry.height }}>
            {entry.type === "cluster" ? (
              <EventClusterCard items={entry.items} height={entry.height} columnWidth={columnWidth} onOpen={onOpenCluster} />
            ) : (
              <EventCard item={entry.event} onOpen={onOpenEvent} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = startOfDay(new Date());
  const [rangeMode, setRangeMode] = useState("month");
  const [anchorDate, setAnchorDate] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(addDays(today, 2));
  const [items, setItems] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItems, setDetailItems] = useState([]);
  const [userOptions, setUserOptions] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState({
    id: null,
    title: "",
    type: "Meeting",
    date: today,
    duration: 45,
    description: "",
  });

  const userId = useMemo(() => getUserId(), []);
  const [selectedUserId, setSelectedUserId] = useState(userId);
  const { start, end } = useMemo(() => {
    if (rangeMode === "custom") return getPresetDates(rangeMode, customStart, customEnd);
    if (rangeMode === "day") return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
    if (rangeMode === "month") return { start: startOfWeek(startOfMonth(anchorDate)), end: endOfDay(endOfWeek(endOfMonth(anchorDate))) };
    if (rangeMode === "workweek") {
      const workStart = startOfWorkWeek(anchorDate);
      return { start: workStart, end: endOfDay(endOfWorkWeek(anchorDate)) };
    }
    if (rangeMode === "week") {
      const weekStart = startOfWeek(anchorDate);
      return { start: weekStart, end: endOfDay(addDays(weekStart, 6)) };
    }
    const days = RANGE_OPTIONS.find((item) => item.value === rangeMode)?.days || 7;
    return { start: startOfDay(anchorDate), end: endOfDay(addDays(startOfDay(anchorDate), days - 1)) };
  }, [anchorDate, customEnd, customStart, rangeMode]);

  const dayColumns = useMemo(() => {
    const days = [];
    const cursor = startOfDay(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [end, start]);

  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      setUserLoading(true);
      try {
        const users = await leadsAPI.getSalesUsers();
        if (!active) return;
        const normalized = (users || [])
          .map((user) => ({
            ...user,
            _id: Number(user?.userId || user?.id || user?.userID || 0) || null,
          }))
          .filter((user) => user._id);
        setUserOptions(normalized);
      } catch {
        if (!active) return;
        setUserOptions([]);
      } finally {
        if (active) setUserLoading(false);
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const loadCalendar = useCallback(async () => {
    const activeUserId = Number(selectedUserId || userId || 0) || null;

    setLoading(true);
    setError("");

    try {
      const data = await activitiesAPI.getCalendar({
        startDate: toApiDateTime(startOfDay(start)),
        endDate: toApiDateTime(endOfDay(end)),
        ...(activeUserId ? { userId: activeUserId } : {}),
      });
      setItems(Array.isArray(data) ? data.map((item) => ({
        ...item,
        date: item?.startTime || item?.activityDate || item?.dueDate || item?.createdAt || item?.date,
      })) : []);
    } catch (err) {
      setItems([]);
      setError(err?.response?.data?.message || "Unable to load calendar activities.");
    } finally {
      setLoading(false);
    }
  }, [end, selectedUserId, start, userId]);

  useEffect(() => {
    loadCalendar();
    const intervalId = setInterval(() => {
      loadCalendar();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [loadCalendar]);

  const combinedItems = useMemo(() => [...items, ...localItems], [items, localItems]);

  const itemsByDay = useMemo(() => combinedItems.reduce((acc, item) => {
    const date = parseActivityDate(item);
    if (!date) return acc;
    const key = toInputDate(date);
    (acc[key] ||= []).push(item);
    acc[key].sort((left, right) => parseActivityDate(left) - parseActivityDate(right));
    return acc;
  }, {}), [combinedItems]);

  const shiftRange = (direction) => {
    if (rangeMode === "custom") {
      const span = Math.max(1, Math.round((endOfDay(customEnd) - startOfDay(customStart)) / 86400000) + 1);
      setCustomStart((current) => addDays(current, direction * span));
      setCustomEnd((current) => addDays(current, direction * span));
      return;
    }

    if (rangeMode === "month") {
      setAnchorDate((current) => addMonths(current, direction));
      return;
    }

    const span = rangeMode === "day" ? 1 : (RANGE_OPTIONS.find((item) => item.value === rangeMode)?.days || 7);
    setAnchorDate((current) => addDays(current, direction * span));
  };

  const timeColumnWidth = 64;
  const fillColumns = rangeMode === "workweek";
  const columnWidth = rangeMode === "workweek" ? 160 : rangeMode === "week" ? 136 : 168;
  const gridTemplate = fillColumns ? `${timeColumnWidth}px repeat(${dayColumns.length}, minmax(0, 1fr))` : `${timeColumnWidth}px repeat(${dayColumns.length}, ${columnWidth}px)`;
  const gridTotalWidth = fillColumns ? "100%" : timeColumnWidth + (dayColumns.length * columnWidth);
  const monthMatrix = useMemo(() => getMonthMatrix(anchorDate), [anchorDate]);
  const headerRangeLabel = rangeMode === "month" ? fmtMonthYear(anchorDate) : fmtRangeHeaderSafe(start, end);
  const handleMiniDateClick = (day) => {
    setAnchorDate(day);
  };

  const openEditor = (payload) => {
    setEditorValue(payload);
    setEditorOpen(true);
  };
  const openDetailView = (events) => {
    const nextItems = [...events].sort((left, right) => {
      const leftDate = parseActivityDate(left)?.getTime() || 0;
      const rightDate = parseActivityDate(right)?.getTime() || 0;
      return leftDate - rightDate;
    });
    setDetailItems(nextItems);
    setDetailOpen(true);
  };

  const handleCreateEvent = (day, offsetY) => {
    const hoursFromStart = Math.min(HOUR_END - HOUR_START, Math.max(0, offsetY / HOUR_HEIGHT));
    const hours = Math.floor(hoursFromStart);
    const minutes = Math.round((hoursFromStart - hours) * 60 / 15) * 15;
    const start = new Date(day);
    start.setHours(HOUR_START + hours, minutes, 0, 0);
    openEditor({
      id: null,
      title: "",
      type: "Meeting",
      date: start,
      duration: 45,
      description: "",
    });
  };

  const handleOpenEvent = (item) => openDetailView([item]);
  const handleOpenCluster = (events) => openDetailView(events);

  const handleSaveEvent = () => {
    const start = editorValue.date instanceof Date ? editorValue.date : new Date(editorValue.date);
    const end = new Date(start.getTime() + Number(editorValue.duration || 45) * 60000);
    const localId = editorValue.id || `local-${start.getTime()}`;
    const nextItem = {
      id: localId,
      title: editorValue.title || "New Event",
      type: editorValue.type || "Meeting",
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      description: editorValue.description || "",
    };
    setLocalItems((current) => {
      const filtered = current.filter((item) => item.id !== localId);
      return [...filtered, nextItem];
    });
    setEditorOpen(false);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(136px, 156px) minmax(0, 1fr)", gap: 10, alignItems: "start", minHeight: "calc(100vh - 86px)" }}>
      <aside style={{ border: "1px solid var(--border-color)", borderRadius: 16, background: "var(--bg-card)", padding: 8, position: "sticky", top: 92, height: "fit-content", alignSelf: "start" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{fmtMonthYear(anchorDate)}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, -1))} style={miniBtnStyle}><ChevronLeft size={14} /></button>
            <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, 1))} style={miniBtnStyle}><ChevronRight size={14} /></button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} style={{ fontSize: 8, fontWeight: 700, color: "color-mix(in srgb, var(--text-main) 45%, #94a3b8)", textAlign: "center" }}>{label}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {monthMatrix.flat().map((day) => {
            const inMonth = day.getMonth() === anchorDate.getMonth();
            const inRange = day >= startOfDay(start) && day <= endOfDay(end);
            const isToday = sameDay(day, today);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleMiniDateClick(day)}
                style={{
                  height: 20,
                  borderRadius: 4,
                  border: "none",
                  background: inRange ? "color-mix(in srgb, var(--ci, #2563eb) 18%, var(--bg-card))" : "transparent",
                  color: isToday ? "var(--ci, #1d4ed8)" : inMonth ? "var(--text-main)" : "color-mix(in srgb, var(--text-main) 28%, #cbd5f5)",
                  fontSize: 9,
                  fontWeight: isToday ? 700 : 600,
                  cursor: "pointer",
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

      </aside>

      <section style={{ border: "1px solid var(--border-color)", borderRadius: 16, background: "var(--bg-card)", boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)", overflow: "hidden", height: "calc(100vh - 86px)", minHeight: "calc(100vh - 86px)", alignSelf: "stretch", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CalendarDays size={18} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)" }}>Calendar</div>
            <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--text-main) 58%, #6b7280)" }}>{headerRangeLabel}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              value={selectedUserId || userId || ""}
              onChange={(event) => setSelectedUserId(event.target.value ? Number(event.target.value) : null)}
              style={{ ...selectStyle, minWidth: 160 }}
              disabled={userLoading}
            >
              <option value="">{userLoading ? "Loading users..." : "Select user"}</option>
              {userId ? <option value={userId}>My activities</option> : null}
              {userOptions.map((user) => (
                <option key={user._id} value={user._id}>{user.name || user.email || `User ${user._id}`}</option>
              ))}
            </select>
            <button type="button" onClick={() => { setAnchorDate(today); setCustomStart(today); setCustomEnd(addDays(today, 2)); }} style={navBtnStyle}>Today</button>
            <button type="button" onClick={() => shiftRange(-1)} style={navIconStyle}><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => shiftRange(1)} style={navIconStyle}><ChevronRight size={16} /></button>
            <select value={rangeMode} onChange={(event) => setRangeMode(event.target.value)} style={selectStyle}>
              {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button type="button" onClick={loadCalendar} style={navIconStyle} title="Refresh calendar">
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
            </button>
          </div>
        </div>

        {error ? <div style={{ ...errorStyle, margin: 16 }}>{error}</div> : null}

        <div style={{ borderTop: "1px solid var(--border-color)", background: "var(--bg-card)", flex: 1, minHeight: 0 }}>
          <div style={{ height: "calc(100vh - 170px)", minHeight: "calc(100vh - 170px)", overflow: "auto" }}>
            {rangeMode === "month" ? (
              <MonthGrid
                anchorDate={anchorDate}
                monthMatrix={monthMatrix}
                today={today}
                itemsByDay={itemsByDay}
                onSelectDay={handleMiniDateClick}
                onCreateEvent={handleCreateEvent}
                onOpenEvent={handleOpenEvent}
                onOpenCluster={handleOpenCluster}
              />
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: gridTemplate, borderBottom: "1px solid var(--border-color)", position: "sticky", top: 0, zIndex: 2, background: "var(--bg-card)", width: gridTotalWidth }}>
                  <div style={{ padding: "12px 6px", fontSize: 10, fontWeight: 700, color: "color-mix(in srgb, var(--text-main) 42%, #9ca3af)", borderRight: "1px solid var(--border-color)", boxSizing: "border-box" }}>IST</div>
                  {dayColumns.map((day) => (
                    <div key={day.toISOString()} style={{ padding: "8px 10px", borderRight: "1px solid var(--border-color)", background: sameDay(day, today) ? "color-mix(in srgb, var(--ci, #2563eb) 16%, var(--bg-card))" : "var(--bg-card)", boxSizing: "border-box" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sameDay(day, today) ? "var(--ci, #2563eb)" : "color-mix(in srgb, var(--text-main) 58%, #6b7280)" }}>{fmtDayName(day)}</div>
                      <div style={{ marginTop: 2, fontSize: 18, fontWeight: 700, color: sameDay(day, today) ? "var(--ci, #2563eb)" : "var(--text-main)", lineHeight: 1 }}>{fmtDayNumber(day)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: gridTemplate, width: gridTotalWidth }}>
                  <div style={{ position: "relative", borderRight: "1px solid var(--border-color)", background: "var(--bg-card)", boxSizing: "border-box" }}>
                    {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => {
                      const hour = HOUR_START + index;
                      return (
                        <div key={hour} style={{ height: HOUR_HEIGHT, borderBottom: "1px solid color-mix(in srgb, var(--border-color) 62%, transparent)", padding: "6px 6px", fontSize: 10, fontWeight: 600, color: "color-mix(in srgb, var(--text-main) 42%, #9ca3af)", boxSizing: "border-box" }}>
                          {hour > 12 ? `${hour - 12}pm` : `${hour}am`}
                        </div>
                      );
                    })}
                  </div>
                  {dayColumns.map((day) => (
                    <DayColumn
                      key={day.toISOString()}
                      day={day}
                      items={itemsByDay[toInputDate(day)] || []}
                      columnWidth={columnWidth}
                      fillWidth={fillColumns}
                      onCreateEvent={handleCreateEvent}
                      onOpenEvent={handleOpenEvent}
                      onOpenCluster={handleOpenCluster}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {detailOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 390,
            padding: 16,
          }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "80vh",
              overflow: "auto",
              background: "var(--bg-card)",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-main)" }}>
                  {detailItems.length > 1 ? `${detailItems.length} events in this slot` : "Event details"}
                </div>
                <div style={{ fontSize: 12.5, color: "color-mix(in srgb, var(--text-main) 58%, #6b7280)", marginTop: 4 }}>
                  {detailItems.length > 1 ? "Review each event clearly, one after another." : "Calendar event information"}
                </div>
              </div>
              <button type="button" style={modalGhostStyle} onClick={() => setDetailOpen(false)}>Close</button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {detailItems.map((item, index) => {
                const meta = activityTypeMeta(item?.type);
                const startDate = parseActivityDate(item);
                const endDate = item?.endTime || item?.dueDateEnd || item?.scheduledEndTime || null;
                const title = item?.subject || item?.title || meta.label;
                const description = (item?.description || "").trim();
                return (
                  <div
                    key={item.id ?? `${title}-${index}-${startDate?.getTime() || 0}`}
                    style={{
                      border: "1px solid color-mix(in srgb, var(--border-color) 84%, #dbeafe)",
                      borderRadius: 16,
                      padding: 14,
                      background: "linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 92%, #eff6ff), var(--bg-card))",
                      boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 800, background: meta.background, color: meta.color }}>
                            {meta.label}
                          </span>
                          {detailItems.length > 1 ? (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "color-mix(in srgb, var(--text-main) 58%, #6b7280)" }}>
                              Event {index + 1}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)", lineHeight: 1.25 }}>{title}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", gap: 10 }}>
                        <div style={detailLabelStyle}>Starts</div>
                        <div style={detailValueStyle}>{fmtLongDateTime(startDate)}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", gap: 10 }}>
                        <div style={detailLabelStyle}>Ends</div>
                        <div style={detailValueStyle}>{endDate ? fmtLongDateTime(endDate) : `${getEventDurationMinutes(item)} minutes`}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", gap: 10 }}>
                        <div style={detailLabelStyle}>Summary</div>
                        <div style={{ ...detailValueStyle, lineHeight: 1.5 }}>{description || "No additional notes for this event."}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {editorOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 400,
            padding: 16,
          }}
          onClick={() => setEditorOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "var(--bg-card)",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>Calendar Event</div>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                type="text"
                value={editorValue.title}
                onChange={(event) => setEditorValue((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Event title"
                style={modalInputStyle}
              />
              <select
                value={editorValue.type}
                onChange={(event) => setEditorValue((prev) => ({ ...prev, type: event.target.value }))}
                style={modalInputStyle}
              >
                <option>Meeting</option>
                <option>Task</option>
                <option>Call</option>
                <option>Email</option>
              </select>
              <DatePicker
                selected={editorValue.date}
                onChange={(date) => setEditorValue((prev) => ({ ...prev, date }))}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMM d, yyyy h:mm aa"
                className="calendar-modal-datepicker"
                customInput={<input style={modalInputStyle} />}
              />
              <input
                type="number"
                min="15"
                step="15"
                value={editorValue.duration}
                onChange={(event) => setEditorValue((prev) => ({ ...prev, duration: event.target.value }))}
                style={modalInputStyle}
                placeholder="Duration (minutes)"
              />
              <textarea
                value={editorValue.description}
                onChange={(event) => setEditorValue((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Notes"
                style={{ ...modalInputStyle, minHeight: 90, resize: "vertical" }}
              />
            </div>
            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" style={modalGhostStyle} onClick={() => setEditorOpen(false)}>Cancel</button>
              <button type="button" style={modalPrimaryStyle} onClick={handleSaveEvent}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const navBtnStyle = {
  minWidth: 70,
  height: 34,
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-main)",
  fontSize: 12.5,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const navIconStyle = {
  width: 34,
  height: 34,
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "color-mix(in srgb, var(--text-main) 58%, #6b7280)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const selectStyle = {
  minWidth: 90,
  height: 34,
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-main)",
  fontSize: 12.5,
  fontWeight: 600,
  padding: "0 8px",
  outline: "none",
};

const miniBtnStyle = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid var(--border-color)",
  background: "var(--bg-card)",
  color: "color-mix(in srgb, var(--text-main) 58%, #6b7280)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const modalInputStyle = {
  width: "100%",
  height: 38,
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  padding: "0 10px",
  fontSize: 13,
  color: "var(--text-main)",
  background: "var(--bg-card)",
  outline: "none",
};

const modalGhostStyle = {
  height: 36,
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  padding: "0 12px",
  background: "var(--bg-card)",
  color: "var(--text-main)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const modalPrimaryStyle = {
  height: 36,
  borderRadius: 8,
  border: "1px solid #2563eb",
  padding: "0 14px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const detailLabelStyle = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "color-mix(in srgb, var(--text-main) 48%, #94a3b8)",
};

const detailValueStyle = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--text-main)",
  minWidth: 0,
};

const errorStyle = {
  marginBottom: 14,
  border: "1px solid #fecaca",
  borderRadius: 16,
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 600,
  padding: "12px 14px",
};
