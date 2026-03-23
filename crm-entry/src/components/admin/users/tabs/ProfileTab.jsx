import { useEffect, useMemo, useState } from "react";
import {
  updateUserProfile,
  assignManager,
  getManagers,
} from "../../../../api/users/users.api";

export default function ProfileTab({ user, onUpdated }) {
  const [editMode, setEditMode] = useState(false);

  /* =======================
     PROFILE FORM STATE (only PATCH-allowed fields)
     ======================= */
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    mobileNumber: "",
    addressLine1: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    languagePreference: "",
    timezone: "",
  });

  /* =======================
     MANAGER STATE
     ======================= */
  const [managers, setManagers] = useState([]);
  const [managerSearch, setManagerSearch] = useState("");
  const [managerDomain, setManagerDomain] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);

  const currentManagerName = user?.organization?.managerName || "";

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  /* =======================
     PREFILL EXISTING DATA
     ======================= */
  useEffect(() => {
    if (!user) return;
    setForm({
      firstName:          user.profile?.firstName          ?? "",
      lastName:           user.profile?.lastName           ?? "",
      gender:             user.profile?.gender             ?? "",
      mobileNumber:       user.profile?.mobileNumber       ?? "",
      addressLine1:       user.profile?.addressLine1       ?? "",
      city:               user.profile?.city               ?? "",
      state:              user.profile?.state              ?? "",
      country:            user.profile?.country            ?? "",
      postalCode:         user.profile?.postalCode         ?? "",
      languagePreference: user.profile?.languagePreference ?? "",
      timezone:           user.profile?.timezone           ?? "",
    });
  }, [user]);

  /* =======================
     LOAD MANAGERS (ONCE)
     ======================= */
  useEffect(() => {
    getManagers()
      .then((data) => setManagers(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load managers", err));
  }, []);

  /* =======================
     FILTER MANAGERS
     ======================= */
  const filteredManagers = useMemo(() => {
    return managers.filter((m) => {
      const matchesDomain = !managerDomain || m.domainCode === managerDomain;
      const matchesSearch =
        !managerSearch ||
        m.name.toLowerCase().includes(managerSearch.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [managers, managerDomain, managerSearch]);

  /* =======================
     HANDLERS
     ======================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await updateUserProfile(user.userId, {
        firstName:          form.firstName,
        lastName:           form.lastName,
        gender:             form.gender,
        mobileNumber:       form.mobileNumber,
        addressLine1:       form.addressLine1,
        city:               form.city,
        state:              form.state,
        country:            form.country,
        postalCode:         form.postalCode,
        languagePreference: form.languagePreference,
        timezone:           form.timezone,
      });

      if (selectedManager && selectedManager.name !== currentManagerName) {
        await assignManager(user.userId, selectedManager.userId);
      }

      setSuccess(true);
      setEditMode(false);
      onUpdated?.();
    } catch (err) {
      console.error("Profile update failed", err);
      setError("Failed to save user details");
    } finally {
      setSaving(false);
    }
  };

  /* =======================
     VIEW MODE — full detail
     ======================= */
  if (!editMode) {
    return (
      <div className="space-y-5 max-w-3xl text-sm">
        {/* IDENTITY */}
        <Section title="Identity">
          <Row label="User ID"        value={user?.userId} />
          <Row label="Username"       value={user?.username} />
          <Row label="Email"          value={user?.email} />
          <Row label="Account Status" value={user?.accountStatus} />
          <Row label="Member Since"   value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null} />
          <Row label="Last Activity"  value={user?.lastActivityAt ? new Date(user.lastActivityAt).toLocaleString() : "Never"} />
          <Row label="Roles"          value={user?.roles?.join(", ")} />
        </Section>

        {/* PERSONAL */}
        <Section title="Personal">
          <Row label="First Name"  value={user?.profile?.firstName} />
          <Row label="Last Name"   value={user?.profile?.lastName} />
          <Row label="Gender"      value={user?.profile?.gender || user?.organization?.gender} />
          <Row label="Mobile"      value={user?.profile?.mobileNumber} />
          <Row label="Address"     value={user?.profile?.addressLine1} />
          <Row label="City"        value={user?.profile?.city} />
          <Row label="State"       value={user?.profile?.state} />
          <Row label="Country"     value={user?.profile?.country} />
          <Row label="Postal Code" value={user?.profile?.postalCode} />
          <Row label="Language"    value={user?.profile?.languagePreference} />
          <Row label="Timezone"    value={user?.profile?.timezone} />
        </Section>

        {/* ORGANISATION */}
        <Section title="Organisation">
          <Row label="Employee ID"      value={user?.organization?.employeeId} />
          <Row label="Domain"           value={user?.organization?.domainName} />
          <Row label="Department"       value={user?.organization?.department} />
          <Row label="Designation"      value={user?.organization?.designation} />
          <Row label="Employment Type"  value={user?.organization?.employmentType} />
          <Row label="Assigned Branch"  value={user?.organization?.assignedBranch} />
          <Row label="Assigned Region"  value={user?.organization?.assignedRegion} />
          <Row label="Work Shift"       value={user?.organization?.workShift} />
          <Row label="Manager"          value={user?.organization?.managerName} />
          <Row label="Payroll Amount"   value={user?.organization?.payrollAmount != null ? `₹${user.organization.payrollAmount.toLocaleString()}` : null} />
          <Row label="Remarks"          value={user?.organization?.remarks} />
          <Row label="Access Start"     value={user?.organization?.accessStartDate ? new Date(user.organization.accessStartDate).toLocaleDateString() : null} />
          <Row label="Access End"       value={user?.organization?.accessEndDate   ? new Date(user.organization.accessEndDate).toLocaleDateString()   : null} />
        </Section>

        <button
          onClick={() => setEditMode(true)}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  /* =======================
     EDIT MODE
     ======================= */
  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Changes saved successfully
        </div>
      )}

      <p className="text-xs text-slate-500">
        Only personal profile fields can be updated here. Organisation details are managed separately.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <input name="firstName"    value={form.firstName}    onChange={handleChange} placeholder="First Name"    className="border rounded px-3 py-2 text-sm" />
        <input name="lastName"     value={form.lastName}     onChange={handleChange} placeholder="Last Name"     className="border rounded px-3 py-2 text-sm" />
        <select name="gender" value={form.gender} onChange={handleChange} className="border rounded px-3 py-2 text-sm">
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <input name="mobileNumber" value={form.mobileNumber} onChange={handleChange} placeholder="Mobile Number" className="border rounded px-3 py-2 text-sm" />
        <input name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Address Line 1" className="border rounded px-3 py-2 text-sm col-span-2" />
        <input name="city"         value={form.city}         onChange={handleChange} placeholder="City"           className="border rounded px-3 py-2 text-sm" />
        <input name="state"        value={form.state}        onChange={handleChange} placeholder="State"          className="border rounded px-3 py-2 text-sm" />
        <input name="country"      value={form.country}      onChange={handleChange} placeholder="Country"        className="border rounded px-3 py-2 text-sm" />
        <input name="postalCode"   value={form.postalCode}   onChange={handleChange} placeholder="Postal Code"   className="border rounded px-3 py-2 text-sm" />
        <input name="languagePreference" value={form.languagePreference} onChange={handleChange} placeholder="Language Preference" className="border rounded px-3 py-2 text-sm" />
        <input name="timezone"     value={form.timezone}     onChange={handleChange} placeholder="Timezone"       className="border rounded px-3 py-2 text-sm" />
      </div>

      {/* CURRENT MANAGER */}
      <div className="border rounded px-3 py-2 bg-slate-50 text-sm">
        <div className="text-xs text-slate-500">Current Manager</div>
        <div className="font-medium text-slate-800">{currentManagerName || "Not assigned"}</div>
      </div>

      {/* CHANGE MANAGER */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <select value={managerDomain} onChange={(e) => setManagerDomain(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All Domains</option>
            <option value="HR">HR</option>
            <option value="SALES">Sales</option>
            <option value="SOCIALMEDIA">Social</option>
          </select>
          <input type="text" placeholder="Search manager" value={managerSearch} onChange={(e) => setManagerSearch(e.target.value)} className="border rounded px-3 py-1 text-sm flex-1" />
        </div>
        <div className="border rounded max-h-40 overflow-y-auto">
          {filteredManagers.map((m) => (
            <div
              key={m.userId}
              onClick={() => setSelectedManager(m)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 ${selectedManager?.userId === m.userId ? "bg-blue-50" : ""}`}
            >
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-slate-500">{m.domainCode}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50">
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button onClick={() => { setEditMode(false); setError(null); }} className="px-5 py-2 bg-slate-100 text-slate-700 text-sm rounded hover:bg-slate-200">
          Cancel
        </button>
      </div>
    </div>
  );
}

/* =======================
   SUB-COMPONENTS
   ======================= */
const Section = ({ title, children }) => (
  <div className="border border-slate-200 rounded-lg overflow-hidden">
    <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center px-4 py-2 gap-4">
    <span className="text-xs text-slate-400 w-36 shrink-0">{label}</span>
    <span className="text-xs font-medium text-slate-700">{value || "—"}</span>
  </div>
);
