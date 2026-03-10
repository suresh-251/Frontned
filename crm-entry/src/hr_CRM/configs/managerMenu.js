import { 
  LayoutDashboard, Users, MapPin, Fingerprint, UserPlus, 
  Building2, Clock, BookOpen, CheckSquare, FolderKanban 
} from "lucide-react";

export const MANAGER_MENU = [
  { type: 'link', label: "Dashboard", path: "/crm/hr/dashboard", icon: LayoutDashboard },
  { type: 'link', label: "Leads", path: "/crm/hr/leads", icon: Users },
  { 
    type: 'dropdown', label: "Branch", icon: MapPin, stateKey: 'isBranchOpen',
    children: [
      { label: "Branch List", path: "/crm/hr/branch" },
      { label: "Employees", path: "/crm/hr/employees" }
    ]
  },
  { 
    type: 'dropdown', label: "Recruitment", icon: UserPlus, stateKey: 'isRecruitOpen',
    children: [
      { label: "Recruitment List", path: "/crm/hr/recruitment" },
      { label: "Onboarding", path: "/crm/hr/onboarding" }
    ]
  },
  { type: 'link', label: "Attendance", path: "/crm/hr/attendance", icon: Fingerprint },
  { type: 'link', label: "Project", path: "/crm/hr/project", icon: FolderKanban },
  { 
    type: 'dropdown', label: "Departments", icon: Building2, stateKey: 'isDeptOpen',
    children: [
      { label: "Dept Overview", path: "/crm/hr/departments" },
      { label: "Dept Budget", path: "/crm/hr/department-budget" },
      { label: "Budget Change", path: "/crm/hr/budget-change" },
      { label: "Dept Roles", path: "/crm/hr/department-role" }
    ]
  },
  { 
    type: 'dropdown', label: "Shift", icon: Clock, stateKey: 'isShiftOpen',
    children: [
      { label: "Shift Management", path: "/crm/hr/shift" },
      { label: "Overtime Approval", path: "/crm/hr/overtimeApproval" },
      { label: "Overtime Policy", path: "/crm/hr/overtime-policy" },
      { label: "Overtime Record", path: "/crm/hr/overtime-record" }
    ]
  },
  { type: 'link', label: "Knowledge", path: "/crm/hr/knowledge", icon: BookOpen },
  { type: 'link', label: "Todo", path: "/crm/hr/todo", icon: CheckSquare },
];