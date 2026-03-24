import { useEffect, useRef, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { uploadBrandLogo, getBrandLogoSrc } from "../api/brand.api";
import { connectBrandChannel, getAccountHealth } from "../api/auth.api";
import toast from "react-hot-toast";

const PLATFORMS = [
  {
    id: "facebook",
    label: "Facebook Pages",
    description: "Connect FB pages for leads & posts",
    color: "blue",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram Business",
    description: "IG accounts linked to FB Pages",
    color: "pink",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    description: "Company pages and organic posts",
    color: "sky",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
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

function EditModal({ brand, onClose, onSave, onRefresh }) {
  const [name, setName] = useState(brand.name);
  const [description, setDescription] = useState(brand.description ?? "");
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(brand.slug, { name: name.trim(), description: description.trim() || undefined });
      if (logoFile) {
        await uploadBrandLogo(brand.slug, logoFile);
        await onRefresh();
      }
      toast.success("Brand updated!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update brand");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Brand</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LogoPicker src={getBrandLogoSrc(brand)} onChange={setLogoFile} />
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name <span className="text-red-500">*</span></label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              required autoFocus
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this brand about? (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ brand, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(brand.slug);
      toast.success(`Brand "${brand.name}" deleted`);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete brand");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Brand</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <strong>{brand.name}</strong>?
          This will disconnect all social accounts from this brand. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete} disabled={deleting}
            className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
          >
            {deleting ? "Deleting..." : "Delete Brand"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrandManager() {
  const { brands, activeBrand, switchBrand, addBrand, updateBrand, removeBrand, loading, refresh } = useBrand();

  const [editBrand, setEditBrand] = useState(null);
  const [deleteBrand, setDeleteBrand] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(null);
  const [connectPanel, setConnectPanel] = useState(null); // brand slug with open panel
  const [connectingPlatform, setConnectingPlatform] = useState(null); // "brandSlug:platform"
  const [accountHealth, setAccountHealth] = useState(null);

  // Fetch account health on mount
  useEffect(() => {
    getAccountHealth()
      .then((data) => {
        // Convert array to keyed object: { facebook: {...}, instagram: {...} }
        const mapped = {};
        (Array.isArray(data) ? data : []).forEach((h) => {
          mapped[h.platform?.toLowerCase()] = h;
        });
        setAccountHealth(mapped);
      })
      .catch(() => {}); // silently fail — health is optional UI enhancement
  }, []);

  const handleActivate = async (slug) => {
    setSwitching(slug);
    try {
      await switchBrand(slug);
      toast.success("Brand activated!");
    } catch (err) {
      toast.error(err.message || "Failed to activate brand");
    } finally {
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Brand Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage your brands, switch the active one, and configure details</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Brand
          </button>
        </div>

        {/* Create Brand Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">Create New Brand</h2>
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
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {creating ? "Creating..." : "Create Brand"}
                </button>
                <button
                  type="button" onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewLogoFile(null); }}
                  className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brand List */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading brands...</p>
          </div>
        ) : brands.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No Brands Yet</h3>
            <p className="text-sm text-slate-400 mb-4">Create your first brand to get started</p>
            <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">
              Create Brand
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {brands.map((brand) => {
              const isActive = brand.slug === activeBrand?.slug;
              const isSwitching = switching === brand.slug;
              return (
                <div
                  key={brand.slug}
                  className={`bg-white rounded-2xl border shadow-sm transition-all ${isActive ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200"}`}
                >
                  <div className="p-5 flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden ${isActive ? "bg-gradient-to-br from-blue-600 to-purple-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
                      {getBrandLogoSrc(brand) ? (
                        <img src={getBrandLogoSrc(brand)} alt={brand.name} className="w-12 h-12 object-cover" onError={(e) => { e.target.style.display="none"; }} />
                      ) : (
                        <span className="text-white text-sm font-bold">{initials(brand.name)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{brand.name}</h3>
                        {isActive && (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Active
                          </span>
                        )}
                      </div>
                      {brand.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{brand.description}</p>
                      )}
                      <p className="text-[10px] text-slate-300 mt-1">
                        Created {new Date(brand.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleActivate(brand.slug)}
                          disabled={isSwitching}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-50 border border-blue-200"
                        >
                          {isSwitching ? "..." : "Activate"}
                        </button>
                      )}
                      <button
                        onClick={() => setConnectPanel(connectPanel === brand.slug ? null : brand.slug)}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border ${connectPanel === brand.slug ? "text-green-700 bg-green-50 border-green-200" : "text-green-700 bg-green-50 hover:bg-green-100 border-green-200"}`}
                        title="Connect social channels"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Connect
                      </button>
                      <button
                        onClick={() => setEditBrand(brand)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                        title="Edit brand"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteBrand(brand)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all border border-red-200"
                        title="Delete brand"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Connect Channels Panel */}
                  {connectPanel === brand.slug && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 rounded-b-2xl">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Connect Channels</p>
                      <div className="grid grid-cols-3 gap-3">
                        {PLATFORMS.map((p) => {
                          const key = `${brand.slug}:${p.id}`;
                          const isConnecting = connectingPlatform === key;
                          const colorMap = {
                            blue: { bg: "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800", icon: "text-blue-600" },
                            pink: { bg: "bg-pink-50 border-pink-200 hover:bg-pink-100 text-pink-800", icon: "text-pink-600" },
                            sky: { bg: "bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-800", icon: "text-sky-600" },
                          };
                          const colors = colorMap[p.color] || colorMap.blue;
                          return (
                            <button
                              key={p.id}
                              disabled={isConnecting}
                              onClick={async () => {
                                setConnectingPlatform(key);
                                try {
                                  await connectBrandChannel(brand.slug, p.id);
                                } catch {
                                  toast.error("Failed to start connection");
                                  setConnectingPlatform(null);
                                }
                              }}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left hover:shadow-sm disabled:opacity-60 disabled:cursor-wait ${colors.bg}`}
                            >
                              <span className={colors.icon}>
                                {isConnecting ? (
                                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                  </svg>
                                ) : p.icon}
                              </span>
                              <div>
                                <p className="text-xs font-bold">{isConnecting ? "Connecting..." : p.label}</p>
                                <p className="text-[10px] opacity-70">{p.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Account Health Status */}
                      {accountHealth && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Connection Status</p>
                          <div className="space-y-1.5">
                            {["facebook", "instagram", "linkedin"].map((platform) => {
                              const health = accountHealth[platform];
                              if (!health) return null;
                              const isExpired = health.status === "expired" || health.status === "not_connected";
                              const isExpiring = health.daysUntilExpiry != null && health.daysUntilExpiry <= 7 && health.daysUntilExpiry > 0;
                              const statusColor = isExpired ? "text-red-600 bg-red-50" :
                                isExpiring ? "text-amber-600 bg-amber-50" :
                                "text-green-600 bg-green-50";
                              const statusText = isExpired ? "⚠ Reconnect needed" :
                                isExpiring ? `⏳ Expires in ${health.daysUntilExpiry}d` :
                                "✓ Connected";
                              return (
                                <div key={platform} className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] ${statusColor}`}>
                                  <span className="font-semibold capitalize">{platform}</span>
                                  <span>{statusText}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
          <p className="font-bold mb-1">💡 About Brands</p>
          <p className="text-blue-700 leading-relaxed text-xs">
            Only one brand can be active at a time. The active brand determines which social accounts are shown in the dashboard,
            which pages are available for posting, and which analytics are displayed. Switching brands does not disconnect any accounts.
          </p>
        </div>

      </div>

      {/* Modals */}
      {editBrand && (
        <EditModal brand={editBrand} onClose={() => setEditBrand(null)} onSave={updateBrand} onRefresh={refresh} />
      )}
      {deleteBrand && (
        <DeleteConfirmModal brand={deleteBrand} onClose={() => setDeleteBrand(null)} onConfirm={removeBrand} />
      )}
    </div>
  );
}
