import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    <div
      onClick={() => ref.current?.click()}
      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50 flex-shrink-0"
    >
      {preview ? (
        <img src={preview} alt="logo" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function BrandDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { brands, activeBrand, switchBrand, updateBrand, removeBrand, refresh } = useBrand();

  const brand = brands.find((b) => b.slug === slug);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (brand) {
      setEditName(brand.name);
      setEditDesc(brand.description ?? "");
    }
  }, [brand?.slug]);

  if (!brand) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-700 mb-1">Brand not found</h3>
          <p className="text-sm text-slate-400 mb-4">This brand may have been deleted.</p>
          <button onClick={() => navigate("/crm/socialmedia/brands")} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
            Back to Brands
          </button>
        </div>
      </div>
    );
  }

  const isActive = brand.slug === activeBrand?.slug;
  const logoSrc = getBrandLogoSrc(brand);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateBrand(brand.slug, { name: editName.trim(), description: editDesc.trim() || undefined });
      if (editLogoFile) {
        await uploadBrandLogo(brand.slug, editLogoFile);
        await refresh();
      }
      toast.success("Brand updated!");
      setEditing(false);
      setEditLogoFile(null);
    } catch (err) {
      toast.error(err.message || "Failed to update brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await removeBrand(brand.slug);
      toast.success(`Brand "${brand.name}" deleted`);
      navigate("/crm/socialmedia/brands");
    } catch (err) {
      toast.error(err.message || "Failed to delete brand");
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async () => {
    setSwitching(true);
    try {
      await switchBrand(brand.slug);
      toast.success("Brand activated!");
    } catch (err) {
      toast.error(err.message || "Failed to activate brand");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 px-8 py-4">
        <button
          onClick={() => navigate("/crm/socialmedia/brands")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Brands
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">

        {/* ── Brand Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Colored banner */}
          <div className={`h-20 ${isActive ? "bg-gradient-to-r from-blue-600 to-indigo-600" : "bg-gradient-to-r from-slate-400 to-slate-600"}`} />

          <div className="px-8 pb-8">
            {/* Logo overlapping banner */}
            <div className="flex items-end gap-5 -mt-10">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border-4 border-white overflow-hidden ${isActive ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
                {logoSrc ? (
                  <img src={logoSrc} alt={brand.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{initials(brand.name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{brand.name}</h1>
                  {isActive && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-5">
              {brand.description ? (
                <p className="text-sm text-slate-600 leading-relaxed">{brand.description}</p>
              ) : (
                <p className="text-sm text-slate-400 italic">No description</p>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-6 mt-4 text-xs text-slate-400">
              <span>Created {new Date(brand.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
              {brand.slug && <span>Slug: <code className="text-slate-500">{brand.slug}</code></span>}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-6 pt-6 border-t border-slate-100">
              {!isActive && (
                <button
                  onClick={handleActivate}
                  disabled={switching}
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {switching ? "Switching..." : "Activate Brand"}
                </button>
              )}
              <button
                onClick={() => { setEditing(true); setEditName(brand.name); setEditDesc(brand.description ?? ""); setEditLogoFile(null); }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Brand
              </button>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all ml-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Dashboard", path: "/crm/socialmedia/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { label: "Social Accounts", path: "/crm/socialmedia/accounts", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
            { label: "Team Members", path: "/crm/socialmedia/brands/members", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
            { label: "Leads", path: "/crm/socialmedia/leads", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
          ].map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.path)}
              disabled={!isActive}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
              </svg>
              <span className="text-xs font-medium text-slate-600">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Edit Drawer ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditing(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-5">Edit Brand</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center gap-4">
                <LogoPicker src={logoSrc} onChange={setEditLogoFile} />
                <p className="text-xs text-slate-400">Click to change logo<br />(jpg, png, gif, webp)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Brand Name <span className="text-red-500">*</span></label>
                <input
                  type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  required autoFocus
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                  rows={3} placeholder="What is this brand about?"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={saving || !editName.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditing(false)}
                  className="px-4 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Brand</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <strong>{brand.name}</strong>?
              This will disconnect all social accounts. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all">
                {deleting ? "Deleting..." : "Delete Brand"}
              </button>
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
