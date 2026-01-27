import { useEffect, useState } from "react";
import {
  getAvailablePages,
  subscribePage,
  unsubscribePage
} from "../api/facebook.pages.api";

export default function PageSubscriptions() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getAvailablePages();
    setPages(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h2>Facebook Lead Subscriptions</h2>

      {loading && <p>Loading pages...</p>}

      {pages.map(p => (
        <div
          key={p.pageId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 12,
            borderBottom: "1px solid #ddd"
          }}
        >
          <span>{p.name}</span>

          <div style={{ display: "flex", gap: 10 }}>
            {/* ✅ ENABLE */}
            <button
              onClick={() => subscribePage(p.pageId)}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4
              }}
            >
              Enable Leads
            </button>

            {/* ✅ DISABLE */}
            <button
              onClick={() => unsubscribePage(p.pageId)}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: 4
              }}
            >
              Disable Leads
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
