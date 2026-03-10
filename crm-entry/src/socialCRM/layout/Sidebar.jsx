import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBrand } from "../context/BrandContext";

const LOGO_KEY = "nafaSocialLogo";

export default function Sidebar() {
  const location = useLocation();
  const { activeBrand } = useBrand();
  const fileRef = useRef(null);
  const [logo, setLogo] = useState(() => localStorage.getItem(LOGO_KEY) || null);

  const isActive = (path) => location.pathname === path;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      localStorage.setItem(LOGO_KEY, dataUrl);
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      {/* Logo / App Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div
            onClick={() => fileRef.current?.click()}
            title="Click to change logo"
            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {logo ? (
              <img src={logo} alt="NaFa Social" className="w-10 h-10 object-cover" />
            ) : (
              <span className="text-white text-xl font-bold">N</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">NaFa Social</h2>
            {activeBrand ? (
              <p className="text-xs text-blue-600 font-semibold truncate max-w-[130px]" title={activeBrand.name}>
                {activeBrand.name}
              </p>
            ) : (
              <p className="text-xs text-gray-500">CRM Dashboard</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Link
          to="/crm/socialmedia/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/dashboard")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Dashboard</span>
        </Link>

        <Link
          to="/crm/socialmedia/post/create"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/post/create")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Compose Post</span>
        </Link>

        <Link
          to="/crm/socialmedia/post/history"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/post/history")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>Post History</span>
        </Link>

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Brands</p>
        </div>

        <Link
          to="/crm/socialmedia/brands"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/brands")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Manage Brands</span>
        </Link>

        <div className="pt-4 pb-2">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Leads</p>
        </div>

        <Link
          to="/crm/socialmedia/leads"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/leads")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Leads</span>
        </Link>

        <Link
          to="/crm/socialmedia/leads/forms"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive("/crm/socialmedia/leads/forms")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Lead Forms</span>
        </Link>

        <Link
          to="/crm/socialmedia/facebook/pages/subscriptions"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
            isActive("/crm/socialmedia/facebook/pages/subscriptions")
              ? "bg-blue-50 text-blue-600 font-semibold shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Page Subscriptions</span>
        </Link>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">U</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">User</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("brandSlug");
            window.location.href = "/crm/socialmedia/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </div>
  );
}
