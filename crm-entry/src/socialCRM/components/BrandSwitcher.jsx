import { useEffect, useRef, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { getBrandLogoSrc } from "../api/brand.api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function BrandSwitcher() {
  const { brands, activeBrand, switchBrand, addBrand } = useBrand();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowCreate(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (slug) => {
    if (activeBrand?.slug === slug) { setOpen(false); return; }
    try {
      await switchBrand(slug);
      toast.success("Brand switched!");
    } catch {
      toast.error("Failed to switch brand");
    }
    setOpen(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      setCreating(true);
      await addBrand({ name: newName.trim(), description: newDesc.trim() || undefined });
      toast.success(`Brand "${newName}" added!`);
      setNewName("");
      setNewDesc("");
      setShowCreate(false);
    } catch (err) {
      toast.error(err.message || "Failed to create brand");
    } finally {
      setCreating(false);
    }
  };

  const initials = (name) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(!open); setShowCreate(false); }}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200"
      >
        {activeBrand ? (
          <>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
              {getBrandLogoSrc(activeBrand) ? (
                <img src={getBrandLogoSrc(activeBrand)} alt={activeBrand.name} className="w-6 h-6 object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{initials(activeBrand.name)}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-indigo-800 max-w-[120px] truncate">
              {activeBrand.name}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </>
        ) : (
          <span className="text-sm font-medium text-yellow-700">No Brand</span>
        )}
        <svg className={`w-4 h-4 text-indigo-600 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Brands</p>
            <button
              onClick={() => { setOpen(false); navigate("brands"); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Manage →
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {brands.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-500 text-center">No brands yet</p>
            )}
            {brands.map((b) => (
              <button
                key={b.slug}
                onClick={() => handleSwitch(b.slug)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-all text-left ${
                  b.isActive ? "bg-blue-50" : ""
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {getBrandLogoSrc(b) ? (
                    <img src={getBrandLogoSrc(b)} alt={b.name} className="w-8 h-8 object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{initials(b.name)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                  {b.description && (
                    <p className="text-xs text-gray-500 truncate">{b.description}</p>
                  )}
                </div>
                {b.isActive && (
                  <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Add Brand */}
          <div className="border-t border-gray-100">
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-all font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Brand
              </button>
            ) : (
              <form onSubmit={handleCreate} className="p-4 space-y-3 bg-gray-50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">New Brand</p>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Brand name *"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating || !newName.trim()}
                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {creating ? "Adding..." : "Add Brand"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
