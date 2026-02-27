import { useState, useRef } from "react";
import { getCapabilities } from "../store/capabilities.store";

export default function Topbar() {
  const caps = getCapabilities();

  const [showPageDropdown, setShowPageDropdown] = useState(false);

  const dropdownRef = useRef(null);

  return (
    <div className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 ml-6 relative" ref={dropdownRef}>

          {caps?.hasActivePage ? (
            <div className="flex items-center gap-3">

              {/* Active Page */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>

                  <span
                    onClick={() =>
                      setShowPageDropdown(!showPageDropdown)
                    }
                    className="text-sm font-medium text-green-700 cursor-pointer hover:text-green-900 transition-colors"
                  >
                    {caps.activePageName}
                  </span>
                </div>

                {/* Page Overview Dropdown */}
                {showPageDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Page Overview
                    </h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Page Name</span>
                        <span className="font-semibold text-gray-900">
                          {caps.activePageName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className="font-semibold text-green-600">
                          Active
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Connected</span>
                        <span className="font-semibold text-gray-900">
                          Facebook
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-700">
                No active page
              </span>
            </div>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            </svg>
          </button>

          {/* Avatar */}
          <button className="flex items-center p-2 hover:bg-gray-100 rounded-lg transition">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">U</span>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}