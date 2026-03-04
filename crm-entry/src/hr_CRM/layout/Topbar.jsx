import React from "react";
import { Bell, Search, Plus, Settings, Shield } from "lucide-react";

export default function Topbar({ userData }) {
  // Fallback for missing user data
  const displayName = userData?.name || "User";
  const displayStatus = "Authorized Access";

  return (
    <header className="h-11 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 transition-all shadow-sm">
      
      {/* Left side: Balanced Greeting */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
            alt="Profile" 
            className="w-8 h-8 rounded-lg shadow-sm border border-slate-100 object-cover"
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-[12px] font-black text-slate-800 leading-none flex items-center gap-1.5">
            {displayName} <span className="text-[11px]">👋</span>
          </h1>
          <p className="text-[8px] text-slate-400 mt-0.5 font-black uppercase tracking-[0.15em] flex items-center gap-1">
            <Shield size={9} className="text-indigo-500" /> {displayStatus}
          </p>
        </div>
      </div>

      {/* Right side: Actions with wider spacing */}
      <div className="flex items-center gap-3">
        {/* Search Bar - Increased Width */}
        <div className="relative hidden lg:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={13} />
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-50 rounded-lg text-[10px] w-48 transition-all outline-none font-bold text-slate-600"
          />
        </div>

        {/* Action Icons - Better Spacing */}
        <div className="flex items-center gap-1.5 ml-2">
          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all relative">
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>

          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-all">
            <Settings size={17} />
          </button>

          <div className="h-5 w-[1px] bg-slate-200 mx-2" />

          {/* Action Button - Wider & More Prominent */}
          
        </div>
      </div>
    </header>
  );
}