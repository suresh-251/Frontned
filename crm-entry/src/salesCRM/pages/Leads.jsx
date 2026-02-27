// import React, { useEffect, useState } from "react";
// import { Card, Button, Table, Modal, Input } from "../components/common";
// import leadsAPI from "../api/leads.api";
// import { FaUsers, FaPlus, FaEye, FaTimesCircle } from "react-icons/fa";
// import Toast from "../utils/toast";

// const Leads = () => {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [isAddOpen, setIsAddOpen] = useState(false);
//   const [isViewOpen, setIsViewOpen] = useState(false);
//   const [selectedLead, setSelectedLead] = useState(null);

//   const [formData, setFormData] = useState({});

//   // ================= FETCH LEADS =================
//   const fetchLeads = async () => {
//     try {
//       setLoading(true);
//       const data = await leadsAPI.getAll();
//       if (Array.isArray(data)) {
//         setLeads(data);
//       }
//     } catch (err) {
//       Toast.error("Failed to load leads");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, []);

//   // ================= FORMAT DATE =================
//   const formatDate = (date) => {
//     if (!date) return "—";
//     return new Date(date).toLocaleDateString();
//   };

//   // ================= TABLE COLUMNS =================
//   const columns = [
//     {
//       header: "ID",
//       render: (row) => row.id || "—"
//     },
//     {
//       header: "Name",
//       render: (row) => row.name || "—"
//     },
//     {
//       header: "Email",
//       render: (row) => row.email || "—"
//     },
//     {
//       header: "Created At",
//       render: (row) => formatDate(row.createdAt)
//     },
//     {
//       header: "Action",
//       render: (row) => (
//         <Button
//           size="sm"
//           variant="secondary"
//           onClick={() => {
//             setSelectedLead(row);
//             setIsViewOpen(true);
//           }}
//         >
//           <FaEye className="mr-1" />
//           View
//         </Button>
//       )
//     }
//   ];

//   // ================= HANDLE INPUT =================
//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   // ================= CREATE LEAD =================
//   const handleCreate = async () => {
//     try {
//       await leadsAPI.create(formData);
//       Toast.success("Lead created successfully");
//       setIsAddOpen(false);
//       setFormData({});
//       fetchLeads();
//     } catch (err) {
//       Toast.error("Failed to create lead");
//     }
//   };

//   return (
//     <div className="max-w-7xl mx-auto space-y-4 text-sm">

//       {/* HEADER */}
//       <div className="bg-white rounded-xl shadow p-4 border border-purple-100">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center">
//             <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow mr-3">
//               <FaUsers className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-800">
//                 Leads Management
//               </h1>
//               <p className="text-gray-500 text-xs mt-1">
//                 {leads.length} Leads
//               </p>
//             </div>
//           </div>

//           <Button onClick={() => setIsAddOpen(true)} variant="primary">
//             <FaPlus className="mr-2" />
//             Add Lead
//           </Button>
//         </div>
//       </div>

//       {/* TABLE */}
//       <Card className="overflow-auto">
//         <Table
//           columns={columns}
//           data={leads}
//           loading={loading}
//           emptyMessage="No leads found."
//         />
//       </Card>

//       {/* ================= ADD MODAL ================= */}
//       <Modal
//         isOpen={isAddOpen}
//         onClose={() => setIsAddOpen(false)}
//         title="Add New Lead"
//         size="md"
//       >
//         <div className="grid grid-cols-2 gap-4">
//           <Input
//             label="Name"
//             name="name"
//             value={formData.name || ""}
//             onChange={handleChange}
//           />
//           <Input
//             label="Email"
//             name="email"
//             value={formData.email || ""}
//             onChange={handleChange}
//           />
//         </div>

//         <div className="flex justify-end mt-6">
//           <Button variant="success" onClick={handleCreate}>
//             Save Lead
//           </Button>
//         </div>
//       </Modal>

//       {/* ================= VIEW FULL DETAILS ================= */}
//       {isViewOpen && selectedLead && (
//         <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
//           <div className="bg-white w-[750px] max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl p-6">

//             <div className="flex justify-between items-center mb-5">
//               <h2 className="text-lg font-semibold text-gray-800">
//                 Lead Full Details
//               </h2>

//               <Button variant="ghost" onClick={() => setIsViewOpen(false)}>
//                 <FaTimesCircle />
//               </Button>
//             </div>

//             <div className="grid grid-cols-2 gap-4">
//               {Object.entries(selectedLead).map(([key, value]) => (
//                 <div key={key} className="bg-gray-50 p-3 rounded-lg border">
//                   <p className="text-xs text-gray-500 uppercase font-semibold">
//                     {key}
//                   </p>
//                   <p className="text-sm font-medium break-words">
//                     {value === null || value === undefined
//                       ? "—"
//                       : typeof value === "object"
//                       ? JSON.stringify(value)
//                       : value.toString()}
//                   </p>
//                 </div>
//               ))}
//             </div>

//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Leads;









// import React, { useEffect, useState } from "react";
// import { Card, Table, Button, Modal, Input } from "../components/common";
// import leadsAPI from "../api/leads.api";
// import { FaUsers, FaPlus, FaEye, FaTimesCircle } from "react-icons/fa";
// import Toast from "../utils/toast";

// const Leads = () => {
//   const [leads, setLeads] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [isAddOpen, setIsAddOpen] = useState(false);
//   const [isViewOpen, setIsViewOpen] = useState(false);
//   const [selectedLead, setSelectedLead] = useState(null);

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     company: "",
//     source: "",
//     status: "",
//     notes: "",
//   });

//   // ================= FETCH LEADS =================
//   const fetchLeads = async () => {
//     try {
//       setLoading(true);
//       const data = await leadsAPI.getAll();
//       if (Array.isArray(data)) setLeads(data);
//     } catch (err) {
//       Toast.error("Failed to load leads");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLeads();
//   }, []);

//   // ================= FORMAT DATE =================
//   const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

//   // ================= TABLE COLUMNS =================
//   const columns = [
//     { header: "ID", render: (row) => row.id || "—" },
//     { header: "Name", render: (row) => row.name || "—" },
//     { header: "Created At", render: (row) => formatDate(row.createdAt) },
//     {
//       header: "Action",
//       render: (row) => (
//         <Button
//           size="sm"
//           variant="secondary"
//           onClick={() => {
//             setSelectedLead(row);
//             setIsViewOpen(true);
//           }}
//         >
//           <FaEye className="mr-1" />
//           View
//         </Button>
//       ),
//     },
//   ];

//   // ================= HANDLE INPUT =================
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   // ================= CREATE LEAD =================
//   const handleCreate = async () => {
//     if (!formData.name) {
//       Toast.error("Name is required");
//       return;
//     }
//     try {
//       await leadsAPI.create(formData);
//       Toast.success("Lead created successfully");
//       setIsAddOpen(false);
//       setFormData({
//         name: "",
//         email: "",
//         phone: "",
//         company: "",
//         source: "",
//         status: "",
//         notes: "",
//       });
//       fetchLeads();
//     } catch (err) {
//       console.error(err);
//       Toast.error("Failed to create lead");
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto space-y-4 text-sm">

//       {/* ================= HEADER ================= */}
//       <div className="bg-white rounded-lg shadow p-4 border border-gray-200 flex justify-between items-center">
//         <div className="flex items-center gap-3">
//           <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow">
//             <FaUsers className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <h1 className="text-xl font-bold text-gray-800">Leads Management</h1>
//             <p className="text-gray-500 text-xs mt-1">{leads.length} Leads</p>
//           </div>
//         </div>

//         <Button
//           onClick={() => setIsAddOpen(true)}
//           variant="primary"
//           className="flex items-center gap-1 text-sm"
//         >
//           <FaPlus /> Add Lead
//         </Button>
//       </div>

//       {/* ================= TABLE ================= */}
//       <Card className="overflow-auto rounded-lg shadow border bg-white p-2">
//         <Table columns={columns} data={leads} loading={loading} emptyMessage="No leads found." />
//       </Card>

//       {/* ================= ADD LEAD MODAL ================= */}
//       <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Lead" size="md">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <Input label="Name" name="name" value={formData.name} onChange={handleChange} required />
//           <Input label="Email" name="email" value={formData.email} onChange={handleChange} />
//           <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
//           <Input label="Company" name="company" value={formData.company} onChange={handleChange} />
//           <Input label="Source" name="source" value={formData.source} onChange={handleChange} />
//           <Input label="Status" name="status" value={formData.status} onChange={handleChange} />
//           <Input label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
//         </div>

//         <div className="flex justify-end mt-4">
//           <Button variant="success" onClick={handleCreate}>Save Lead</Button>
//         </div>
//       </Modal>

//       {/* ================= VIEW LEAD MODAL ================= */}
//       {isViewOpen && selectedLead && (
//         <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
//           <div className="bg-white w-[650px] max-h-[80vh] overflow-y-auto rounded-lg shadow-2xl p-5">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold text-gray-800">Lead Details</h2>
//               <Button variant="ghost" onClick={() => setIsViewOpen(false)}>
//                 <FaTimesCircle />
//               </Button>
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               {Object.entries(selectedLead).map(([key, value]) => (
//                 <div key={key} className="bg-gray-50 p-2 rounded-lg border">
//                   <p className="text-xs text-gray-500 uppercase font-semibold">{key}</p>
//                   <p className="text-sm font-medium break-words">{value || "—"}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Leads;



// src/pages/Leads.jsx
import React, { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Input } from "../components/common";
import leadsAPI from "../api/leads.api";
import { getLeads as getSocialLeads } from "../../socialCRM/api/facebook.leads.api";
import * as jwtDecode from "jwt-decode";
import Toast from "../utils/toast";
import { FaUsers, FaPlus, FaEye, FaTimesCircle, FaTrash } from "react-icons/fa";

const Leads = () => {
  const [salesLeads, setSalesLeads] = useState([]);
  const [socialLeads, setSocialLeads] = useState([]);
  const [activeType, setActiveType] = useState("sales"); // "sales" or "social"
  const [loading, setLoading] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [formData, setFormData] = useState({});

  // ================= Extract User ID from JWT =================
  const getUserIdFromToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const decoded = jwtDecode.default(token);
      return decoded.userId || decoded.sub;
    } catch {
      return null;
    }
  };

  // ================= Fetch Sales Leads =================
  const fetchSalesLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsAPI.getAll();
      setSalesLeads(Array.isArray(data) ? data : []);
    } catch {
      Toast.error("Failed to load sales leads");
    } finally {
      setLoading(false);
    }
  };

  // ================= Fetch Social Leads =================
  const fetchSocialLeads = async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) return;

      const data = await getSocialLeads({ assignedToUserId: userId });
      setSocialLeads(Array.isArray(data) ? data : []);
    } catch {
      Toast.error("Failed to load social leads");
    }
  };

  useEffect(() => {
    fetchSalesLeads();
    fetchSocialLeads();
  }, []);

  // ================= Handle Input Change =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= Create New Lead =================
  const handleCreate = async () => {
    try {
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
      };
      await leadsAPI.create(payload);
      Toast.success("Lead created successfully");
      setIsAddOpen(false);
      setFormData({});
      fetchSalesLeads();
    } catch {
      Toast.error("Failed to create lead");
    }
  };

  // ================= Delete Lead =================
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this lead?")) return;
    try {
      await leadsAPI.delete(id);
      Toast.success("Lead deleted");
      fetchSalesLeads();
    } catch {
      Toast.error("Failed to delete lead");
    }
  };

  // ================= Format Date =================
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "—");

  // ================= Table Columns =================
  const columns = [
    { header: "ID", render: (row) => row.id || "—" },
    { header: "Name", render: (row) => row.name || "—" },
    { header: "Created At", render: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setSelectedLead(row);
              setIsViewOpen(true);
            }}
          >
            <FaEye />
          </Button>
          {activeType === "sales" && (
            <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
              <FaTrash />
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ================= All Lead Fields for Add Modal =================
  const leadFields = [
    { name: "name", label: "Name", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "company", label: "Company", type: "text" },
    { name: "source", label: "Source", type: "text" },
    { name: "status", label: "Status", type: "number" },
    { name: "lostReason", label: "Lost Reason", type: "text" },
    { name: "assignedToUserId", label: "Assigned User ID", type: "number" },
    { name: "isConverted", label: "Is Converted", type: "checkbox" },
    { name: "score", label: "Score", type: "number" },
    { name: "firstResponseAt", label: "First Response At", type: "datetime-local" },
    { name: "slaHours", label: "SLA Hours", type: "number" },
    { name: "isSlaBreached", label: "Is SLA Breached", type: "checkbox" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 text-sm p-4">

      {/* ================= Header ================= */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow">
            <FaUsers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Leads Management</h1>
            <p className="text-gray-500 text-xs mt-1">
              {activeType === "sales" ? salesLeads.length : socialLeads.length} Leads
            </p>
          </div>
        </div>
        {activeType === "sales" && (
          <Button onClick={() => setIsAddOpen(true)} variant="primary">
            <FaPlus className="mr-2" />
            Add Lead
            Add Lead
          </Button>
        )}
      </div>

      {/* ================= Lead Type Cards ================= */}
      <div className="flex gap-4">
        <Card
          className={`cursor-pointer p-3 flex-1 text-center ${
            activeType === "sales"
              ? "bg-purple-100 border-purple-400"
              : "bg-white hover:shadow-md"
          }`}
          onClick={() => setActiveType("sales")}
        >
          Sales Leads
        </Card>
        <Card
          className={`cursor-pointer p-3 flex-1 text-center ${
            activeType === "social"
              ? "bg-blue-100 border-blue-400"
              : "bg-white hover:shadow-md"
          }`}
          onClick={() => setActiveType("social")}
        >
          Social Assigned Leads
        </Card>
      </div>

      {/* ================= Leads Table ================= */}
      <Card className="overflow-auto">
        <Table
          columns={columns}
          data={activeType === "sales" ? salesLeads : socialLeads}
          loading={loading}
          emptyMessage="No leads found."
        />
      </Card>

      {/* ================= Add Lead Modal ================= */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Lead" size="lg">
        <div className="grid grid-cols-2 gap-4">
          {leadFields.map((field) => (
            <div key={field.name}>
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={formData[field.name] || false}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.name]: e.target.checked })
                    }
                  />
                  {field.label}
                </label>
              ) : (
                <Input
                  label={field.label}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="success" onClick={handleCreate}>
            Save Lead
          </Button>
        </div>
      </Modal>

      {/* ================= View Lead Modal ================= */}
      {isViewOpen && selectedLead && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center">
          <div className="bg-white w-[750px] max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">Lead Details</h2>
              <Button variant="ghost" onClick={() => setIsViewOpen(false)}>
                <FaTimesCircle />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(selectedLead).map(([key, value]) => (
                <div key={key} className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-500 uppercase font-semibold">{key}</p>
                  <p className="text-sm font-medium break-words">
                    {value === null || value === undefined
                      ? "—"
                      : typeof value === "object"
                      ? JSON.stringify(value)
                      : value.toString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;