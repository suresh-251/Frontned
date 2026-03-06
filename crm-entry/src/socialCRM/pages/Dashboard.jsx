// import React, { useState, useEffect, cloneElement } from "react";
// import useFacebookDashboard from "../hooks/useFacebookDashboard";
// import api from "../api/apiClient";
// import { connectPlatform } from "../api/auth.api";
// import { getInstagramDisplayName } from "../utils/instagramDisplayName";
// import { useNavigate } from "react-router-dom";
// import {
//   FiEdit,
//   FiUsers,
//   FiFileText,
//   FiSettings,
//   FiActivity,
//   FiInfo,
//   FiFacebook,
//   FiInstagram,
//   FiLinkedin,
//   FiPlus
// } from "react-icons/fi";

// export default function Dashboard() {
//   const stats = useFacebookDashboard();
//   const navigate = useNavigate();

//   const [fbPages, setFbPages] = useState([]);
//   const [igAccounts, setIgAccounts] = useState([]);
//   const [linkedInPages, setLinkedInPages] = useState([]);
//   const [linkedInProfile, setLinkedInProfile] = useState(null);

//   useEffect(() => {
//     api.get("/facebook/pages").then(res => setFbPages(res.data)).catch(() => {});
//     api.get("/instagram/accounts").then(res => setIgAccounts(res.data)).catch(() => {});
//     api.get("/linkedin/orgs").then(res => setLinkedInPages(res.data)).catch(() => {});
//     api.get("/linkedin/read/profile")
//       .then(res => setLinkedInProfile({ id: res.data.sub, name: res.data.name }))
//       .catch(() => {});
//   }, []);

//   if (!stats) return null;

//   return (
//     <div className="w-full min-h-screen bg-[#F8FAFC] p-6 animate-in fade-in duration-500">
      
//       {/* HEADER: Integrated directly into the layout */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h1>
//         <p className="text-xs text-slate-500 font-medium">Welcome back! Here is what's happening with your brands today.</p>
//       </div>

//       <div className="grid grid-cols-12 gap-6">
        
//         {/* LEFT SECTION: Brand Health & Growth */}
//         <div className="col-span-12 lg:col-span-8 space-y-6">
          
//           {/* BRAND HEALTH TABLE */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
//             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
//               <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
//                 Brand Health <FiInfo className="text-slate-300" size={14} />
//               </h3>
//             </div>

//             {/* SCROLLABLE TABLE BODY */}
//             <div className="overflow-y-auto max-h-[300px] custom-scrollbar">
//               <table className="w-full text-left border-collapse">
//                 <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 border-b border-slate-100">
//                   <tr>
//                     <th className="px-6 py-3">Channel</th>
//                     <th className="px-6 py-4">Followers</th>
//                     <th className="px-6 py-4">Reach</th>
//                     <th className="px-6 py-4">Leads</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-50">
//                   {fbPages.map(p => <MetricRow key={p.pageId} name={p.name} type="Facebook" icon={<FiFacebook/>} stats={stats} color="text-blue-600" />)}
//                   {igAccounts.map(a => <MetricRow key={a.instagramBusinessId} name={getInstagramDisplayName(a)} type="Instagram" icon={<FiInstagram/>} stats={stats} color="text-pink-500" />)}
//                   {linkedInProfile && <MetricRow name={linkedInProfile.name} type="LinkedIn" icon={<FiLinkedin/>} stats={stats} color="text-blue-800" />}
//                   {/* Demo rows to show scrollability */}
//                   {[1, 2, 3].map(i => <MetricRow key={i} name={`Branch Account ${i}`} type="Global" icon={<FiActivity/>} stats={stats} color="text-slate-400" />)}
//                 </tbody>
//               </table>
//             </div>

//             {/* CONNECT CHANNELS BAR (ZOHO STYLE) */}
//             <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
//               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect New:</span>
//               <div className="flex gap-5">
//                 <SocialLinkBtn icon={<FiFacebook />} label="Facebook" color="hover:text-blue-600" onClick={() => connectPlatform("facebook")} />
//                 <SocialLinkBtn icon={<FiInstagram />} label="Instagram" color="hover:text-pink-500" onClick={() => connectPlatform("facebook")} />
//                 <SocialLinkBtn icon={<FiLinkedin />} label="LinkedIn" color="hover:text-blue-800" onClick={() => connectPlatform("linkedin")} />
//               </div>
//             </div>
//           </div>

//           {/* BRAND GROWTH GRAPH CARD */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Growth Analytics</h4>
//                 <p className="text-2xl font-black text-slate-800 tracking-tight">+14.2%</p>
//               </div>
//               <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold uppercase">Trending</div>
//             </div>
            
//             <div className="h-32 w-full mt-2">
//               <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d">
//                 <defs>
//                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
//                     <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
//                   </linearGradient>
//                 </defs>
//                 <path d="M0,80 C50,85 80,40 120,45 C160,50 200,20 250,30 C300,40 350,10 400,15 L400,100 L0,100 Z" fill="url(#chartGradient)" />
//                 <path d="M0,80 C50,85 80,40 120,45 C160,50 200,20 250,30 C300,40 350,10 400,15" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
//               </svg>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT SECTION: Quick Actions (2x2) & Live Stream */}
//         <div className="col-span-12 lg:col-span-4 space-y-6">
          
//           {/* QUICK ACTIONS 2x2 GRID */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
//             <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest mb-5">Quick Actions</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <CompactAction icon={<FiEdit />} label="Post" color="bg-blue-600" onClick={() => navigate("/crm/socialmedia/post/create")} />
//               <CompactAction icon={<FiUsers />} label="Leads" color="bg-indigo-600" onClick={() => navigate("/crm/socialmedia/leads")} />
//               <CompactAction icon={<FiFileText />} label="Forms" color="bg-emerald-600" onClick={() => navigate("/crm/socialmedia/leads/forms")} />
//               <CompactAction icon={<FiSettings />} label="Config" color="bg-slate-700" onClick={() => navigate("/crm/socialmedia/facebook/pages/subscriptions")} />
//             </div>
//           </div>

//           {/* ACTIVITY STREAM */}
//           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-slate-800 font-bold text-[10px] uppercase tracking-widest">Recent Activity</h3>
//               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
//             </div>
//             <div className="space-y-6">
//               <ActivityItem text="Facebook Sync" time="2m ago" />
//               <ActivityItem text="New Lead Received" time="15m ago" />
//               <ActivityItem text="Instagram Updated" time="1h ago" />
//             </div>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }

// /* ================= COMPONENT HELPERS ================= */

// function MetricRow({ name, type, icon, stats, color }) {
//   return (
//     <tr className="hover:bg-slate-50/80 transition-colors group">
//       <td className="px-6 py-4">
//         <div className="flex items-center gap-3">
//           <div className={`text-lg ${color} transition-transform group-hover:scale-110`}>{icon}</div>
//           <div>
//             <p className="text-[11px] font-bold text-slate-700 leading-tight">{name}</p>
//             <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{type}</p>
//           </div>
//         </div>
//       </td>
//       <td className="px-6 py-4 text-[11px] font-bold text-slate-600 tracking-tight">1.2k</td>
//       <td className="px-6 py-4 text-[11px] font-bold text-slate-600 tracking-tight">458</td>
//       <td className="px-6 py-4">
//         <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
//           {stats.totalLeads}
//         </span>
//       </td>
//     </tr>
//   );
// }

// function SocialLinkBtn({ icon, label, color, onClick }) {
//   return (
//     <button 
//       onClick={onClick}
//       className={`flex items-center gap-2 text-slate-300 ${color} transition-all hover:scale-105`}
//     >
//       {cloneElement(icon, { size: 16 })}
//       <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
//     </button>
//   );
// }

// function CompactAction({ icon, label, color, onClick }) {
//   return (
//     <button 
//       onClick={onClick}
//       className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all active:scale-95 group"
//     >
//       <div className={`w-10 h-10 rounded-lg ${color} text-white flex items-center justify-center shadow-md mb-2 group-hover:-translate-y-1 transition-transform`}>
//         {cloneElement(icon, { size: 18 })}
//       </div>
//       <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
//     </button>
//   );
// }

// function ActivityItem({ text, time }) {
//   return (
//     <div className="flex items-center justify-between border-l-2 border-slate-100 pl-4 py-1">
//       <p className="text-[11px] font-bold text-slate-600">{text}</p>
//       <span className="text-[9px] font-bold text-slate-300 uppercase">{time}</span>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import useFacebookDashboard from "../hooks/useFacebookDashboard";
import api from "../api/apiClient";
import { connectPlatform } from "../api/auth.api";
import { getInstagramDisplayName } from "../utils/instagramDisplayName";
import { useNavigate } from "react-router-dom";
import {
  FiEdit, FiUsers, FiFileText, FiSettings, FiFacebook, 
  FiInstagram, FiLinkedin, FiLoader, FiAlertCircle
} from "react-icons/fi";

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = useFacebookDashboard() || { totalLeads: 0 };

  // Initialize all states as empty arrays to prevent mapping errors
  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);
  const [linkedInPages, setLinkedInPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorOccurred, setErrorOccurred] = useState(false);

  // CRITICAL: Ref to track if we already sent the requests
  const hasFetched = useRef(false);

  useEffect(() => {
    // This 'if' block ensures we hit the backend ONLY ONCE
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadData = async () => {
      try {
        console.log("Dashboard: Initiating single-fetch sync...");
        
        const [fb, ig, li] = await Promise.allSettled([
          api.get("/facebook/pages"),
          api.get("/instagram/accounts"),
          api.get("/linkedin/orgs")
        ]);

        if (fb.status === "fulfilled") setFbPages(fb.value?.data || []);
        if (ig.status === "fulfilled") setIgAccounts(ig.value?.data || []);
        if (li.status === "fulfilled") setLinkedInPages(li.value?.data || []);

        // If all endpoints failed, the backend is likely down or token is expired
        if (fb.status === "rejected" && ig.status === "rejected") {
          setErrorOccurred(true);
        }
      } catch (err) {
        console.error("Dashboard Request Failed", err);
        setErrorOccurred(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Empty dependency array means "run only on mount"

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
        <FiLoader className="animate-spin text-blue-600 mb-2" size={30} />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Securing Connection...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      
      {errorOccurred && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
          <FiAlertCircle size={18} />
          <p className="text-[10px] font-black uppercase tracking-tight">Backend unstable (500). Please check server logs.</p>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: TABLE */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brand Channels</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[9px] uppercase font-black text-slate-400 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3 text-center">Followers</th>
                <th className="px-4 py-3 text-center">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fbPages.map(p => (
                <tr key={p.pageId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <FiFacebook className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-slate-500">1.2k</td>
                  <td className="px-4 py-3 text-center text-xs font-black text-blue-600">{stats.totalLeads || 0}</td>
                </tr>
              ))}
              {/* Fallback for empty data */}
              {fbPages.length === 0 && igAccounts.length === 0 && (
                <tr><td colSpan="3" className="py-10 text-center text-slate-300 text-[10px] uppercase font-bold italic">No Connected Channels</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT: QUICK ACTIONS */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operations</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate("/post/create")} className="flex flex-col items-center p-3 bg-slate-50 rounded-lg hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
                <FiEdit className="text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-600">Post</span>
              </button>
              <button onClick={() => navigate("/leads")} className="flex flex-col items-center p-3 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                <FiUsers className="text-indigo-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-600">Leads</span>
              </button>
            </div>
          </div>
          
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leads Forecast</p>
             <h2 className="text-3xl font-black mt-1 tracking-tighter">{stats.totalLeads || 0}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}