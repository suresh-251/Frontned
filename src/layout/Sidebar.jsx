import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div
      style={{
        width: "220px",
        background: "#111827",
        color: "#e5e7eb",
        padding: "20px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <h2 style={{ marginBottom: "30px", color: "#fff" }}>
        SocialMediaCRM
      </h2>

      <nav style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/post/create">Compose Post</Link>
        {/* <Link to="/post/multi">Multi-Page Post</Link> */}

        <hr style={{ borderColor: "#374151" }} />

        <Link to="/leads">Leads</Link>
        <Link to="/leads/forms">Lead Forms</Link>

        {/* 🔥 NEW */}
        <Link to="/facebook/pages/subscriptions">
          Lead Page Subscriptions
        </Link>
      </nav>
    </div>
  );
}
  