import { Bell, Search, UserCircle } from "lucide-react";

export default function HRTopbar() {
  return (
    <header className="h-16 px-6 flex items-center justify-between bg-white/5 backdrop-blur-xl border-b border-white/10">
      
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/10 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        <button className="relative p-2 rounded-full hover:bg-white/10 transition">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-white/10 px-3 py-2 rounded-xl transition">
          <UserCircle size={24} />
          <span className="hidden md:block">HR User</span>
        </div>
      </div>
    </header>
  );
}
