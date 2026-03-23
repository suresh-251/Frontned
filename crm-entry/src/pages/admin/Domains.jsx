import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getDomains,
  createDomain,
  toggleDomainStatus,
} from "../../api/admin/domains.api";

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  const [domainName, setDomainName] = useState("");
  const [domainCode, setDomainCode] = useState("");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadDomains();
  }, []);

  /* =======================
     LOAD DOMAINS
     ======================= */
  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await getDomains();
      setDomains(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load domains failed", err);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     CREATE DOMAIN
     ======================= */
  const handleCreateDomain = async () => {
    if (!domainName.trim() || !domainCode.trim()) {
      toast.error("Domain name and code are required");
      return;
    }

    try {
      setCreating(true);

      await createDomain({
        domainName: domainName.trim(),
        domainCode: domainCode.trim().toUpperCase(),
      });

      setDomainName("");
      setDomainCode("");
      loadDomains();
    } catch (err) {
      console.error("Create domain failed", err);
      toast.error("Failed to create domain");
    } finally {
      setCreating(false);
    }
  };

  /* =======================
     TOGGLE DOMAIN ACTIVE
     ======================= */
  const toggleDomain = async (domain) => {
    const action = domain.active ? "disable" : "enable";

    if (!window.confirm(`Are you sure you want to ${action} this CRM?`))
      return;

    try {
      await toggleDomainStatus(domain.domainId, !domain.active);
      loadDomains();
    } catch (err) {
      console.error("Toggle domain failed", err);
      toast.error("Failed to update domain status");
    }
  };

  /* =======================
     NAVIGATE TO CRM
     ======================= */
  const openDomain = (domain) => {
    if (!domain.active) return;
    navigate(`/crm/${domain.domainCode.toLowerCase()}/dashboard`);
  };

  /* =======================
     LOADING STATE
     ======================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading domains...</p>
        </div>
      </div>
    );
  }

  /* =======================
     MAIN UI
     ======================= */
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* MODERN HEADER */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Domains Management</h2>
              <p className="text-sm text-gray-600">Manage business CRMs and control their availability</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-green-700">
                {domains.filter(d => d.active && d.domainCode !== 'SYSTEM').length} Active
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="text-sm font-medium text-blue-700">{domains.filter(d => d.domainCode !== 'SYSTEM').length} Total Domains</span>
            </div>
          </div>
        </div>

        {/* =======================
           ADD DOMAIN - MODERN CARD
           ======================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Add New Domain</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Domain Name (e.g. Finance)"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Domain Code (e.g. FINANCE)"
                value={domainCode}
                onChange={(e) => setDomainCode(e.target.value)}
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-2.5 text-sm uppercase focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>

            <button
              onClick={handleCreateDomain}
              disabled={creating}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl px-6 py-2.5 font-medium hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {creating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Domain
                </>
              )}
            </button>
          </div>
        </div>

        {/* =======================
           DOMAINS TABLE - MODERN CARDS
           ======================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              All Domains
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Domain</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Updated</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {domains
                  .filter((d) => d.domainCode !== "SYSTEM")
                  .map((d) => (
                    <tr
                      key={d.domainId}
                      className={`transition-all ${
                        d.active
                          ? "hover:bg-green-50 cursor-pointer"
                          : "bg-gray-50 opacity-70"
                      }`}
                      onClick={() => openDomain(d)}
                    >

                      {/* DOMAIN */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${d.active ? 'bg-green-100' : 'bg-gray-200'}`}>
                            <svg className={`w-5 h-5 ${d.active ? 'text-green-600' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                          </div>
                          <div>
                            <div className={`font-semibold ${d.active ? "text-green-700" : "text-gray-500"}`}>
                              {d.domainName}
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                              {d.domainCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            d.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${d.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {d.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>

                      {/* CREATED */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>

                      {/* UPDATED */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {d.updatedAt ? (
                          new Date(d.updatedAt).toLocaleDateString()
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Never modified
                          </span>
                        )}
                      </td>

                      {/* ADMIN CONTROL */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => toggleDomain(d)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            d.active
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {d.active ? "🔒 Disable" : "✅ Enable"}
                        </button>
                      </td>

                    </tr>
                  ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
