import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { getBrandLogoSrc } from "../api/brand.api";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

// ── Brand Switcher + Add button ─────────────────────────────────────────────
function TopbarBrandSwitcher() {
  const { brands, activeBrand, switchBrand, addBrand } = useBrand();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setShowCreate(false); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (slug) => {
    if (activeBrand?.slug === slug) { setOpen(false); return; }
    try { await switchBrand(slug); toast.success("Brand switched!"); } catch { toast.error("Failed to switch brand"); }
    setOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      await addBrand({ name: newName.trim() });
      toast.success(`Brand "${newName}" added!`);
      setNewName(""); setShowCreate(false);
    } catch (err) { toast.error(err.message || "Failed to create brand"); }
    finally { setCreating(false); }
  };

  const initials = (name) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center gap-1" ref={ref}>
      {/* Switcher button */}
      <button onClick={() => { setOpen(!open); setShowCreate(false); }}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all">
        {activeBrand ? (
          <>
            <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
              {getBrandLogoSrc(activeBrand)
                ? <img src={getBrandLogoSrc(activeBrand)} alt={activeBrand.name} className="w-5 h-5 object-cover" />
                : <span className="text-white text-[9px] font-bold">{initials(activeBrand.name)}</span>}
            </div>
            <span className="text-sm font-semibold text-indigo-800 max-w-[110px] truncate">{activeBrand.name}</span>
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          </>
        ) : (
          <span className="text-sm font-medium text-yellow-700">No Brand</span>
        )}
        <svg className={`w-3.5 h-3.5 text-indigo-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* + Add Brand button */}
      <button onClick={() => { setOpen(true); setShowCreate(true); }}
        title="Add new brand"
        className="w-8 h-8 flex items-center justify-center rounded-xl border border-dashed border-indigo-300 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-400 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" style={{ left: "auto" }}>
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Brands</p>
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/brands"); }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage →</button>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {brands.length === 0 && <p className="px-4 py-3 text-sm text-gray-500 text-center">No brands yet</p>}
            {brands.map(b => (
              <button key={b.slug} onClick={() => handleSwitch(b.slug)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all text-left ${b.isActive ? "bg-blue-50" : ""}`}>
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {getBrandLogoSrc(b) ? <img src={getBrandLogoSrc(b)} alt={b.name} className="w-7 h-7 object-cover" /> : <span className="text-white text-[10px] font-bold">{initials(b.name)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                  {b.description && <p className="text-xs text-gray-500 truncate">{b.description}</p>}
                </div>
                {b.isActive && <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100">
            {!showCreate ? (
              <button onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add New Brand
              </button>
            ) : (
              <form onSubmit={handleCreate} className="p-4 space-y-2 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">New Brand</p>
                <input autoFocus type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Brand name *" required maxLength={100}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button type="submit" disabled={creating || !newName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {creating ? "Adding…" : "Add Brand"}
                  </button>
                  <button type="button" onClick={() => { setShowCreate(false); setNewName(""); }}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── User profile dropdown ────────────────────────────────────────────────────
function UserMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const userName = auth?.user?.name || auth?.user?.unique_name || auth?.user?.email || "User";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = () => {
    auth?.logout?.();
    navigate("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-bold">{initials}</span>
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
            {auth?.user?.email && <p className="text-xs text-gray-500 truncate">{auth.user.email}</p>}
          </div>
          <div className="py-1">
            <button onClick={() => { setOpen(false); navigate("/crm/socialmedia/settings"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  return (
    <div className="bg-white px-5 py-3 border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between gap-4">

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 relative">
          {/* Brand switcher + add */}
          <TopbarBrandSwitcher />

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Settings */}
          <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* User profile */}
          <UserMenu />
        </div>
      </div>
    </div>
  );
}