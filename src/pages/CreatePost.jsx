import { useEffect, useState } from "react";
import api from "../api/apiClient";
import { getInstagramDisplayName } from "../utils/instagramDisplayName";

export default function CreatePost() {
  const [mode, setMode] = useState("Text"); // Text | Image | Video

  const [fbPages, setFbPages] = useState([]);
  const [igAccounts, setIgAccounts] = useState([]);

  const [selectedFb, setSelectedFb] = useState([]);
  const [selectedIg, setSelectedIg] = useState([]);

  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  /* =========================
     LOAD FACEBOOK PAGES
     ========================= */
  useEffect(() => {
    api.get("/facebook/pages")
      .then(res => setFbPages(res.data))
      .catch(() => {});
  }, []);

  /* =========================
     LOAD INSTAGRAM ACCOUNTS
     ========================= */
  useEffect(() => {
    api.get("/instagram/accounts")
      .then(res => setIgAccounts(res.data))
      .catch(() => {});
  }, []);

  const toggle = (id, setter) => {
    setter(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  /* =========================
     SUBMIT (UNIFIED)
     ========================= */
  const submit = async () => {
    if (!selectedFb.length && !selectedIg.length) {
      setError("Select at least one Facebook page or Instagram account");
      return;
    }

    if (mode !== "Text" && !file) {
      setError("Select a media file");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const form = new FormData();

      // Platforms
      if (selectedFb.length) form.append("Platforms", "Facebook");
      if (selectedIg.length) form.append("Platforms", "Instagram");

      // Targets
      [...selectedFb, ...selectedIg].forEach(id =>
        form.append("TargetAccountIds", id)
      );

      form.append("Type", mode);
      form.append("Content", content || "");

      if (file) {
        form.append("MediaFiles", file);
      }

      const res = await api.post("/post", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResult(res.data);
    } catch (e) {
      setError("Unified post failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Unified Multi-Page Post</h1>

      {/* MODE */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setMode("Text")}>Text</button>{" "}
        <button onClick={() => setMode("Image")}>Image</button>{" "}
        <button onClick={() => setMode("Video")}>Video</button>
      </div>

{/* FACEBOOK + INSTAGRAM SIDE BY SIDE */}
<div
  style={{
    display: "flex",
    gap: "40px",
    alignItems: "flex-start",
    marginTop: 20,
    flexWrap: "wrap"
  }}
>
  {/* FACEBOOK PAGES */}
  <div style={{ flex: 1, minWidth: 300 }}>
    <h3>Facebook Pages</h3>
    {fbPages.length === 0 && <p>No pages found</p>}
{fbPages.map(p => (
  <div key={p.pageId} style={{ marginBottom: 6 }}>
    <label
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        cursor: "pointer"
      }}
    >
      <input
        type="checkbox"
        checked={selectedFb.includes(p.pageId)}
        onChange={() => toggle(p.pageId, setSelectedFb)}
      />
      <span>{p.name}</span>
    </label>
  </div>
))}

  </div>

  {/* INSTAGRAM ACCOUNTS */}
  <div style={{ flex: 1, minWidth: 300 }}>
    <h3>Instagram Accounts</h3>
    {igAccounts.length === 0 && <p>No accounts found</p>}
{igAccounts.map(a => (
  <div key={a.instagramBusinessId} style={{ marginBottom: 6 }}>
    <label
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
        cursor: "pointer"
      }}
    >
      <input
        type="checkbox"
        checked={selectedIg.includes(a.instagramBusinessId)}
        onChange={() =>
          toggle(a.instagramBusinessId, setSelectedIg)
        }
      />
      <span>
        <span>{getInstagramDisplayName(a)}</span>
        {a.isActive ? "✓" : " (inactive)"}
      </span>
    </label>
  </div>
))}

  </div>
</div>




      {/* CONTENT */}
      <textarea
        rows="4"
        style={{ width: "100%" }}
        placeholder="Post content"
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <br /><br />

      {/* MEDIA */}
      {(mode === "Image" || mode === "Video") && (
        <input
          type="file"
          accept={mode === "Image" ? "image/*" : "video/*"}
          onChange={e => setFile(e.target.files[0])}
        />
      )}

      <br /><br />

      <button onClick={submit} disabled={loading}>
        {loading ? "Posting..." : "Post to Selected Accounts"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* RESULT */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result</h3>
          {result.map(r => (
            <div key={r.targetAccountId}>
              <strong>{r.targetAccountId}</strong> →{" "}
              {r.status} {r.success ? "✅" : "❌"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
