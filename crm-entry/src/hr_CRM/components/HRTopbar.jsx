import React from "react";
import { Bell, Search, Plus, Menu } from "lucide-react";

export default function Topbar({ userData, onMenuClick }) {
  const displayName = userData?.name || "User";

  return (
    <header className="h-14 md:h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 md:px-8 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick} 
          className="lg:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img 
              src={`https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff&bold=true`} 
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300"
              alt="User"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-black text-slate-800 hidden sm:inline-block leading-none">
              {displayName}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter hidden sm:inline-block">
              Administrator
            </span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Slightly Larger Search */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Quick Search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:border-indigo-100 rounded-xl text-xs w-48 lg:w-64 focus:ring-4 focus:ring-indigo-50/50 transition-all outline-none font-medium"
          />
        </div>

        {/* Action Buttons */}
        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl relative transition-all">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200 mx-1" />

        {/* Upsized Action Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all font-black text-xs uppercase tracking-wide">
          <Plus size={16} strokeWidth={3} />
          <span className="hidden sm:inline">New Action</span>
        </button>
      </div>
    </header>
  );
}