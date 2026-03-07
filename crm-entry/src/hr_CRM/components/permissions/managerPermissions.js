import { 
  LayoutDashboard, Users, MapPin, UserPlus, Fingerprint, 
  FolderKanban, Building2, Clock, BookOpen, CheckSquare 
} from "lucide-react";

export const MANAGER_FIELDS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "dashboard" },
  { id: "leads", label: "Leads", icon: Users, path: "leads" },
  { id: "branch", label: "Branch", icon: MapPin, path: "branch", hasSub: true, subItems: ["Branch List", "Employees"] },
  { id: "recruitment", label: "Recruitment", icon: UserPlus, path: "recruitment", hasSub: true, subItems: ["Recruitment List", "Onboarding"] },
  { id: "attendance", label: "Attendance", icon: Fingerprint, path: "attendance" },
  { id: "project", label: "Project", icon: FolderKanban, path: "project" },
  { id: "departments", label: "Departments", icon: Building2, path: "departments", hasSub: true, subItems: ["Overview", "Budget", "Roles"] },
  { id: "shift", label: "Shift", icon: Clock, path: "shift", hasSub: true, subItems: ["Management", "Approval", "Policy"] },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, path: "knowledge" },
  { id: "todo", label: "Todo", icon: CheckSquare, path: "todo" },
];