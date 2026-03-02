import React from "react";
import { Bell, Search, Plus, Settings } from "lucide-react";

export default function Topbar({ userData }) {
  // Fallback for missing user data
  const displayName = userData?.name || "User";
  const displayRole = userData?.role || "Management";

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-10 transition-all">
      
      {/* Left side: Compact Greeting */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
            alt="Profile" 
            className="w-8 h-8 rounded-lg shadow-sm border border-slate-100 object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-800 leading-none flex items-center gap-1">
            {displayName} <span className="text-xs">👋</span>
          </h1>
          <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-tight">
            {displayRole}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search Bar - Slimmer */}
        <div className="relative hidden lg:block group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/30 rounded-lg text-[12px] w-40 transition-all outline-none font-medium"
          />
        </div>

        {/* Action Icons - Smaller Padding */}
        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>

        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
          <Settings size={18} />
        </button>

        <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />

        {/* Action Button - Compact */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-all font-bold text-[11px] uppercase tracking-wider">
          <Plus size={14} />
          <span className="hidden md:inline">Request</span>
        </button>
      </div>
    </header>
  );
}