import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useBrand } from "../context/BrandContext";
import toast from "react-hot-toast";

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

/**
 * Route guard — blocks access to dashboard routes until the user
 * has at least one brand AND one is active.
 * - No brands at all → redirect to /brand/setup (create first brand)
 * - Brands exist but none active → show inline brand selection screen
 * - Active brand → render dashboard outlet
 */
export default function BrandGate() {
  const navigate = useNavigate();
  const { brands, activeBrand, loading, switchBrand } = useBrand();
  const [switching, setSwitching] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (brands.length === 0) {
      navigate("/crm/socialmedia/brand/setup", { replace: true });
    }
  }, [loading, brands, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-500 text-sm">Loading brand...</p>
        </div>
      </div>
    );
  }

  // Brands exist but none is active — ask the user to select one
  if (brands.length > 0 && !activeBrand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Select a Brand</h1>
            <p className="text-gray-500 mt-2 text-sm">
              No brand is currently active. Choose one below to continue.
            </p>
          </div>

          <div className="space-y-3">
            {brands.map((brand) => {
              const isSwitching = switching === brand.slug;
              return (
                <div
                  key={brand.slug}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-slate-400 to-slate-600 shadow-sm">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt={brand.name} className="w-11 h-11 rounded-xl object-cover"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <span className="text-white text-sm font-bold">{initials(brand.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{brand.name}</p>
                    {brand.description && (
                      <p className="text-xs text-slate-400 truncate">{brand.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleActivate(brand.slug)}
                    disabled={isSwitching}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 flex-shrink-0"
                  >
                    {isSwitching ? "Activating..." : "Activate"}
                  </button>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            You can also create a new brand from the Brand Manager.
          </p>
        </div>
      </div>
    );
  }

  if (!activeBrand) return null;

  return <Outlet />;
}
