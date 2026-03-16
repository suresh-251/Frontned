// import { LayoutDashboard, Fingerprint, Clock, BookOpen, CheckSquare,FolderKanban ,Building2 } from "lucide-react";

// export const USER_MENU = [
//   { type: 'link', label: "Dashboard", path: "/crm/hr/dashboard", icon: LayoutDashboard },
//   { type: 'link', label: "Attendance", path: "/crm/hr/attendance", icon: Fingerprint },
//   { 
//     type: 'dropdown', label: "Shift", icon: Clock, stateKey: 'isShiftOpen',
//     children: [
//       { label: "Shift Management", path: "/crm/hr/shift" },
//        { label: "Leave Requests", path: "/crm/hr/leave" },
//       { label: "Overtime Record", path: "/crm/hr/overtime-record" },
//       { label: "Overtime Approval", path: "/crm/hr/overtimeApproval" }
//     ]
//   },
//   { 
//     type: 'dropdown', label: "Departments", icon: Building2, stateKey: 'isDeptOpen',
//     children: [
//       { label: "Dept Overview", path: "/crm/hr/departments" },
//       { label: "Dept Budget", path: "/crm/hr/department-budget" },
//       { label: "Budget Change", path: "/crm/hr/budget-change" },
//       { label: "Dept Roles", path: "/crm/hr/department-role" }
//     ]
//   },
  
//   { 
//     type: 'dropdown', label: "Recruitment", icon: UserPlus, stateKey: 'isRecruitOpen',
//     children: [
      
      
//       { label: "OffBoarding", path: "/crm/hr/offboarding" },
     
//     ]
//   },

//   { type: 'link', label: "Knowledge", path: "/crm/hr/knowledge", icon: BookOpen },
//   { type: 'link', label: "Todo", path: "/crm/hr/todo", icon: CheckSquare },
//   { type: 'link', label: "Project", path: "/crm/hr/project", icon: FolderKanban },
// ];







import { 
  LayoutDashboard, 
  Fingerprint, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  FolderKanban, 
  Building2, 
  UserPlus, 
  Users,     // Added missing icon
  Banknote,      // Added for Payroll
  TrendingUp,    // Added for Growth Tracker
  GraduationCap  // Added for Learning
} from "lucide-react";

export const USER_MENU = [
  { type: 'link', label: "Dashboard", path: "/crm/hr/dashboard", icon: LayoutDashboard },

  { type: 'link', label: "Leads", path: "/crm/hr/leads", icon: Users },
  
  { type: 'link', label: "Attendance", path: "/crm/hr/attendance", icon: Fingerprint },

  { type: 'link', label: "Payroll", path: "/crm/hr/payroll", icon: Banknote },


  { 
    type: 'dropdown', label: "Shift", icon: Clock, stateKey: 'isShiftOpen',
    children: [
      { label: "Shift Management", path: "/crm/hr/shift" },
      { label: "Leave Requests", path: "/crm/hr/leave" },
      { label: "Overtime Record", path: "/crm/hr/overtime-record" },
      { label: "Overtime Approval", path: "/crm/hr/overtimeApproval" }
    ]
  },

  { 
    type: 'dropdown', label: "Recruitment", icon: UserPlus, stateKey: 'isRecruitOpen',
    children: [
      { label: "OffBoarding", path: "/crm/hr/offboarding" },
      { label: "Exit Interview", path: "/crm/hr/exit-interview" },
      { label: "Digital Signature", path: "/crm/hr/digital-signature" }
    ]
  },

  { 
    type: 'dropdown', label: "Growth Tracker", icon: TrendingUp, stateKey: 'isGrowthOpen',
    children: [
      { label: "Learning Portal", path: "/crm/hr/learning" },
      { label: "Compliance Training", path: "/crm/hr/employee-training" },
      { label: "Knowledge Base", path: "/crm/hr/knowledge" },
      { label: "Todo List", path: "/crm/hr/todo" }
    ]
  },

  { type: 'link', label: "Project", path: "/crm/hr/project", icon: FolderKanban },


  
];