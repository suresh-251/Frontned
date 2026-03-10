import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import { uploadBrandLogo } from "../api/brand.api";
import toast from "react-hot-toast";

export default function BrandSetupPage() {
  const navigate = useNavigate();
  const { createBrand, refresh } = useBrand();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      const brand = await createBrand({ name: name.trim(), description: description.trim() || undefined });
      if (logoFile) {
        await uploadBrandLogo(brand.slug, logoFile);
        await refresh();
      }
      toast.success(`Brand "${name}" created and activated!`);
      navigate("/crm/socialmedia/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set Up Your Brand</h1>
          <p className="text-gray-600 mt-2">
            Create a brand to organize your social accounts, analytics, and posts.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Logo picker */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden bg-gray-50"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-xs text-gray-400">
                {logoFile ? logoFile.name : "Click to upload logo (optional)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp, My Agency..."
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this brand about?"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                "Create Brand & Continue"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          You can add more brands and switch between them from the dashboard.
        </p>
      </div>
    </div>
  );
}
