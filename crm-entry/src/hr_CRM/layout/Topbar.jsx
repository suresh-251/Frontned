import React from "react";
import { Bell, Search, Plus, Settings, Shield } from "lucide-react";

export default function Topbar({ userData }) {
  // Fallback for missing user data
  const displayName = userData?.name || "User";
  const displayStatus = "Authorized Access"; // Updated from Management

  return (
    <header className="h-11 bg-white border-b border-slate-200 px-3 flex items-center justify-between sticky top-0 z-10 transition-all shadow-sm">
      
      {/* Left side: Compact Greeting */}
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
            alt="Profile" 
            className="w-7 h-7 rounded-md shadow-sm border border-slate-100 object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-[11px] font-black text-slate-800 leading-none flex items-center gap-1">
            {displayName} <span className="text-[10px]">👋</span>
          </h1>
          <p className="text-[8px] text-slate-400 mt-0.5 font-black uppercase tracking-widest flex items-center gap-0.5">
            <Shield size={8} className="text-indigo-500" /> {displayStatus}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1">
        {/* Search Bar - Ultra Slim */}
        <div className="relative hidden lg:block group">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={12} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-7 pr-2 py-1 bg-slate-50 border border-transparent focus:bg-white focus:ring-1 focus:ring-slate-100 rounded text-[10px] w-32 transition-all outline-none font-medium"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-0.5 ml-2">
          <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1 h-1 bg-red-500 rounded-full border border-white"></span>
          </button>

          <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all">
            <Settings size={16} />
          </button>

          <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

          {/* Action Button - Tight fit */}
          <button className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded font-black text-[9px] uppercase tracking-tighter hover:bg-slate-900 transition-all active:scale-95">
            <Plus size={12} />
            <span>New Request</span>
          </button>
        </div>
      </div>
    </header>
  );
}