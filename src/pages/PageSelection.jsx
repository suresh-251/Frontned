import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAvailablePages,
  selectPage
} from "../api/facebook.pages.api";

export default function PageSelection() {
  const [pages, setPages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAvailablePages()
      .then(setPages)
      .catch(() => alert("Failed to load pages"));
  }, []);

  const handleSelect = async (pageId) => {
    await selectPage(pageId);
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Select Facebook Page</h2>

      {pages.map(p => (
        <div
          key={p.pageId}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <span>{p.name}</span>
          <button onClick={() => handleSelect(p.pageId)}>
            Select
          </button>
          <button onClick={() => subscribePage(p.pageId)}>
            Enable Auto Leads
          </button>

          <button onClick={() => unsubscribePage(p.pageId)}>
            Disable Auto Leads
          </button>

        </div>
      ))}
    </div>
  );
}
