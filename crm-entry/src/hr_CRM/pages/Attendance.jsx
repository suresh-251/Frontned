// import { useEffect, useState } from "react";
// import { getAdminUsers } from "../../api/admin/users.api";
// import {
//   checkIn,
//   checkOut,
//   getTotalHours,
//   getAttendanceHistory,
//   updateAttendanceStatus,
// } from "../api/api.attendance";

// export default function Attendance() {
//   const [employees, setEmployees] = useState([]);
//   const [attendanceMap, setAttendanceMap] = useState({});
//   const [historyData, setHistoryData] = useState([]);
//   const [selectedUserId, setSelectedUserId] = useState(null);
//   const [showModal, setShowModal] = useState(false);

//   /* ===== Format TimeSpan ===== */
//   const formatTime = (time) => {
//     if (!time) return "-";
//     return time.split(".")[0];
//   };

//   const formatTotal = (time) => {
//     if (!time) return "0 hrs";
//     const [h, m] = time.split(":");
//     return `${parseInt(h)} hrs ${parseInt(m)} mins`;
//   };

//   /* ===== Load Employees ===== */
//   useEffect(() => {
//     const load = async () => {
//       const res = await getAdminUsers({ page: 1, pageSize: 50 });
//       setEmployees(res?.users ?? []);
//     };
//     load();
//   }, []);

//   /* ===== Load Attendance ===== */
//   useEffect(() => {
//     if (!employees.length) return;

//     const loadAttendance = async () => {
//       const map = {};

//       for (let emp of employees) {
//         try {
//           const res = await getTotalHours(emp.userId);
//           map[emp.userId] = res.data;
//         } catch (err) {
//           map[emp.userId] = null;
//         }
//       }

//       setAttendanceMap(map);
//     };

//     loadAttendance();
//   }, [employees]);

//   /* ===== Check In ===== */
// const handleCheckIn = async (userId) => {
//   try {
//     await checkIn(userId);

//     // ✅ Update status instantly in table
//     setAttendanceMap((prev) => ({
//       ...prev,
//       [userId]: {
//         ...prev[userId],
//         status: "Present",
//       },
//     }));

//     alert("Checked In");
//   } catch (err) {
//     alert(err.response?.data || "Error");
//   }
// };
//   /* ===== Check Out ===== */
//   /* ===== Check Out ===== */
// const handleCheckOut = async (userId) => {
//   try {
//     await checkOut(userId);

//     // ✅ Keep status as Present after checkout
//     setAttendanceMap((prev) => ({
//       ...prev,
//       [userId]: {
//         ...prev[userId],
//         status: "Present",
//       },
//     }));

//     alert("Checked Out");
//   } catch (err) {
//     alert(err.response?.data || "Error");
//   }
// };
//   /* ===== View History ===== */
//   const handleViewHistory = async (userId) => {
//     try {
//       const res = await getAttendanceHistory(userId);
//       setHistoryData(res.data);
//       setSelectedUserId(userId);
//       setShowModal(true);
//     } catch {
//       alert("No history found");
//     }
//   };

//   /* ===== Change Status ===== */
//   const handleStatusChange = async (attendanceId, status) => {
//     try {
//       await updateAttendanceStatus(selectedUserId, status);
//       alert("Status Updated");

//       const res = await getAttendanceHistory(selectedUserId);
//       setHistoryData(res.data);
//     } catch {
//       alert("Status update failed");
//     }
//   };

//   return (
//     <div className="h-full overflow-y-auto p-4">

//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
//             Attendance Management
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Manage employee attendance records
//           </p>
//         </div>
//       </div>

//       {/* TABLE */}
//       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//         <div className="max-h-[420px] overflow-y-auto">

//           <table className="w-full text-xs">

//             <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white uppercase tracking-wide sticky top-0">
//               <tr>
//                 <th className="px-4 py-3 text-left">ID</th>
//                 <th className="px-4 py-3 text-left">Name</th>
//                 <th className="px-4 py-3 text-left">Email</th>
//                 <th className="px-4 py-3 text-left">Total</th>
//                 <th className="px-4 py-3 text-left">Status</th>
//                 <th className="px-4 py-3 text-center">Actions</th>
//                 <th className="px-4 py-3 text-center">History</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-100">
//               {employees.map((emp, index) => {
//                 const record = attendanceMap[emp.userId];

//                 return (
//                   <tr
//                     key={emp.userId}
//                     className={`hover:bg-indigo-50 transition ${
//                       index % 2 === 0 ? "bg-gray-50" : "bg-white"
//                     }`}
//                   >
//                     <td className="px-4 py-3 text-gray-500">
//                       {emp.userId}
//                     </td>

//                     <td className="px-4 py-3 font-medium text-gray-800">
//                       {emp.name || emp.username}
//                     </td>

//                     <td className="px-4 py-3 text-gray-600">
//                       {emp.email}
//                     </td>

//                     <td className="px-4 py-3 text-gray-600">
//                       {formatTotal(record?.totalHours)}
//                     </td>

//                     {/* STATUS */}
//                     <td className="px-4 py-3">
//                       <span
//                         className={`px-2 py-1 rounded-full text-[10px] font-medium ${
//                           record?.status === "Present"
//                             ? "bg-green-100 text-green-600"
//                             : record?.status === "Absent"
//                             ? "bg-red-100 text-red-600"
//                             : record?.status === "Leave"
//                             ? "bg-yellow-100 text-yellow-600"
//                             : "bg-gray-100 text-gray-500"
//                         }`}
//                       >
//                         {record?.status || "N/A"}
//                       </span>
//                     </td>

//                     {/* ACTIONS */}
//                     <td className="px-4 py-3 text-center">
//                       <div className="flex justify-center gap-2">
//                         <button
//                           onClick={() => handleCheckIn(emp.userId)}
//                           className="bg-green-600 text-white px-3 py-1 rounded-md text-[11px] hover:opacity-90"
//                         >
//                           In
//                         </button>

//                         <button
//                           onClick={() => handleCheckOut(emp.userId)}
//                           className="bg-red-600 text-white px-3 py-1 rounded-md text-[11px] hover:opacity-90"
//                         >
//                           Out
//                         </button>
//                       </div>
//                     </td>

//                     <td className="px-4 py-3 text-center">
//                       <button
//                         onClick={() => handleViewHistory(emp.userId)}
//                         className="bg-indigo-600 text-white px-3 py-1 rounded-md text-[11px] hover:opacity-90"
//                       >
//                         View
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}

//               {employees.length === 0 && (
//                 <tr>
//                   <td colSpan={7} className="text-center py-8 text-gray-400">
//                     No employees found
//                   </td>
//                 </tr>
//               )}
//             </tbody>

//           </table>
//         </div>
//       </div>

//       {/* MODAL */}
//       {showModal && (
//         <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">

//           <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">

//             <h3 className="text-lg font-semibold mb-4 text-indigo-700">
//               Attendance History
//             </h3>

//             <div className="max-h-[400px] overflow-y-auto">
//               <table className="w-full text-xs">
//                 <thead className="bg-gray-100 text-gray-700 uppercase">
//                   <tr>
//                     <th className="px-4 py-3 text-left">Date</th>
//                     <th className="px-4 py-3 text-left">Check-In</th>
//                     <th className="px-4 py-3 text-left">Check-Out</th>
//                     <th className="px-4 py-3 text-left">Total</th>
//                     <th className="px-4 py-3 text-left">Status</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-gray-100">
//                   {historyData.map((item, index) => (
//                     <tr key={item.attendanceId}>
//                       <td className="px-4 py-3">
//                         {new Date(item.attendanceDate).toLocaleDateString()}
//                       </td>
//                       <td className="px-4 py-3">
//                         {formatTime(item.checkInTime)}
//                       </td>
//                       <td className="px-4 py-3">
//                         {formatTime(item.checkOutTime)}
//                       </td>
//                       <td className="px-4 py-3">
//                         {formatTotal(item.totalHours)}
//                       </td>
//                       <td className="px-4 py-3">
//                         <select
//                           value={item.status}
//                           onChange={(e) =>
//                             handleStatusChange(
//                               item.attendanceId,
//                               e.target.value
//                             )
//                           }
//                           className="border rounded-md px-2 py-1 text-xs"
//                         >
//                           <option value="Present">Present</option>
//                           <option value="Absent">Absent</option>
//                           <option value="Leave">Leave</option>
//                         </select>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="flex justify-end mt-4">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="bg-red-600 text-white px-4 py-1.5 rounded-md text-xs hover:opacity-90"
//               >
//                 Close
//               </button>
//             </div>

//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

















import { useEffect, useState } from "react";
import { getAdminUsers } from "../../api/admin/users.api";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  updateAttendanceStatus,
} from "../api/api.attendance";

export default function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [historyData, setHistoryData] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  /* ================= LOAD EMPLOYEES ================= */
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await getAdminUsers({ page: 1, pageSize: 50 });
        setEmployees(res?.users ?? []);
      } catch {
        setEmployees([]);
      }
    };
    loadEmployees();
  }, []);

  /* ================= LOAD MAIN TABLE STATUS ================= */
  useEffect(() => {
    if (!employees.length) return;

    const loadAttendanceStatus = async () => {
      const map = {};

      await Promise.all(
        employees.map(async (emp) => {
          try {
            const res = await getAttendanceHistory(emp.userId);
            const history = res.data || [];

            if (history.length > 0) {
              const latest = history.reduce((prev, current) =>
                new Date(current.attendanceDate) >
                new Date(prev.attendanceDate)
                  ? current
                  : prev
              );

              map[emp.userId] = {
                status: latest.status,
              };
            } else {
              map[emp.userId] = { status: "Absent" };
            }
          } catch {
            map[emp.userId] = { status: "Absent" };
          }
        })
      );

      setAttendanceMap(map);
    };

    loadAttendanceStatus();
  }, [employees]);

  /* ================= CHECK IN ================= */
  const handleCheckIn = async (userId) => {
    try {
      await checkIn(userId);

      setAttendanceMap((prev) => ({
        ...prev,
        [userId]: { status: "Present" },
      }));

      alert("Checked In");
    } catch (err) {
      alert(err.response?.data || "Error");
    }
  };

  /* ================= CHECK OUT ================= */
  const handleCheckOut = async (userId) => {
    try {
      await checkOut(userId);

      setAttendanceMap((prev) => ({
        ...prev,
        [userId]: { status: "Present" },
      }));

      alert("Checked Out");
    } catch (err) {
      alert(err.response?.data || "Error");
    }
  };

  /* ================= VIEW HISTORY ================= */
  const handleViewHistory = async (userId) => {
    try {
      const res = await getAttendanceHistory(userId);
      setHistoryData(res.data || []);
      setSelectedUserId(userId);
      setShowModal(true);
    } catch {
      alert("No history found");
    }
  };

  /* ================= UPDATE STATUS ================= */
  const handleStatusChange = async (status) => {
    try {
      // send correct userId
      await updateAttendanceStatus(selectedUserId, status);

      // reload history
      const res = await getAttendanceHistory(selectedUserId);
      const updatedHistory = res.data || [];
      setHistoryData(updatedHistory);

      // update main table with latest status
      if (updatedHistory.length > 0) {
        const latest = updatedHistory.reduce((prev, current) =>
          new Date(current.attendanceDate) >
          new Date(prev.attendanceDate)
            ? current
            : prev
        );

        setAttendanceMap((prev) => ({
          ...prev,
          [selectedUserId]: {
            status: latest.status,
          },
        }));
      }

      alert("Status Updated");
    } catch (err) {
      console.log(err);
      alert("Status update failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Attendance Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee attendance records
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white uppercase tracking-wide sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
                <th className="px-4 py-3 text-center">History</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {employees.map((emp, index) => {
                const record = attendanceMap[emp.userId];

                return (
                  <tr
                    key={emp.userId}
                    className={`hover:bg-indigo-50 transition ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-500">
                      {emp.userId}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-800">
                      {emp.name || emp.username}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {emp.email}
                    </td>

                    {/* VIEW ONLY STATUS */}
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                          record?.status === "Present"
                            ? "bg-green-100 text-green-700"
                            : record?.status === "Leave"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {record?.status || "Absent"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleCheckIn(emp.userId)}
                          className="bg-green-600 text-white px-3 py-1 rounded-md text-[11px]"
                        >
                          In
                        </button>

                        <button
                          onClick={() => handleCheckOut(emp.userId)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md text-[11px]"
                        >
                          Out
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewHistory(emp.userId)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-md text-[11px]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">

            <h3 className="text-lg font-semibold mb-4 text-indigo-700">
              Attendance History
            </h3>

            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Check-In</th>
                    <th className="px-4 py-3 text-left">Check-Out</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {historyData.map((item) => (
                    <tr key={item.attendanceId}>
                      <td className="px-4 py-3">
                        {new Date(item.attendanceDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{item.checkInTime}</td>
                      <td className="px-4 py-3">{item.checkOutTime}</td>
                      <td className="px-4 py-3">{item.totalHours}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(e.target.value)
                          }
                          className="border rounded-md px-2 py-1 text-xs"
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-600 text-white px-4 py-1.5 rounded-md text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}