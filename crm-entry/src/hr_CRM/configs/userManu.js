import { LayoutDashboard, Fingerprint, Clock, BookOpen, CheckSquare,FolderKanban ,Building2 } from "lucide-react";

export const USER_MENU = [
  { type: 'link', label: "Dashboard", path: "/crm/hr/dashboard", icon: LayoutDashboard },
  { type: 'link', label: "Attendance", path: "/crm/hr/attendance", icon: Fingerprint },
  { 
    type: 'dropdown', label: "Shift", icon: Clock, stateKey: 'isShiftOpen',
    children: [
      { label: "Shift Management", path: "/crm/hr/shift" },
      { label: "Overtime Record", path: "/crm/hr/overtime-record" },
      { label: "Overtime Approval", path: "/crm/hr/overtimeApproval" }
    ]
  },
  { 
    type: 'dropdown', label: "Departments", icon: Building2, stateKey: 'isDeptOpen',
    children: [
      { label: "Dept Overview", path: "/crm/hr/departments" },
      { label: "Dept Budget", path: "/crm/hr/department-budget" },
      { label: "Budget Change", path: "/crm/hr/budget-change" },
      { label: "Dept Roles", path: "/crm/hr/department-role" }
    ]
  },
  { type: 'link', label: "Knowledge", path: "/crm/hr/knowledge", icon: BookOpen },
  { type: 'link', label: "Todo", path: "/crm/hr/todo", icon: CheckSquare },
  { type: 'link', label: "Project", path: "/crm/hr/project", icon: FolderKanban },
];