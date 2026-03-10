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