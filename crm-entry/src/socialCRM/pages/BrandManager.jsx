import { useRef, useState } from "react";
import { useBrand } from "../context/BrandContext";
import { uploadBrandLogo } from "../api/brand.api";
import toast from "react-hot-toast";

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function LogoPicker({ current, onChange }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(current || null);

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

function EditModal({ brand, onClose, onSave }) {
  const [name, setName] = useState(brand.name);
  const [description, setDescription] = useState(brand.description ?? "");
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      let logoUrl = brand.logoUrl;
      if (logoFile) {
        const uploaded = await uploadBrandLogo(logoFile);
        logoUrl = uploaded.url;
      }
      await onSave(brand.slug, { name: name.trim(), description: description.trim() || undefined, logoUrl });
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
          <LogoPicker current={brand.logoUrl} onChange={setLogoFile} />
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
  const { brands, activeBrand, switchBrand, addBrand, updateBrand, removeBrand, loading } = useBrand();

  const [editBrand, setEditBrand] = useState(null);
  const [deleteBrand, setDeleteBrand] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState(null);

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
      let logoUrl;
      if (newLogoFile) {
        const uploaded = await uploadBrandLogo(newLogoFile);
        logoUrl = uploaded.url;
      }
      await addBrand({ name: newName.trim(), description: newDesc.trim() || undefined, logoUrl });
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
              <LogoPicker current={null} onChange={setNewLogoFile} />
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
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt={brand.name} className="w-12 h-12 object-cover" onError={(e) => { e.target.style.display="none"; }} />
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
                      <p className="text-[10px] text-slate-300 font-mono mt-1">
                        ID: {brand.slug} · Created {new Date(brand.createdAt).toLocaleDateString()}
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
        <EditModal brand={editBrand} onClose={() => setEditBrand(null)} onSave={updateBrand} />
      )}
      {deleteBrand && (
        <DeleteConfirmModal brand={deleteBrand} onClose={() => setDeleteBrand(null)} onConfirm={removeBrand} />
      )}
    </div>
  );
}
