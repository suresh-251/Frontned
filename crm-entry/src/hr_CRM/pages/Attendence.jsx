// import { useEffect, useState } from "react";
// import {
//   checkIn,
//   checkOut,
//   generateDailyAttendance,
//   getTodayAttendance,
//   updateAttendance,
//   getTotalHours,
// } from "../api/api.attendance";

// export default function Attendance() {
//   const [employeeId, setEmployeeId] = useState("");
//   const [attendanceList, setAttendanceList] = useState([]);
//   const [totalHours, setTotalHours] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [type, setType] = useState("");

//   const showMessage = (msg, msgType) => {
//     setMessage(msg);
//     setType(msgType);
//     setTimeout(() => {
//       setMessage("");
//       setType("");
//     }, 3000);
//   };

//   // ================= LOAD TODAY =================
//   const loadTodayAttendance = async () => {
//     try {
//       const res = await getTodayAttendance();
//       setAttendanceList(res.data);
//     } catch (error) {
//       showMessage("Failed to load attendance ❌", "error");
//     }
//   };

//   useEffect(() => {
//     loadTodayAttendance();
//   }, []);

//   // ================= GENERATE DAILY =================
//   const handleGenerate = async () => {
//     try {
//       setLoading(true);
//       await generateDailyAttendance();
//       showMessage("Daily attendance generated ✅", "success");
//       loadTodayAttendance();
//     } catch {
//       showMessage("Generation failed ❌", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= CHECK IN =================
//   const handleCheckIn = async () => {
//     if (!employeeId)
//       return showMessage("Enter Employee ID ⚠", "warning");

//     try {
//       setLoading(true);
//       await checkIn(Number(employeeId));
//       showMessage("Check-In successful ✅", "success");
//       loadTodayAttendance();
//     } catch {
//       showMessage("Check-In failed ❌", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= CHECK OUT =================
//   const handleCheckOut = async () => {
//     if (!employeeId)
//       return showMessage("Enter Employee ID ⚠", "warning");

//     try {
//       setLoading(true);
//       await checkOut(Number(employeeId));
//       showMessage("Check-Out successful ✅", "success");
//       loadTodayAttendance();
//     } catch {
//       showMessage("Check-Out failed ❌", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

  

//   // ================= UPDATE STATUS =================
//   const handleUpdate = async (id, status) => {
//     try {
//       await updateAttendance(id, status);
//       showMessage("Status updated ✅", "success");
//       loadTodayAttendance();
//     } catch {
//       showMessage("Update failed ❌", "error");
//     }
//   };

//   // ================= TOTAL HOURS =================
//   const handleTotalHours = async () => {
//     if (!employeeId)
//       return showMessage("Enter Employee ID ⚠", "warning");

//     try {
//       const res = await getTotalHours(Number(employeeId));
//       setTotalHours(res.data);
//     } catch {
//       showMessage("Failed to get total hours ❌", "error");
//     }
//   };

//   const messageStyle = {
//     success: "bg-green-100 text-green-700 border-green-400",
//     error: "bg-red-100 text-red-700 border-red-400",
//     warning: "bg-yellow-100 text-yellow-700 border-yellow-400",
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 p-6">
//       <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl p-8">
//         <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
//           🎯 Attendance Management
//         </h1>

//         {/* Input */}
//         <div className="mb-6">
//           <input
//             type="number"
//             placeholder="Enter Employee ID"
//             value={employeeId}
//             onChange={(e) => setEmployeeId(e.target.value)}
//             className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500"
//           />
//         </div>

//         {/* Buttons */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//           <button
//             onClick={handleCheckIn}
//             className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold"
//           >
//             Check In
//           </button>

//           <button
//             onClick={handleCheckOut}
//             className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg font-semibold"
//           >
//             Check Out
//           </button>

//           <button
//             onClick={handleGenerate}
//             className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg font-semibold"
//           >
//             Generate Daily
//           </button>

//           <button
//             onClick={handleTotalHours}
//             className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold"
//           >
//             Total Hours
//           </button>
//         </div>

//         {/* Total Hours */}
//         {totalHours !== null && (
//           <div className="bg-purple-100 text-purple-800 p-4 rounded-lg mb-4 font-semibold">
//             Total Hours: {totalHours}
//           </div>
//         )}

//         {/* Message */}
//         {message && (
//           <div
//             className={`border p-3 rounded-lg mb-6 ${messageStyle[type]}`}
//           >
//             {message}
//           </div>
//         )}

//         {/* Attendance Table */}
//         <h2 className="text-xl font-bold mb-4 text-gray-700">
//           Today Attendance
//         </h2>

//         <div className="overflow-x-auto">
//           <table className="w-full border rounded-lg overflow-hidden">
//             <thead className="bg-indigo-600 text-white">
//               <tr>
//                 <th className="p-3">Employee ID</th>
//                 <th className="p-3">First Name</th>
//                 <th className="p-3">Date</th>
//                 <th className="p-3">Status</th>
//                 <th className="p-3">Action</th>
//               </tr>
//             </thead>

//             <tbody>
//               {attendanceList.map((item) => (
//                 <tr key={item.employeeId} className="text-center border-b">
//                   <td className="p-3">{item.employeeId}</td>
//                   <td className="p-3">{item.firstName}</td>
//                   <td className="p-3">
//                     {new Date(item.attendanceDate).toLocaleDateString()}
//                   </td>
//                   <td className="p-3 font-semibold text-indigo-600">
//                     {item.status}
//                   </td>
//                   <td className="p-3">
//                     <button
//                       onClick={() =>
//                         handleUpdate(item.employeeId, "Absent")
//                       }
//                       className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
//                     >
//                       Mark Absent
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

          

//           {attendanceList.length === 0 && (
//             <p className="text-center text-gray-500 p-4">
//               No attendance records found.
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

















































import { useEffect, useState } from "react";
import {
  checkIn,
  checkOut,
  generateDailyAttendance,
  getTodayAttendance,
  updateAttendance,
  getTotalHours,
} from "../api/api.attendance";

export default function Attendance() {
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [totalHours, setTotalHours] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const showMessage = (msg, msgType) => {
    setMessage(msg);
    setType(msgType);
    setTimeout(() => {
      setMessage("");
      setType("");
    }, 3000);
  };

  const loadTodayAttendance = async () => {
    try {
      const res = await getTodayAttendance();
      setAttendanceList(res.data);
    } catch {
      showMessage("Failed to load attendance", "error");
    }
  };

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  const handleCheckIn = async () => {
    if (!employeeId) return showMessage("Enter Employee ID", "warning");
    try {
      setLoading(true);
      await checkIn(Number(employeeId));
      showMessage("Check-In successful", "success");
      loadTodayAttendance();
    } catch {
      showMessage("Check-In failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeId) return showMessage("Enter Employee ID", "warning");
    try {
      setLoading(true);
      await checkOut(Number(employeeId));
      showMessage("Check-Out successful", "success");
      loadTodayAttendance();
    } catch {
      showMessage("Check-Out failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await generateDailyAttendance();
      showMessage("Daily attendance generated", "success");
      loadTodayAttendance();
    } catch {
      showMessage("Generation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTotalHours = async () => {
    if (!employeeId) return showMessage("Enter Employee ID", "warning");
    try {
      const res = await getTotalHours(Number(employeeId));
      setTotalHours(res.data);
    } catch {
      showMessage("Failed to get total hours", "error");
    }
  };

  const badgeColor = (status) => {
    if (status === "Present")
      return "bg-green-100 text-green-700";
    if (status === "Absent")
      return "bg-red-100 text-red-600";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="h-full flex flex-col gap-6">

      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Attendance Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage employee daily attendance records
          </p>
        </div>

        <div className="h-10 w-1 bg-indigo-500 rounded-full"></div>
      </div>

      {/* Action Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 grid md:grid-cols-5 gap-4 items-end">

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600 block mb-1">
            Employee ID
          </label>
          <input
            type="number"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          onClick={handleCheckIn}
          className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium"
        >
          Check In
        </button>

        <button
          onClick={handleCheckOut}
          className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium"
        >
          Check Out
        </button>

        <button
          onClick={handleGenerate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium"
        >
          Generate
        </button>
      </div>

      {/* Total Hours */}
      {totalHours !== null && (
        <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg p-3 text-sm font-medium">
          Total Hours: {totalHours}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1">
        
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-700">
            Today Attendance
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="p-4 text-left">Employee ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {attendanceList.map((item) => (
              <tr key={item.employeeId} className="border-b hover:bg-gray-50">
                <td className="p-4">{item.employeeId}</td>
                <td className="p-4">{item.firstName}</td>
                <td className="p-4">
                  {new Date(item.attendanceDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => handleUpdate(item.employeeId, "Absent")}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md"
                  >
                    Mark Absent
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {attendanceList.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No attendance records found.
          </div>
        )}
      </div>
    </div>
  );
}
