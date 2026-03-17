import { useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import DatePicker from "react-datepicker";
import activitiesAPI from "../api/activities.api";
import leadsAPI from "../api/leads.api";

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_HEIGHT = 84;
const RANGE_OPTIONS = [
  { value: "day", label: "Day", days: 1 },
  { value: "workweek", label: "Work week", days: 5 },
  { value: "week", label: "Week", days: 7 },
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
const toApiDateTime = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
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
  const token = localStorage.getItem("accessToken");
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
    }

    for (let index = clusterStart; index <= clusterEnd; index += 1) {
      positioned[index].columnCount = columns.length;
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

function EventCard({ item, onEdit }) {
  const meta = activityTypeMeta(item?.type);
  const title = item?.subject || item?.title || meta.label;
  const description = item?.description || "";
  return (
    <div
      title={`${title}\n${fmtTime(item?.date)}${description ? `\n${description}` : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onEdit(item);
      }}
      style={{
        position: "absolute",
        left: `${6 + ((item.column || 0) * item.eventWidth)}px`,
        width: `${item.eventWidth - 12}px`,
        borderRadius: 10,
        padding: "4px 8px",
        background: meta.background,
        color: meta.color,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "0 3px 8px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.8)", fontSize: 8.5, fontWeight: 800, whiteSpace: "nowrap" }}>
          {meta.label}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title}
          </span>
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: meta.color }}>{fmtTime(item?.date)}</div>
      </div>
    </div>
  );
}

function DayColumn({ day, items, columnWidth, onCreateEvent, onEditEvent }) {
  const totalHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  const positionedItems = layoutDayEvents(items).map((item) => {
    const usableWidth = Math.max(120, columnWidth - 12);
    return {
      ...item,
      eventWidth: usableWidth / Math.max(1, item.columnCount || 1),
    };
  });

  return (
    <div style={{ minWidth: columnWidth, width: columnWidth, background: "#ffffff", position: "relative", boxSizing: "border-box", borderRight: "1px solid #e5e7eb" }}>
      <div
        style={{ position: "relative", height: totalHeight }}
        onClick={(event) => {
          const offsetY = event.nativeEvent.offsetY || 0;
          onCreateEvent(day, offsetY);
        }}
      >
        {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => (
          <div key={index} style={{ position: "absolute", left: 0, right: 0, top: index * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: "1px dashed #dbe4f0" }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: HOUR_HEIGHT / 2, borderBottom: "1px dashed #e7edf6" }} />
          </div>
        ))}
        {positionedItems.map((item) => (
          <div key={`${item.id}-${item.subject || item.title || item.date}`} style={{ position: "absolute", top: item.top, left: 0, right: 0, height: item.height }}>
            <EventCard item={item} onEdit={onEditEvent} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const today = startOfDay(new Date());
  const [rangeMode, setRangeMode] = useState("workweek");
  const [anchorDate, setAnchorDate] = useState(today);
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(addDays(today, 2));
  const [items, setItems] = useState([]);
  const [localItems, setLocalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  const loadCalendar = async () => {
    const activeUserId = selectedUserId || userId;
    if (!activeUserId) {
      setItems([]);
      setError("Select a user to load calendar activities.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await activitiesAPI.getCalendar({
        startDate: toApiDateTime(startOfDay(start)),
        endDate: toApiDateTime(endOfDay(end)),
        userId: activeUserId,
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
  };

  useEffect(() => {
    loadCalendar();
  }, [end.getTime(), start.getTime(), userId, selectedUserId]);

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

    const span = rangeMode === "day" ? 1 : (RANGE_OPTIONS.find((item) => item.value === rangeMode)?.days || 7);
    setAnchorDate((current) => addDays(current, direction * span));
  };

  const columnWidth = 240;
  const gridTemplate = `76px repeat(${dayColumns.length}, ${columnWidth}px)`;
  const gridTotalWidth = 76 + (dayColumns.length * columnWidth);
  const monthMatrix = useMemo(() => getMonthMatrix(anchorDate), [anchorDate]);
  const handleMiniDateClick = (day) => {
    setAnchorDate(day);
  };

  const openEditor = (payload) => {
    setEditorValue(payload);
    setEditorOpen(true);
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

  const handleEditEvent = (item) => {
    const baseDate = parseActivityDate(item) || new Date();
    openEditor({
      id: item.id ?? `local-${baseDate.getTime()}`,
      title: item.subject || item.title || "",
      type: activityTypeMeta(item?.type).label,
      date: baseDate,
      duration: getEventDurationMinutes(item),
      description: item.description || "",
    });
  };

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
    <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
      <aside style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#ffffff", padding: 16, position: "sticky", top: 92, height: "fit-content" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{fmtMonthYear(anchorDate)}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, -1))} style={miniBtnStyle}><ChevronLeft size={14} /></button>
            <button type="button" onClick={() => setAnchorDate(addMonths(anchorDate, 1))} style={miniBtnStyle}><ChevronRight size={14} /></button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textAlign: "center" }}>{label}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
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
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background: inRange ? "#dbeafe" : "transparent",
                  color: isToday ? "#1d4ed8" : inMonth ? "#1f2937" : "#cbd5f5",
                  fontSize: 11,
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

      <section style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#ffffff", boxShadow: "0 14px 40px rgba(15, 23, 42, 0.08)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CalendarDays size={18} />
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>Calendar</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{fmtRangeHeaderSafe(start, end)}</div>
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

        <div style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
          <div style={{ maxHeight: "68vh", overflow: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: gridTemplate, borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 2, background: "#ffffff", width: gridTotalWidth }}>
              <div style={{ padding: "12px 8px", fontSize: 11, fontWeight: 700, color: "#9ca3af", borderRight: "1px solid #e5e7eb", boxSizing: "border-box" }}>IST</div>
              {dayColumns.map((day) => (
                <div key={day.toISOString()} style={{ padding: "10px 12px", borderRight: "1px solid #e5e7eb", background: sameDay(day, today) ? "#eff6ff" : "#ffffff", boxSizing: "border-box" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: sameDay(day, today) ? "#2563eb" : "#6b7280" }}>{fmtDayName(day)}</div>
                  <div style={{ marginTop: 2, fontSize: 20, fontWeight: 700, color: sameDay(day, today) ? "#2563eb" : "#111827", lineHeight: 1 }}>{fmtDayNumber(day)}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: gridTemplate, width: gridTotalWidth }}>
              <div style={{ position: "relative", borderRight: "1px solid #e5e7eb", background: "#ffffff", boxSizing: "border-box" }}>
                {Array.from({ length: HOUR_END - HOUR_START }).map((_, index) => {
                  const hour = HOUR_START + index;
                  return (
                    <div key={hour} style={{ height: HOUR_HEIGHT, borderBottom: "1px solid #f1f5f9", padding: "6px 8px", fontSize: 11, fontWeight: 600, color: "#9ca3af", boxSizing: "border-box" }}>
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
                  onCreateEvent={handleCreateEvent}
                  onEditEvent={handleEditEvent}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

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
              background: "#ffffff",
              borderRadius: 16,
              padding: 18,
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>Calendar Event</div>
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
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
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
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#6b7280",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const selectStyle = {
  minWidth: 90,
  height: 34,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#374151",
  fontSize: 12.5,
  fontWeight: 600,
  padding: "0 8px",
  outline: "none",
};

const miniBtnStyle = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#6b7280",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const modalInputStyle = {
  width: "100%",
  height: 38,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  fontSize: 13,
  color: "#111827",
  outline: "none",
};

const modalGhostStyle = {
  height: 36,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  padding: "0 12px",
  background: "#ffffff",
  color: "#374151",
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
