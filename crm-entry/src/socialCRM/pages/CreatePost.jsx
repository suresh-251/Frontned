import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { getInstagramDisplayName } from "../utils/instagramDisplayName";
// import { getLinkedInOrgs } from "../api/linkedin.orgs.api";
import { connectPlatform } from "../api/auth.api";
 
export default function CreatePost() {
  const [mode, setMode] = useState("Text"); // Text | Image | Video
  const [showDropdown, setShowDropdown] = useState(false);
 
  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);
const [linkedInPages, setLinkedInPages] = useState([]);
const [linkedInProfile, setLinkedInProfile] = useState(null);
 
  const [selectedFb, setSelectedFb] = useState([]);
  const [selectedIg, setSelectedIg] = useState([]);
  const [selectedLinkedIn, setSelectedLinkedIn] = useState([]);
 
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
 
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
 
  /* =========================
     LOAD LINKEDIN ORGS
     ========================= */
  // useEffect(() => {
  //   getLinkedInOrgs()
  //     .then(data => setLinkedInOrgs(data))
  //     .catch(() => {});
  // }, []);
 
  const toggle = (id, setter) => {
    setter(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };
  useEffect(() => {
  api.get("/linkedin/orgs")
    .then(res => {
      setLinkedInPages(
        res.data.map(p => ({
          ...p,
          type: "organization"
        }))
      );
    })
    .catch(() => {});
}, []);
/*=============================
LINKEDIN profile
===========================*/
useEffect(() => {
  api.get("/linkedin/read/profile")
    .then(res => {
      setLinkedInProfile({
        id: res.data.sub,
        name: res.data.name,
        type: "profile"
      });
    })
    .catch(() => {});
}, []);
 
  /* =========================
     GET SELECTED COUNT & NAMES
     ========================= */
  const getSelectedCount = () => {
    return selectedFb.length + selectedIg.length + selectedLinkedIn.length;
  };
 
  const getSelectedNames = () => {
    const names = [];
   
    selectedFb.forEach(id => {
      const page = fbPages.find(p => p.pageId === id);
      if (page) names.push({ name: page.name, platform: 'Facebook', icon: 'fb' });
    });
   
    selectedIg.forEach(id => {
      const account = igAccounts.find(a => a.instagramBusinessId === id);
      if (account) names.push({ name: getInstagramDisplayName(account), platform: 'Instagram', icon: 'ig' });
    });
   
    selectedLinkedIn.forEach(id => {
 
  // Profile
  if (linkedInProfile && id === linkedInProfile.id) {
    names.push({
      name: linkedInProfile.name,
      platform: 'LinkedIn',
      icon: 'li',
      badge: 'Personal'
    });
  }
 
  // Pages
  const page = linkedInPages.find(p => p.id === id);
  if (page) {
    names.push({
      name: page.name,
      platform: 'LinkedIn',
      icon: 'li',
      badge: 'Page'
    });
  }
});
 
   
    return names;
  };
 
  /* =========================
     CONNECT PLATFORM
     ========================= */
  const handleConnect = (platform) => {
    connectPlatform(platform);
  };
 
  /* =========================
     SUBMIT (UNIFIED)
     ========================= */
  const submit = async () => {
    if (!selectedFb.length && !selectedIg.length && !selectedLinkedIn.length) {
      setError("Select at least one platform to post");
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
      if (selectedLinkedIn.length) form.append("Platforms", "LinkedIn");
 
      // Targets
      [...selectedFb, ...selectedIg, ...selectedLinkedIn].forEach(id =>
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
      setError(e.response?.data?.message || "Post failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
          <p className="text-gray-600 mt-1">Share your content across multiple platforms</p>
        </div>
 
        {/* Main Card - Meta Style */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
          {/* Post Type Selector */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode("Text")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === "Text"
                    ? "bg-blue-50 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                📝 Text
              </button>
              <button
                onClick={() => setMode("Image")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === "Image"
                    ? "bg-blue-50 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🖼️ Image
              </button>
              <button
                onClick={() => setMode("Video")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  mode === "Video"
                    ? "bg-blue-50 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                🎥 Video
              </button>
            </div>
          </div>
 
          {/* Platform Selection - Dropdown Style */}
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Select where to post:</p>
           
            {/* Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {getSelectedCount() > 0 ? (
                    <span className="font-medium text-gray-900">
                      {getSelectedCount()} platform{getSelectedCount() > 1 ? 's' : ''} selected
                    </span>
                  ) : (
                    <span className="text-gray-500">Choose platforms to post</span>
                  )}
                </div>
                <svg className={`w-5 h-5 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
 
              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                  {/* Facebook Pages */}
                  {fbPages.length > 0 && (
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span className="font-semibold text-gray-900">Facebook Pages</span>
                      </div>
                      {fbPages.map(p => (
                        <label
                          key={p.pageId}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFb.includes(p.pageId)}
                            onChange={() => toggle(p.pageId, setSelectedFb)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900">{p.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
 
                  {/* Instagram Accounts */}
                  {igAccounts.length > 0 && (
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span className="font-semibold text-gray-900">Instagram Accounts</span>
                      </div>
                      {igAccounts.map(a => (
                        <label
                          key={a.instagramBusinessId}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-all"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIg.includes(a.instagramBusinessId)}
                            onChange={() => toggle(a.instagramBusinessId, setSelectedIg)}
                            className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                          />
                          <span className="text-sm text-gray-900">{getInstagramDisplayName(a)}</span>
                        </label>
                      ))}
                    </div>
                  )}
 
                  {/* LinkedIn Orgs */}
                  {/* LinkedIn Profile */}
{linkedInProfile && (
  <div className="p-3 border-b border-gray-200">
    <div className="flex items-center gap-2 mb-2">
      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
      </svg>
      <span className="font-semibold text-gray-900">
        LinkedIn Profile
      </span>
    </div>
 
    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
      <input
        type="checkbox"
        checked={selectedLinkedIn.includes(linkedInProfile.id)}
        onChange={() => toggle(linkedInProfile.id, setSelectedLinkedIn)}
        className="w-4 h-4 text-blue-700"
      />
      <span className="text-sm text-gray-900">
        {linkedInProfile.name}
      </span>
      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        Personal
      </span>
    </label>
  </div>
)}
 
{/* LinkedIn Pages */}
{linkedInPages.length > 0 && (
  <div className="p-3">
    <div className="flex items-center gap-2 mb-2">
      <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
      </svg>
      <span className="font-semibold text-gray-900">
        LinkedIn Pages
      </span>
    </div>
 
    {linkedInPages.map(page => (
      <label
        key={page.id}
        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
      >
        <input
          type="checkbox"
          checked={selectedLinkedIn.includes(page.id)}
          onChange={() => toggle(page.id, setSelectedLinkedIn)}
          className="w-4 h-4 text-blue-700"
        />
        <span className="text-sm text-gray-900">
          {page.name}
        </span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          Page
        </span>
      </label>
    ))}
  </div>
)}
 
 
                  {/* No Accounts Available */}
                  {fbPages.length === 0 && igAccounts.length === 0 && !linkedInProfile &&
 linkedInPages.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <p className="mb-3">No accounts connected</p>
                      <p className="text-sm">Connect your social media accounts to start posting</p>
                    </div>
                  )}
                </div>
              )}
            </div>
 
            {/* Selected Platforms Pills */}
            {getSelectedCount() > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {getSelectedNames().map((item, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      item.icon === 'fb' ? 'bg-blue-100 text-blue-700' :
                      item.icon === 'ig' ? 'bg-pink-100 text-pink-700' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.icon === 'fb' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    )}
                    {item.icon === 'ig' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    )}
                    {item.icon === 'li' && (
  <>
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"/>
    </svg>
    {item.badge && (
      <span className="text-xs bg-white bg-opacity-40 px-2 py-0.5 rounded-full">
        {item.badge}
      </span>
    )}
  </>
)}
 
                    <span className="truncate max-w-[150px]">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {/* Connection buttons - Always Visible for Adding More Accounts */}
          <div className="px-4 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add More Accounts
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleConnect('facebook')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Connect Facebook</span>
                </button>
               
                <button
                  onClick={() => handleConnect('facebook')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Connect Instagram</span>
                </button>
               
                <button
                  onClick={() => handleConnect('linkedin')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-medium shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>Connect LinkedIn</span>
                </button>
              </div>
            </div>
          </div>
 
          {/* Content Area */}
          <div className="p-4">
            <textarea
              rows={6}
              placeholder="What's on your mind? Share your thoughts..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full border-0 focus:outline-none focus:ring-0 text-gray-900 text-lg resize-none placeholder-gray-400"
            />
 
            {/* Media Upload */}
            {(mode === "Image" || mode === "Video") && (
              <div className="mt-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                    {file ? (
                      <div>
                        <p className="text-green-600 font-medium mb-2">✓ {file.name}</p>
                        <p className="text-sm text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">{mode === "Image" ? "🖼️" : "🎥"}</div>
                        <p className="text-gray-600 font-medium mb-1">
                          Add {mode === "Image" ? "photos/images" : "videos"}
                        </p>
                        <p className="text-sm text-gray-400">or drag and drop</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept={mode === "Image" ? "image/*" : "video/*"}
                    onChange={e => setFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
 
            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <span className="text-xl">⚠️</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>
 
          {/* Footer with Actions */}
          <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-200 rounded-full transition-all" title="Add photo">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-full transition-all" title="Add emoji">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
 
            <button
              onClick={submit}
              disabled={loading || (!selectedFb.length && !selectedIg.length && !selectedLinkedIn.length)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Posting...
                </>
              ) : (
                "Post Now"
              )}
            </button>
          </div>
        </div>
 
        {/* Results */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">✅ Post Results</h3>
            <div className="space-y-3">
              {result.map(r => (
                <div
                  key={r.targetAccountId}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                    r.success
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.success ? "✅" : "❌"}</span>
                    <div>
                      <p className="font-medium text-gray-900">{r.targetAccountName || r.targetAccountId}</p>
                      <p className={`text-sm ${r.success ? "text-green-600" : "text-red-600"}`}>
                        {r.status}
                      </p>
                    </div>
                  </div>
                 {r.success && r.viewPostUrl && (
  <div className="flex flex-col items-end gap-1">
    <a
      href={r.viewPostUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
    >
      View Post →
    </a>
 
    {r.profileUrl && (
      <a
        href={r.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-700 text-xs"
      >
        Go to Account
      </a>
    )}
  </div>
)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
 
 