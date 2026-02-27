import React from "react";
import { Bell, Search, Plus, Settings } from "lucide-react";

export default function Topbar({ userData }) {
  // Fallback for missing user data
  const displayName = userData?.name || "User";
  const displayRole = userData?.role || "Management";

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      
      {/* Left side: Dynamic Greeting */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true&rounded=true`} 
            alt="Profile" 
            className="w-11 h-11 rounded-xl shadow-sm border border-slate-100 object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800 leading-none">
            {displayName} <span className="ml-1">👋</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Welcome back to {displayRole}
          </p>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Quick search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:border-indigo-100 focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-xl text-sm w-56 transition-all outline-none"
          />
        </div>

        {/* Notifications */}
        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
          <Settings size={20} />
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2" />

        {/* Action Button */}
        <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-sm">
          <Plus size={18} />
          <span>New Request</span>
        </button>
      </div>
    </header>
  );
}