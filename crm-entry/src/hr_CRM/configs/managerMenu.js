import { 
  LayoutDashboard, Users, MapPin, Fingerprint, UserPlus, 
  Building2, Clock, BookOpen, CheckSquare, FolderKanban,
  Banknote, TrendingUp, GraduationCap, PenTool, ClipboardList
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
      { label: "Onboarding", path: "/crm/hr/onboarding" },
      { label: "OffBoarding", path: "/crm/hr/offboarding" },
      { label: "Exit Interview", path: "/crm/hr/exit-interview" }, // New Module
      { label: "Employee Training", path: "/crm/hr/employee-training" }, // New Module
      { label: "Digital Signature", path: "/crm/hr/digital-signature" },
      { label: "Job Openings", path: "/crm/hr/job-openings" }
    ]
  },

  { type: 'link', label: "Attendance", path: "/crm/hr/attendance", icon: Fingerprint },
  
  { type: 'link', label: "Payroll", path: "/crm/hr/payroll", icon: Banknote }, // Individual Module

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
      { label: "Leave Requests", path: "/crm/hr/leave" },
      { label: "Overtime Approval", path: "/crm/hr/overtimeApproval" },
      { label: "Overtime Policy", path: "/crm/hr/overtime-policy" },
      { label: "Overtime Record", path: "/crm/hr/overtime-record" }
    ]
  },

  { 
    type: 'dropdown', label: "Growth Tracker", icon: TrendingUp, stateKey: 'isGrowthOpen',
    children: [
      { label: "Learning Portal", path: "/crm/hr/learning", icon: GraduationCap },
      { label: "Knowledge Base", path: "/crm/hr/knowledge", icon: BookOpen },
      { label: "Todo List", path: "/crm/hr/todo", icon: CheckSquare }
    ]
  },
];