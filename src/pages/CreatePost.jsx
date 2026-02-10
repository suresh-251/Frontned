import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { getInstagramDisplayName } from "../utils/instagramDisplayName";

export default function CreatePost() {
  const [mode, setMode] = useState("Text"); // Text | Image | Video

  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);

  const [selectedFb, setSelectedFb] = useState([]);
  const [selectedIg, setSelectedIg] = useState([]);

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* =========================
     LOAD FACEBOOK PAGES
     ========================= */
  useEffect(() => {
    api.get("/facebook/pages")
      .then(res => setFbPages(res.data))
      .catch(() => {});
  }, []);

  /* =========================
     LOAD INSTAGRAM ACCOUNTS
     ========================= */
  useEffect(() => {
    api.get("/instagram/accounts")
      .then(res => setIgAccounts(res.data))
      .catch(() => {});
  }, []);

  const toggle = (id, setter) => {
    setter(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Handle file selection with preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  /* =========================
     SUBMIT (UNIFIED)
     ========================= */
  const submit = async () => {
    if (!selectedFb.length && !selectedIg.length) {
      setError("Select at least one Facebook page or Instagram account");
      return;
    }

    if (mode !== "Text" && !file) {
      setError("Select a media file");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const form = new FormData();

      // Platforms
      if (selectedFb.length) form.append("Platforms", "Facebook");
      if (selectedIg.length) form.append("Platforms", "Instagram");

      // Targets
      [...selectedFb, ...selectedIg].forEach(id =>
        form.append("TargetAccountIds", id)
      );

      form.append("Type", mode);
      form.append("Content", content || "");

      if (file) {
        form.append("MediaFiles", file);
      }

      const res = await api.post("/post", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(res.data);
    } catch (e) {
      setError("Unified post failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Post</h1>
          <p className="text-gray-600">Share your content across multiple platforms</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Post Type Selector */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Post Type:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("Text")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    mode === "Text"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  📝 Text
                </button>
                <button
                  onClick={() => setMode("Image")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    mode === "Image"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🖼️ Image
                </button>
                <button
                  onClick={() => setMode("Video")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    mode === "Video"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🎥 Video
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {/* Platform Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Facebook Pages */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Facebook Pages</h3>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {selectedFb.length} selected
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {fbPages.length === 0 && (
                    <p className="text-sm text-gray-500 py-4 text-center">No pages found</p>
                  )}
                  {fbPages.map(p => (
                    <label
                      key={p.pageId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedFb.includes(p.pageId)
                          ? "bg-blue-100 border-2 border-blue-500"
                          : "bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFb.includes(p.pageId)}
                        onChange={() => toggle(p.pageId, setSelectedFb)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Instagram Accounts */}
              <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-5 border border-pink-100">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Instagram Accounts</h3>
                  <span className="ml-auto text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                    {selectedIg.length} selected
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {igAccounts.length === 0 && (
                    <p className="text-sm text-gray-500 py-4 text-center">No accounts found</p>
                  )}
                  {igAccounts.map(a => (
                    <label
                      key={a.instagramBusinessId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedIg.includes(a.instagramBusinessId)
                          ? "bg-pink-100 border-2 border-pink-500"
                          : "bg-white border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIg.includes(a.instagramBusinessId)}
                        onChange={() => toggle(a.instagramBusinessId, setSelectedIg)}
                        className="w-5 h-5 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {getInstagramDisplayName(a)}
                        {a.isActive ? " ✓" : " (inactive)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Content
              </label>
              <textarea
                rows="5"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="What's on your mind? Share your thoughts..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>

            {/* Media Upload */}
            {(mode === "Image" || mode === "Video") && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload {mode === "Image" ? "Image" : "Video"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept={mode === "Image" ? "image/*" : "video/*"}
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  >
                    {filePreview ? (
                      <div className="relative w-full h-full p-2">
                        {mode === "Image" ? (
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        ) : (
                          <video
                            src={filePreview}
                            className="w-full h-full object-contain rounded-lg"
                            controls
                          />
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          {mode === "Image" ? "PNG, JPG, GIF up to 10MB" : "MP4, MOV up to 100MB"}
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedFb.length + selectedIg.length > 0 ? (
                  <span>Publishing to {selectedFb.length + selectedIg.length} platform(s)</span>
                ) : (
                  <span>Select at least one platform</span>
                )}
              </div>
              <button
                onClick={submit}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Publishing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Section */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Publishing Results
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {result.map(r => (
                <div
                  key={r.targetAccountId}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    r.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {r.success ? (
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{r.targetAccountId}</p>
                      <p className={`text-sm ${r.success ? "text-green-700" : "text-red-700"}`}>
                        {r.status}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    r.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {r.success ? "Success" : "Failed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
