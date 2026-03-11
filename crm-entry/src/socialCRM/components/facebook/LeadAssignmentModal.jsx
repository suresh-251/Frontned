// LeadAssignmentModal.jsx
// Modal for managing per-lead department and user assignments.

import { useState, useEffect, useCallback } from "react";
import {
  FaTimesCircle, FaUsers, FaUserPlus, FaBuilding, FaTrash,
  FaSpinner, FaPlus, FaCheck,
} from "react-icons/fa";

// ─── Modal Shell ─────────────────────────────────────────────────────────────
const ModalShell = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimesCircle className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ label, onRemove, color = "indigo" }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-0.5"
          title="Remove"
        >
          <FaTimesCircle className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

// ─── Multi-select Pill Picker ─────────────────────────────────────────────────
const MultiPicker = ({ items, selectedIds, onToggle, idKey, labelKey, placeholder }) => {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) =>
    (i[labelKey] || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="p-2 border-b border-gray-100">
        <input
          type="text"
          placeholder={placeholder || "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>
      <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No results</p>
        )}
        {filtered.map((item) => {
          const id = item[idKey];
          const selected = selectedIds.includes(String(id));
          return (
            <button
              key={id}
              onClick={() => onToggle(String(id), item[labelKey])}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                ${selected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
            >
              <span
                className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors
                  ${selected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}
              >
                {selected && <FaCheck className="w-2.5 h-2.5 text-white" />}
              </span>
              {item[labelKey]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab({ lead, departments, onAssign, onRemove }) {
  const [assigned, setAssigned] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedNames, setSelectedNames] = useState({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const refresh = useCallback(async () => {
    setLoadingAssigned(true);
    try {
      const data = await onAssign.fetchDepts(lead.id);
      setAssigned(data);
    } catch {
      setAssigned([]);
    } finally {
      setLoadingAssigned(false);
    }
  }, [lead.id, onAssign]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const assignedIds = assigned.map((d) => String(d.departmentId || d.id));
  const availableToAdd = departments.filter(
    (d) => !assignedIds.includes(String(d.departmentId))
  );

  const toggleSelect = (id, name) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSelectedNames((prev) => ({ ...prev, [id]: name }));
  };

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    try {
      const depts = selectedIds.map((id) => ({
        departmentId: id,
        departmentName: selectedNames[id] || "",
      }));
      await onAssign.addDepts(lead.id, depts);
      setSelectedIds([]);
      setSelectedNames({});
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (deptId) => {
    setRemoving(deptId);
    try {
      await onRemove(lead.id, deptId);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Currently assigned */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Assigned Departments
        </h3>
        {loadingAssigned ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
            <FaSpinner className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : assigned.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No departments assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigned.map((d) => {
              const id = String(d.departmentId || d.id);
              return (
                <div key={id} className="flex flex-col items-start">
                  <Badge
                    label={d.departmentName || d.name || id}
                    color="indigo"
                    onRemove={() => handleRemove(id)}
                  />
                  {d.assignedAt && (
                    <span className="text-[9px] text-gray-400 mt-0.5 pl-1">
                      Since {new Date(d.assignedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new departments */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Add Departments
        </h3>
        {availableToAdd.length === 0 ? (
          <p className="text-xs text-gray-400 italic">All departments already assigned.</p>
        ) : (
          <>
            <MultiPicker
              items={availableToAdd}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
              idKey="departmentId"
              labelKey="departmentName"
              placeholder="Search departments…"
            />
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  {selectedIds.length} department(s) selected
                </p>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-all active:scale-95"
                >
                  {saving ? (
                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FaPlus className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving…" : "Assign Selected"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ lead, allUsers, onAssign, onRemove }) {
  const [assigned, setAssigned] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);

  const refresh = useCallback(async () => {
    setLoadingAssigned(true);
    try {
      const data = await onAssign.fetchUsers(lead.id);
      setAssigned(data);
    } catch {
      setAssigned([]);
    } finally {
      setLoadingAssigned(false);
    }
  }, [lead.id, onAssign]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const assignedIds = assigned.map((u) => String(u.userId || u.id));
  const availableToAdd = allUsers.filter(
    (u) => !assignedIds.includes(String(u.userId))
  );

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    try {
      await onAssign.addUsers(lead.id, selectedIds.map(Number));
      setSelectedIds([]);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemoving(userId);
    try {
      await onRemove(lead.id, userId);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Currently assigned */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Assigned Users
        </h3>
        {loadingAssigned ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
            <FaSpinner className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : assigned.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No users assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assigned.map((u) => {
              const id = String(u.userId || u.id);
              return (
                <div key={id} className="flex flex-col items-start">
                  <Badge
                    label={u.name || u.userName || id}
                    color="purple"
                    onRemove={() => handleRemove(id)}
                  />
                  {u.assignedAt && (
                    <span className="text-[9px] text-gray-400 mt-0.5 pl-1">
                      Since {new Date(u.assignedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new users */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Add Users
        </h3>
        {availableToAdd.length === 0 ? (
          <p className="text-xs text-gray-400 italic">All users already assigned.</p>
        ) : (
          <>
            <MultiPicker
              items={availableToAdd}
              selectedIds={selectedIds}
              onToggle={(id) => toggleSelect(id)}
              idKey="userId"
              labelKey="name"
              placeholder="Search users…"
            />
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-gray-500">
                  {selectedIds.length} user(s) selected
                </p>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-all active:scale-95"
                >
                  {saving ? (
                    <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FaUserPlus className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving…" : "Assign Selected"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
/**
 * Modal for managing departments & users for a single lead.
 *
 * Props:
 *   lead          – the lead object (must have .id, .name)
 *   departments   – full list of department objects { departmentId, departmentName }
 *   users         – full list of user objects { userId, name }
 *   onClose       – close handler
 *   hookHandlers  – object with:
 *     getLeadDepartments(leadId)
 *     assignLeadDepartments(leadId, depts)
 *     removeLeadDepartment(leadId, deptId)
 *     getLeadUsers(leadId)
 *     assignLeadUsers(leadId, userIds)
 *     removeLeadUser(leadId, userId)
 */
export default function LeadAssignmentModal({
  lead,
  departments,
  users,
  onClose,
  hookHandlers,
}) {
  const [activeTab, setActiveTab] = useState("departments");

  if (!lead) return null;

  const assignHandlers = {
    fetchDepts: hookHandlers.getLeadDepartments,
    addDepts: hookHandlers.assignLeadDepartments,
    fetchUsers: hookHandlers.getLeadUsers,
    addUsers: hookHandlers.assignLeadUsers,
  };

  const tabs = [
    { id: "departments", label: "Departments", icon: FaBuilding },
    { id: "users", label: "Users", icon: FaUsers },
  ];

  return (
    <ModalShell
      isOpen={!!lead}
      onClose={onClose}
      title={`Assign — ${lead.name || `Lead #${lead.id}`}`}
    >
      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === id
                ? "bg-white shadow-sm text-indigo-700"
                : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "departments" ? (
        <DepartmentsTab
          lead={lead}
          departments={departments}
          onAssign={assignHandlers}
          onRemove={hookHandlers.removeLeadDepartment}
        />
      ) : (
        <UsersTab
          lead={lead}
          allUsers={users}
          onAssign={assignHandlers}
          onRemove={hookHandlers.removeLeadUser}
        />
      )}
    </ModalShell>
  );
}
