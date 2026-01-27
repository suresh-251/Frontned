import useFacebookDashboard from "../hooks/useFacebookDashboard";

export default function Dashboard() {
  const stats = useFacebookDashboard();

  if (!stats) return <p>Loading dashboard...</p>;

  return (
    <div>
      <div className="page-title">Dashboard</div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(4, 1fr)"
        }}
      >
        <div className="card">📄 {stats.pageName}</div>
        <div className="card">📥 Total Leads: {stats.totalLeads}</div>
        <div className="card">🆕 New Leads: {stats.newLeads}</div>
        <div className="card">📋 Enabled Forms: {stats.enabledForms}</div>
      </div>
    </div>
  );
}
