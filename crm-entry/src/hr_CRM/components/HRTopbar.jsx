import React from "react";
import { Bell, Search, Plus, Menu } from "lucide-react";

export default function Topbar({ userData, onMenuClick }) {
  const displayName = userData?.name || "User";

  return (
    <header className="h-12 md:h-14 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1 hover:bg-slate-50 rounded text-slate-500">
          <Menu size={18} />
        </button>
        
        <div className="flex items-center gap-2">
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true`} 
            className="w-7 h-7 md:w-8 md:h-8 rounded-lg"
            alt="User"
          />
          <span className="text-sm font-bold text-slate-700 hidden sm:inline-block">
            {displayName}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 md:gap-3">
        {/* Slim Search */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-8 pr-3 py-1 bg-slate-50 border-none rounded-md text-xs w-36 focus:ring-1 focus:ring-indigo-100 transition-all outline-none"
          />
        </div>

        {/* Action Buttons */}
        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 mx-1" />

        <button className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-all font-bold text-[11px] uppercase tracking-wider">
          <Plus size={14} />
          <span className="hidden sm:inline">New</span>
        </button>
      </div>
    </header>
  );
}