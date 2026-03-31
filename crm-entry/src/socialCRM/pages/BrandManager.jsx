import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { uploadBrandLogo, getBrandLogoSrc } from "../api/brand.api";
import toast from "react-hot-toast";

function initials(name = "") {
  return name.split(" ").map((w) => w?.[0] || "").join("").toUpperCase().slice(0, 2) || "??";
}

function LogoPicker({ src, onChange }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(src || null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => ref.current?.click()}
        className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50 flex-shrink-0"
      >
        {preview ? (
          <img src={preview} alt="logo" className="w-full h-full object-cover" />
        ) : (
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-xs text-gray-400">Click to upload logo<br />(jpg, png, gif, webp)</p>
    </div>
  );
}

export default function BrandManager() {
  const navigate = useNavigate();
  const { brands, activeBrand, switchBrand, addBrand, loading, refresh } = useBrand();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(null);

  const handleActivateAndEnter = async (brand) => {
    const isActive = brand.slug === activeBrand?.slug;
    if (isActive) {
      navigate(`/crm/socialmedia/brands/${brand.slug}`);
      return;
    }
    setSwitching(brand.slug);
    try {
      await switchBrand(brand.slug);
      // switchBrand triggers a full page reload to /dashboard
      // so the navigate won't execute — but that's the existing behavior
    } catch (err) {
      toast.error(err.message || "Failed to activate brand");
      setSwitching(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const brand = await addBrand({ name: newName.trim(), description: newDesc.trim() || undefined });
      if (newLogoFile) {
        await uploadBrandLogo(brand.slug, newLogoFile);
        await refresh();
      }
      toast.success(`Brand "${newName}" created!`);
      setNewName(""); setNewDesc(""); setNewLogoFile(null);
      setShowCreate(false);
    } catch (err) {
      toast.error(err.message || "Failed to create brand");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Brands</h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a brand to manage it, or create a new one.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Brand
        </button>
      </div>

      <div className="px-8 py-6 space-y-6">

        {/* Create Brand Form */}
        {showCreate && (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Create New Brand</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <LogoPicker src={null} onChange={setNewLogoFile} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Brand Name <span className="text-red-500">*</span></label>
                  <input
                    type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Acme Corp" required autoFocus
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <input
                    type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit" disabled={creating || !newName.trim()}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {creating ? "Creating..." : "Create Brand"}
                </button>
                <button
                  type="button" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewLogoFile(null); }}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brand List */}
        {loading ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No Brands Yet</h3>
            <p className="text-sm text-slate-400 mb-4">Create your first brand to get started</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all">
              Create Brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => {
              const isActive = brand.slug === activeBrand?.slug;
              const isSwitching = switching === brand.slug;
              const logoSrc = getBrandLogoSrc(brand);
              return (
                <button
                  key={brand.slug}
                  type="button"
                  onClick={() => handleActivateAndEnter(brand)}
                  disabled={isSwitching}
                  className={`relative text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md group ${
                    isActive
                      ? "border-blue-400 bg-blue-50/40 shadow-sm"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  } ${isSwitching ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                >
                  {/* Active badge */}
                  {isActive && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}

                  {/* Logo */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden mb-4 ${isActive ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
                    {logoSrc ? (
                      <img src={logoSrc} alt={brand.name} className="w-14 h-14 object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <span className="text-white text-lg font-bold">{initials(brand.name)}</span>
                    )}
                  </div>

                  {/* Name + description */}
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{brand.name}</h3>
                  {brand.description ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{brand.description}</p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 italic">No description</p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Created {new Date(brand.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isActive ? "Open" : "Activate"} &rarr;
                    </span>
                  </div>

                  {isSwitching && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
                      <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Info card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
          <p className="font-semibold mb-1">About Brands</p>
          <p className="text-slate-600 leading-relaxed text-xs">
            Click a brand to enter it. The active brand determines which social accounts, dashboard, and analytics are shown.
            You can edit or delete a brand from inside its detail page.
          </p>
        </div>
      </div>
    </div>
  );
}
