import React, { useState, useRef, useEffect, useMemo } from "react";
import { Bell, Search, Settings, Shield, User, LogOut, Trash2, CheckCheck, LayoutDashboard, Users, MapPin, UserPlus, Fingerprint, Banknote, Clock, TrendingUp, GraduationCap, BookOpen, CheckSquare, FolderKanban, Building2, PenTool, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeChange from "../components/ui/ThemeChange";
import hrApi from "../api/hr.api";

const SEARCH_RESOURCES = [
  { label: "Dashboard",          path: "/crm/hr/dashboard",         category: "Main",        icon: LayoutDashboard },
  { label: "Leads",              path: "/crm/hr/leads",             category: "Main",        icon: Users },
  { label: "Employees",          path: "/crm/hr/employees",         category: "Branch",      icon: Users },
  { label: "Branch",             path: "/crm/hr/branch",            category: "Branch",      icon: MapPin },
  { label: "Recruitment",        path: "/crm/hr/recruitment",       category: "Recruitment", icon: UserPlus },
  { label: "Onboarding",         path: "/crm/hr/onboarding",        category: "Recruitment", icon: UserPlus },
  { label: "Offboarding",        path: "/crm/hr/offboarding",       category: "Recruitment", icon: UserPlus },
  { label: "Exit Interview",     path: "/crm/hr/exit-interview",    category: "Recruitment", icon: UserPlus },
  { label: "Employee Training",  path: "/crm/hr/employee-training", category: "Recruitment", icon: GraduationCap },
  { label: "Digital Signature",  path: "/crm/hr/digital-signature", category: "Recruitment", icon: PenTool },
  { label: "Attendance",         path: "/crm/hr/attendance",        category: "HR",          icon: Fingerprint },
  { label: "Payroll",            path: "/crm/hr/payroll",           category: "HR",          icon: Banknote },
  { label: "Leave",              path: "/crm/hr/leave",             category: "HR",          icon: Clock },
  { label: "Overtime",           path: "/crm/hr/overtime",          category: "HR",          icon: Clock },
  { label: "Shift",              path: "/crm/hr/shift",             category: "HR",          icon: Clock },
  { label: "Departments",        path: "/crm/hr/departments",       category: "Org",         icon: Building2 },
  { label: "Department Budget",  path: "/crm/hr/department-budget", category: "Org",         icon: Building2 },
  { label: "Department Roles",   path: "/crm/hr/department-role",   category: "Org",         icon: Building2 },
  { label: "Project",            path: "/crm/hr/project",           category: "Work",        icon: FolderKanban },
  { label: "Learning Portal",    path: "/crm/hr/learning",          category: "Growth",      icon: GraduationCap },
  { label: "Knowledge Base",     path: "/crm/hr/knowledge",         category: "Growth",      icon: BookOpen },
  { label: "Todo List",          path: "/crm/hr/todo",              category: "Growth",      icon: CheckSquare },
  { label: "Profile",            path: "/crm/hr/profile",           category: "Account",     icon: User },
];

export default function Topbar({ userData }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notiLoading, setNotiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return SEARCH_RESOURCES;
    const q = searchQuery.toLowerCase();
    return SEARCH_RESOURCES.filter(
      r => r.label.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  /* ── FETCH ── */
  const loadNotifications = async () => {
    try {
      setNotiLoading(true);
      const [listRes, countRes] = await Promise.all([
        hrApi.get("/api/Notification"),
        hrApi.get("/api/Notification/unread-count"),
      ]);
      setNotifications(Array.isArray(listRes.data) ? listRes.data : []);
      setUnreadCount(countRes.data?.unreadCount ?? 0);
    } catch {
      setNotifications([]);
    } finally {
      setNotiLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  /* ── ACTIONS ── */
  const markRead = async (id) => {
    try {
      await hrApi.put(`/api/Notification/read/${id}`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await hrApi.put("/api/Notification/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await hrApi.delete(`/api/Notification/${id}`);
      setNotifications(prev => {
        const removed = prev.find(n => n.notificationId === id);
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.notificationId !== id);
      });
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    try {
      await hrApi.delete("/api/Notification/clear-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const displayName = userData?.username || userData?.name || "User";
  const displayStatus = "Authorized Access";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettings(false);
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-11 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-[100] transition-all shadow-sm font-sans">
      
      {/* Left side: Balanced Greeting */}
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer" onClick={() => navigate("/crm/hr/profile")}>
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
            alt="Profile" 
            className="w-8 h-8 rounded-lg shadow-sm border border-[var(--border-color)] object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-card)] rounded-full"></div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-[12px] font-black text-[var(--text-main)] leading-none flex items-center gap-1.5">
            {displayName} <span className="text-[11px]">👋</span>
          </h1>
          <p className="text-[8px] text-slate-400 mt-0.5 font-black uppercase tracking-[0.15em] flex items-center gap-1">
            <Shield size={9} className="text-indigo-500" /> {displayStatus}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden lg:block" ref={searchRef}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              className="pl-9 pr-8 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-[10px] w-48 transition-all outline-none font-bold text-[var(--text-main)]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowSearch(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearch && (
            <div className="absolute top-full mt-1.5 left-0 w-64 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-[120] overflow-hidden">
              {filteredResources.length === 0 ? (
                <div className="py-6 text-center">
                  <Search size={16} className="mx-auto text-slate-300 mb-1.5" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No results</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto py-1">
                  {Object.entries(
                    filteredResources.reduce((acc, r) => {
                      if (!acc[r.category]) acc[r.category] = [];
                      acc[r.category].push(r);
                      return acc;
                    }, {})
                  ).map(([cat, items]) => (
                    <div key={cat}>
                      <p className="px-3 pt-2 pb-1 text-[7px] font-black text-slate-400 uppercase tracking-widest">{cat}</p>
                      {items.map(r => {
                        const Icon = r.icon;
                        return (
                          <button
                            key={r.path}
                            onClick={() => { navigate(r.path); setSearchQuery(""); setShowSearch(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors text-left group/item"
                          >
                            <div className="p-1 bg-[var(--bg-body)] rounded-md border border-[var(--border-color)] group-hover/item:bg-indigo-500/10 group-hover/item:border-indigo-500/20 transition-colors">
                              <Icon size={11} className="text-slate-400 group-hover/item:text-indigo-500 transition-colors" />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-main)] group-hover/item:text-indigo-500 transition-colors">{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5 ml-2 relative" ref={dropdownRef}>
          <button
            onClick={() => { setShowNotifications(s => !s); setShowSettings(false); }}
            className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all relative"
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-[var(--bg-card)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-slate-300 rounded-full" />
            )}
          </button>

          {/* ── NOTIFICATIONS DROPDOWN ── */}
          {showNotifications && (
            <div className="absolute top-10 right-0 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-[110] overflow-hidden">

              {/* header */}
              <div className="px-4 py-2.5 border-b border-[var(--border-color)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 text-[8px] font-black rounded-full">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} title="Mark all read"
                      className="text-[8px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-wide flex items-center gap-1 transition-colors">
                      <CheckCheck size={11} /> All read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAll} title="Clear all"
                      className="text-[8px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-wide flex items-center gap-1 transition-colors">
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* list */}
              <div className="max-h-72 overflow-y-auto">
                {notiLoading ? (
                  <div className="py-6 flex justify-center">
                    <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={20} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications</p>
                    <p className="text-[9px] text-slate-300 mt-0.5">You’re all caught up</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.notificationId}
                      onClick={() => !n.isRead && markRead(n.notificationId)}
                      className={`px-4 py-3 border-b border-[var(--border-color)]/30 last:border-0 transition-colors group ${
                        !n.isRead ? "bg-indigo-500/[0.03] cursor-pointer hover:bg-indigo-500/[0.06]" : "hover:bg-[var(--bg-body)]/50"
                      }`}>
                      <div className="flex items-start gap-2">
                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className={`text-[10px] font-black uppercase tracking-tight leading-tight ${!n.isRead ? "text-[var(--text-main)]" : "text-slate-400"}`}>
                              {n.title}
                            </p>
                            <button onClick={(e) => deleteOne(e, n.notificationId)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all shrink-0 mt-0.5">
                              <Trash2 size={11} />
                            </button>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-snug">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {n.module && (
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-[var(--bg-body)] border border-[var(--border-color)]/50 rounded text-slate-400 tracking-wide">
                                {n.module}
                              </span>
                            )}
                            <p className="text-[8px] text-slate-300 font-bold">
                              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings Trigger */}
          <button 
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
            }}
            className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-indigo-500/10 text-indigo-500' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10'}`}
          >
            <Settings size={17} className={`${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
          </button>

          {/* Settings Dropdown Menu */}
          {showSettings && (
            <div className="absolute top-10 right-0 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-2 z-[110] animate-in fade-in zoom-in-95 duration-150">
              
              <div className="px-4 py-2 border-b border-[var(--border-color)]/50 mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Hub</p>
              </div>
              
              <button 
                onClick={() => { navigate("/crm/hr/profile"); setShowSettings(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors text-left"
              >
                <div className="p-1.5 bg-slate-500/10 rounded-lg">
                  <User size={14} />
                </div>
                View Profile
              </button>

              {/* Theme Selection Section */}
              <div className="my-2 border-t border-[var(--border-color)]/50">
                <ThemeChange />
              </div>

              {/* Logout Section */}
              <div className="mt-1 border-t border-[var(--border-color)]/50 pt-1">
                <button 
                  onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <div className="p-1.5 bg-rose-500/10 rounded-lg">
                    <LogOut size={14} />
                  </div>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div className="h-5 w-[1px] bg-[var(--border-color)] mx-2" />
        </div>
      </div>
    </header>
  );
}









// // profile check 

// import React, { useState, useRef, useEffect } from "react";
// import { 
//   Bell, Search, Settings, Shield, User, LogOut, 
//   ChevronDown, Globe, Building, Mail, Phone, Activity 
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import ThemeChange from "../components/ui/ThemeChange";

// export default function Topbar({ userData }) {
//   const [showSettings, setShowSettings] = useState(false);
//   const [showProfileCard, setShowProfileCard] = useState(false);
//   const dropdownRef = useRef(null);
//   const profileRef = useRef(null);
//   const navigate = useNavigate();

//   // ✅ ABSOLUTE PATH: Ensures the App.jsx router finds the correct nested route
//   const FULL_PROFILE_PATH = "/crm/hr/profile";

//   // Data Mapping from your API Structure
//   const identity = userData?.identity || {};
//   const personal = userData?.personal || {};
//   const org = userData?.organization || {};
//   const account = userData?.account || {};

//   const displayName = identity.username || "User";
//   const displayStatus = org.designation || "Authorized Access";

//   // Handle Close on Click Outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowSettings(false);
//       if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfileCard(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   return (
//     <header className="h-11 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-[100] transition-all shadow-sm font-sans text-[var(--text-main)]">
      
//       {/* LEFT SIDE: USER TRIGGER & DOSSIER */}
//       <div className="flex items-center gap-4 relative" ref={profileRef}>
//         <div 
//           className="flex items-center gap-3 cursor-pointer group"
//           onClick={() => setShowProfileCard(!showProfileCard)}
//         >
//           <div className="relative">
//             <img 
//               src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
//               alt="Profile" 
//               className="w-8 h-8 rounded-lg shadow-sm border border-[var(--border-color)] object-cover group-hover:border-indigo-500 transition-colors"
//             />
//             <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-card)] rounded-full"></div>
//           </div>
//           <div className="hidden sm:block">
//             <h1 className="text-[12px] font-black leading-none flex items-center gap-1.5 uppercase transition-colors group-hover:text-indigo-500">
//               {displayName} <ChevronDown size={10} className={`transition-transform ${showProfileCard ? 'rotate-180' : ''}`} />
//             </h1>
//             <p className="text-[8px] text-slate-400 mt-0.5 font-black uppercase tracking-[0.15em] flex items-center gap-1">
//               <Shield size={9} className="text-indigo-500" /> {displayStatus}
//             </p>
//           </div>
//         </div>

//         {/* 📋 COMPACT DOSSIER CARD (THE MINI TABLE) */}
//         <AnimatePresence>
//           {showProfileCard && (
//             <motion.div 
//               initial={{ opacity: 0, y: 10, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: 10, scale: 0.95 }}
//               className="absolute top-12 left-0 w-72 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-[120] overflow-hidden"
//             >
//               <div className="bg-indigo-600 p-3 flex items-center gap-3">
//                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-lg border border-white/20 uppercase">
//                    {displayName.charAt(0)}
//                  </div>
//                  <div>
//                    <h4 className="text-[11px] font-black text-white uppercase leading-tight">{personal.firstName} {personal.lastName}</h4>
//                    <p className="text-[9px] font-bold text-indigo-100/70 uppercase tracking-tighter">UID: #{identity.userId}</p>
//                  </div>
//               </div>

//               <div className="p-2 bg-[var(--bg-body)]/30">
//                 <table className="w-full text-[10px] border-separate border-spacing-y-1">
//                   <tbody>
//                     <ProfileRow icon={<Globe size={11}/>} label="Domain" value={org.domain} />
//                     <ProfileRow icon={<Building size={11}/>} label="Dept" value={org.department} />
//                     <ProfileRow icon={<Mail size={11}/>} label="Email" value={identity.email} isMuted />
//                     <ProfileRow icon={<Phone size={11}/>} label="Mobile" value={personal.mobileNumber} />
//                     <ProfileRow icon={<Activity size={11}/>} label="Status" value={account.accountStatus} isStatus />
//                   </tbody>
//                 </table>
//               </div>

//               <div className="p-2 border-t border-[var(--border-color)]/50 bg-[var(--bg-card)]">
//                 <button 
//                   onClick={() => { navigate(FULL_PROFILE_PATH); setShowProfileCard(false); }}
//                   className="w-full py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
//                 >
//                   Full Profile Architecture
//                 </button>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* RIGHT SIDE: ACTIONS */}
//       <div className="flex items-center gap-3">
//         {/* Search */}
//         <div className="relative hidden lg:block group">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
//           <input 
//             type="text" 
//             placeholder="Search resources..." 
//             className="pl-9 pr-4 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-[10px] w-48 transition-all outline-none font-bold text-[var(--text-main)]"
//           />
//         </div>

//         {/* Dropdown Actions */}
//         <div className="flex items-center gap-1.5 ml-2 relative" ref={dropdownRef}>
//           <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all relative">
//             <Bell size={17} />
//             <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[var(--bg-card)]"></span>
//           </button>

//           <button 
//             onClick={() => setShowSettings(!showSettings)}
//             className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-indigo-500/10 text-indigo-500' : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10'}`}
//           >
//             <Settings size={17} className={`${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
//           </button>

//           <AnimatePresence>
//             {showSettings && (
//               <motion.div 
//                 initial={{ opacity: 0, y: 10, scale: 0.95 }} 
//                 animate={{ opacity: 1, y: 0, scale: 1 }} 
//                 exit={{ opacity: 0, y: 10, scale: 0.95 }} 
//                 className="absolute top-10 right-0 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-2 z-[110]"
//               >
//                 <div className="px-4 py-2 border-b border-[var(--border-color)]/50 mb-1">
//                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Hub</p>
//                 </div>
                
//                 <button 
//                   onClick={() => { navigate(FULL_PROFILE_PATH); setShowSettings(false); }} 
//                   className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-[var(--text-main)] hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors text-left"
//                 >
//                   <div className="p-1.5 bg-slate-500/10 rounded-lg"><User size={14} /></div>
//                   View Profile
//                 </button>

//                 <div className="my-2 border-t border-[var(--border-color)]/50">
//                   <ThemeChange />
//                 </div>

//                 <div className="mt-1 border-t border-[var(--border-color)]/50 pt-1">
//                   <button 
//                     onClick={() => { localStorage.removeItem("accessToken"); window.location.href = "/crm/hr/login"; }} 
//                     className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 transition-colors text-left"
//                   >
//                     <div className="p-1.5 bg-rose-500/10 rounded-lg"><LogOut size={14} /></div>
//                     Sign Out
//                   </button>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <div className="h-5 w-[1px] bg-[var(--border-color)] mx-2" />
//         </div>
//       </div>
//     </header>
//   );
// }

// // Helper Component for Table Rows
// const ProfileRow = ({ icon, label, value, isStatus, isMuted }) => (
//   <tr className="bg-[var(--bg-card)] border border-[var(--border-color)]/40 rounded-lg overflow-hidden shadow-sm hover:border-indigo-500/30 transition-colors">
//     <td className="w-8 pl-2 py-1.5 text-indigo-500">{icon}</td>
//     <td className="py-1.5 text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</td>
//     <td className="pr-2 py-1.5 text-right font-black uppercase text-[9px] max-w-[120px] truncate text-[var(--text-main)]">
//       {isStatus ? (
//         <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{value || '---'}</span>
//       ) : (
//         <span className={isMuted ? 'text-slate-400 font-bold normal-case text-[8px]' : ''}>
//           {value || '---'}
//         </span>
//       )}
//     </td>
//   </tr>
// );
