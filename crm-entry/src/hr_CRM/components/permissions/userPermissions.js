import { LayoutDashboard, Fingerprint, Clock, BookOpen, CheckSquare } from "lucide-react";

export const USER_FIELDS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { id: "attendance", label: "Attendance", icon: Fingerprint, path: "attendance" },
  { id: "shift", label: "Shift", icon: Clock, path: "shift", hasSub: true, subItems: ["Management", "Record"] },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, path: "knowledge" },
  { id: "todo", label: "Todo", icon: CheckSquare, path: "todo" },
];
