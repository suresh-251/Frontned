import { useEffect, useState } from "react";
import { getAdminUsers } from "../../api/admin/users.api";
import { getAttendanceHistory } from "../api/api.attendance";

export default function Dashboard() {
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [presentEmployees, setPresentEmployees] = useState(0);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1️⃣ Get all employees
      const userRes = await getAdminUsers({ page: 1, pageSize: 1000 });
      const employees = userRes?.users ?? [];

      setTotalEmployees(employees.length);

      let presentCount = 0;
      let onLeaveCount = 0;

      // 2️⃣ For each employee get latest attendance
      for (const emp of employees) {
        try {
          const historyRes = await getAttendanceHistory(emp.userId);
          const history = historyRes?.data ?? [];

          if (history.length === 0) continue;

          // Get latest attendance record
          const latest = history.reduce((prev, current) =>
            new Date(current.attendanceDate) >
            new Date(prev.attendanceDate)
              ? current
              : prev
          );

          if (latest.status === "Present") {
            presentCount++;
          }

          if (latest.status === "OnLeave") {
            onLeaveCount++;
          }

        } catch (err) {
          console.error("Attendance fetch error for user:", emp.userId);
        }
      }

      setPresentEmployees(presentCount);
      setOnLeaveEmployees(onLeaveCount);

    } catch (error) {
      console.error("Dashboard load error:", error);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">HR Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">Total Employees</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {totalEmployees}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">Present Today</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {presentEmployees}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500 text-sm">On Leave</h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            {onLeaveEmployees}
          </p>
        </div>
      </div>
    </div>
  );
}