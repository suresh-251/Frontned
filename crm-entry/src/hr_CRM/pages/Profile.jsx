// import React, { useEffect, useState } from "react";
// import { User, Shield, Mail, Phone, Globe, Building2, Fingerprint, Calendar, Loader2 } from "lucide-react";
// import {getSelfProfile} from "../api/self.api.js"

// export default function Profile() {
//   const [userData, setUserData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     getSelfProfile()
//       .then(setUserData)
//       .catch(() => {})
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) return (
//     <div className="flex h-[60vh] items-center justify-center">
//       <Loader2 className="animate-spin text-indigo-500" size={32} />
//     </div>
//   );

//   const identity = userData?.identity || {};
//   const personal = userData?.personal || {};
//   const organization = userData?.organization || {};
//   const account = userData?.account || {};

//   return (
//     <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans text-[var(--text-main)] transition-colors duration-300">
//       {/* PROFILE HEADER */}
//       <div className="flex items-center gap-6 border-b border-[var(--border-color)] pb-8">
//         <div className="h-24 w-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/20 uppercase">
//           {identity.username?.charAt(0)}
//         </div>
//         <div>
//           <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-2">
//             {personal.firstName} {personal.lastName}
//           </h1>
//           <div className="flex items-center gap-3">
//             <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest flex items-center gap-1.5">
//               <Shield size={14} className="text-indigo-500" /> {organization.designation || "Authorized Personnel"}
//             </p>
//             <span className="h-1 w-1 rounded-full bg-slate-300" />
//             <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-tighter">
//               {account.accountStatus || 'Active'}
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* IDENTITY BLOCK */}
//         <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
//           <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-5">System Credentials</h3>
//           <div className="space-y-5">
//             <InfoRow icon={<Fingerprint />} label="Access ID" value={identity.userId} />
//             <InfoRow icon={<User />} label="Display Handle" value={identity.username} />
//             <InfoRow icon={<Mail />} label="Secure Email" value={identity.email} />
//           </div>
//         </div>

//         {/* ORGANIZATION BLOCK */}
//         <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
//           <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em] mb-5">Professional Profile</h3>
//           <div className="space-y-5">
//             <InfoRow icon={<Globe />} label="System Domain" value={organization.domain} />
//             <InfoRow icon={<Building2 />} label="Business Unit" value={organization.department || "Corporate"} />
//             <InfoRow icon={<Phone />} label="Communication" value={personal.mobileNumber || "---"} />
//           </div>
//         </div>
//       </div>

//       {/* FOOTER INFO */}
//       <div className="pt-4 text-center">
//          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
//            Account Encrypted & Established {new Date(account.createdAt).toLocaleDateString()}
//          </p>
//       </div>
//     </div>
//   );
// }

// const InfoRow = ({ icon, label, value }) => (
//   <div className="flex items-center justify-between">
//     <div className="flex items-center gap-3">
//       <div className="p-2 bg-[var(--bg-body)] rounded-xl text-slate-400 border border-[var(--border-color)]/30">
//         {React.cloneElement(icon, { size: 14 })}
//       </div>
//       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
//     </div>
//     <span className="text-[11px] font-black uppercase text-[var(--text-main)] truncate max-w-[150px]">{value || "---"}</span>
//   </div>
// );