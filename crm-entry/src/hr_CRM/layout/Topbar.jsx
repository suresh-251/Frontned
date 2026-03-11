import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Settings, Shield, User, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeChange from "../components/ui/ThemeChange";

export default function Topbar({ userData }) {
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const displayName = userData?.name || "User";
  const displayStatus = "Authorized Access";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-11 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-6 flex items-center justify-between sticky top-0 z-[100] transition-all shadow-sm font-sans">
      
      {/* Left side: Balanced Greeting */}
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer" onClick={() => navigate("/profile")}>
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
        <div className="relative hidden lg:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-9 pr-4 py-1.5 bg-[var(--bg-body)] border border-[var(--border-color)] focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-[10px] w-48 transition-all outline-none font-bold text-[var(--text-main)]"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1.5 ml-2 relative" ref={dropdownRef}>
          <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all relative">
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-[var(--bg-card)]"></span>
          </button>

          {/* Settings Trigger */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
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
                onClick={() => { navigate("/profile"); setShowSettings(false); }}
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