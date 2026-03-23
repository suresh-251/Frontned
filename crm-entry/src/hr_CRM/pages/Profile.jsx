import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, Pencil, X, Check } from "lucide-react";
import { getUserById } from "../../api/users/users.api";
import { getSelfProfile, updateSelfProfile } from "../api/api.profile";
import { getAuthDetails } from "../configs/auth.utils";
import toast, { Toaster } from "react-hot-toast";

/* Normalize both API response shapes into one common shape */
const normalize = (data) => {
  if (!data) return null;

  // getUserById shape: { userId, username, email, accountStatus, profile:{}, organization:{}, roles:[], createdAt }
  if (data.profile !== undefined || typeof data.userId === "number") {
    return {
      userId:        data.userId,
      username:      data.username,
      email:         data.email,
      accountStatus: data.accountStatus,
      roles:         data.roles || [],
      createdAt:     data.createdAt,
      p:             data.profile      || {},
      org:           data.organization || {},
    };
  }

  // getSelfProfile shape: { identity:{}, personal:{}, organization:{}, account:{} }
  const i = data.identity     || {};
  const p = data.personal     || {};
  const o = data.organization || {};
  const a = data.account      || {};
  return {
    userId:        i.userId,
    username:      i.username,
    email:         i.email,
    accountStatus: a.accountStatus,
    roles:         [],
    createdAt:     a.createdAt,
    p: {
      firstName:    p.firstName,
      lastName:     p.lastName,
      mobileNumber: p.mobileNumber,
      gender:       p.gender,
    },
    org: {
      domainName:      o.domain || o.domainName,
      department:      o.department,
      designation:     o.designation,
      assignedBranch:  o.assignedBranch,
      assignedRegion:  o.assignedRegion,
      employmentType:  o.employmentType,
      workShift:       o.workShift,
      managerName:     o.managerName,
      employeeId:      o.employeeId,
      payrollAmount:   o.payrollAmount,
      remarks:         o.remarks,
    },
  };
};

export default function Profile() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({});

  const auth   = getAuthDetails();
  const userId = auth?.userId;

  const load = async () => {
    if (!userId) { setError(true); setLoading(false); return; }
    setLoading(true);
    setError(false);
    try {
      // Try full-detail API first; fall back to self-profile if permission denied
      let raw;
      try {
        raw = await getUserById(userId);
      } catch {
        raw = await getSelfProfile();
      }
      const norm = normalize(raw);
      setData(norm);
      buildForm(norm);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const buildForm = (norm) => {
    if (!norm) return;
    setForm({
      firstName:          norm.p.firstName          ?? "",
      lastName:           norm.p.lastName           ?? "",
      gender:             norm.p.gender             ?? norm.org.gender ?? "",
      mobileNumber:       norm.p.mobileNumber       ?? "",
      addressLine1:       norm.p.addressLine1       ?? "",
      city:               norm.p.city               ?? "",
      state:              norm.p.state              ?? "",
      country:            norm.p.country            ?? "",
      postalCode:         norm.p.postalCode         ?? "",
      languagePreference: norm.p.languagePreference ?? "",
      timezone:           norm.p.timezone           ?? "",
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSelfProfile(form);
      toast.success("Profile updated");
      await load();
      setEditMode(false);
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* ── STATES ── */
  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={28} />
    </div>
  );

  if (error || !data) return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-2">
      <AlertCircle size={26} className="text-rose-500" />
      <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Failed to load profile</p>
    </div>
  );

  const fullName = [data.p.firstName, data.p.lastName].filter(Boolean).join(" ") || data.username || "---";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5 font-sans text-[var(--text-main)]">
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-black text-white uppercase shrink-0">
            {data.username?.charAt(0) || "?"}
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight">{fullName}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {data.org.designation || "—"}{data.org.department ? ` · ${data.org.department}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            data.accountStatus === "Active"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}>{data.accountStatus || "Active"}</span>
          {!editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase rounded-lg tracking-wider transition-all active:scale-95">
              <Pencil size={10} /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── VIEW MODE ── */}
      {!editMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card title="Account">
            <Row label="User ID"      value={data.userId} />
            <Row label="Username"     value={data.username} />
            <Row label="Email"        value={data.email} />
            <Row label="Status"       value={data.accountStatus} />
            <Row label="Roles"        value={data.roles?.length ? data.roles.join(", ") : null} />
            <Row label="Member Since" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : null} />
          </Card>

          <Card title="Personal">
            <Row label="First Name"   value={data.p.firstName} />
            <Row label="Last Name"    value={data.p.lastName} />
            <Row label="Gender"       value={data.p.gender || data.org.gender} />
            <Row label="Mobile"       value={data.p.mobileNumber} />
            <Row label="Address"      value={data.p.addressLine1} />
            <Row label="City"         value={data.p.city} />
            <Row label="State"        value={data.p.state} />
            <Row label="Country"      value={data.p.country} />
            <Row label="Postal Code"  value={data.p.postalCode} />
            <Row label="Language"     value={data.p.languagePreference} />
            <Row label="Timezone"     value={data.p.timezone} />
          </Card>

          <Card title="Organisation" className="md:col-span-2">
            <div className="grid grid-cols-2 gap-x-10">
              <Row label="Employee ID"      value={data.org.employeeId} />
              <Row label="Domain"           value={data.org.domainName} />
              <Row label="Department"       value={data.org.department} />
              <Row label="Designation"      value={data.org.designation} />
              <Row label="Assigned Branch"  value={data.org.assignedBranch} />
              <Row label="Assigned Region"  value={data.org.assignedRegion} />
              <Row label="Employment Type"  value={data.org.employmentType} />
              <Row label="Work Shift"       value={data.org.workShift} />
              <Row label="Manager"          value={data.org.managerName} />
              <Row label="Payroll Amount"   value={data.org.payrollAmount != null ? `₹${Number(data.org.payrollAmount).toLocaleString()}` : null} />
            </div>
          </Card>

        </div>
      )}

      {/* ── EDIT MODE ── */}
      {editMode && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
            <div>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.25em]">Edit Personal Profile</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Organisation fields are managed by admin</p>
            </div>
            <button onClick={() => { setEditMode(false); buildForm(data); }}
              className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First Name"           value={form.firstName}          onChange={v => setForm(f => ({ ...f, firstName: v }))} />
            <Field label="Last Name"            value={form.lastName}           onChange={v => setForm(f => ({ ...f, lastName: v }))} />
            <Field label="Mobile Number"        value={form.mobileNumber}       onChange={v => setForm(f => ({ ...f, mobileNumber: v }))} />
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)]">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Field label="Address"              value={form.addressLine1}       onChange={v => setForm(f => ({ ...f, addressLine1: v }))}       className="sm:col-span-2" />
            <Field label="City"                 value={form.city}               onChange={v => setForm(f => ({ ...f, city: v }))} />
            <Field label="State"                value={form.state}              onChange={v => setForm(f => ({ ...f, state: v }))} />
            <Field label="Country"              value={form.country}            onChange={v => setForm(f => ({ ...f, country: v }))} />
            <Field label="Postal Code"          value={form.postalCode}         onChange={v => setForm(f => ({ ...f, postalCode: v }))} />
            <Field label="Language Preference"  value={form.languagePreference} onChange={v => setForm(f => ({ ...f, languagePreference: v }))} />
            <Field label="Timezone"             value={form.timezone}           onChange={v => setForm(f => ({ ...f, timezone: v }))} />
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl tracking-wider transition-all disabled:opacity-50 active:scale-95">
              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => { setEditMode(false); buildForm(data); }}
              className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 rounded-xl transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SUB-COMPONENTS ── */
const Card = ({ title, children, className = "" }) => {
  const rows = React.Children.toArray(children).filter(c => c !== null && c !== false);
  if (!rows.length) return null;
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden ${className}`}>
      <div className="px-4 py-2.5 border-b border-[var(--border-color)] bg-[var(--bg-body)]">
        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.25em]">{title}</p>
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
};

const Row = ({ label, value }) => {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-tight text-right truncate max-w-[200px]">{value}</span>
    </div>
  );
};

const Field = ({ label, value, onChange, className = "" }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <input value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 text-[var(--text-main)] transition-all" />
  </div>
);
