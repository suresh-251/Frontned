import { useEffect, useState } from "react";
import api from "../api/apiClient"; // ✅ CORRECT
import {
  postMultiText,
  postMultiImage,
  postMultiVideo
} from "../api/facebook.multi.posts.api";


  export default function MultiPagePost() {
    const [mode, setMode] = useState("text"); // text | image | video
    const [pages, setPages] = useState([]);
    const [selected, setSelected] = useState([]);

    const [message, setMessage] = useState("");
    const [caption, setCaption] = useState("");
    const [description, setDescription] = useState("");

    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

  useEffect(() => {
    api.get("/facebook/pages")
      .then(res => setPages(res.data));
  }, []);

    const toggle = (id) => {
      setSelected(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id]
      );
    };

    const submit = async () => {
      if (!selected.length) {
        setError("Select at least one page");
        return;
      }

      try {
        setLoading(true);
        setError("");
        setResult(null);

        let res;

        if (mode === "text") {
          res = await postMultiText({ pageIds: selected, message });
        }

        if (mode === "image") {
          if (!imageFile) throw new Error("Select image");
          res = await postMultiImage({
            pageIds: selected,
            imageFile,
            caption
          });
        }

        if (mode === "video") {
          if (!videoFile) throw new Error("Select video");
          res = await postMultiVideo({
            pageIds: selected,
            videoFile,
            description
          });
        }

        setResult(res);
      } catch (e) {
        setError("Multi-page post failed");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <h1>Multi-Page Post</h1>

        {/* MODE SWITCH */}
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setMode("text")}>Text</button>{" "}
          <button onClick={() => setMode("image")}>Image</button>{" "}
          <button onClick={() => setMode("video")}>Video</button>
        </div>

        {/* PAGE SELECTION */}
        <h3>Select Pages</h3>
        {pages.map(p => (
          <div key={p.pageId}>
            <input
              type="checkbox"
              checked={selected.includes(p.pageId)}
              onChange={() => toggle(p.pageId)}
            />
            {" "}{p.name}
          </div>
        ))}

        <br />

        {/* TEXT */}
        {mode === "text" && (
          <textarea
            rows="4"
            style={{ width: "100%" }}
            placeholder="Message"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        )}

        {/* IMAGE */}
        {mode === "image" && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files[0])}
            />
            <br />
            <textarea
              placeholder="Caption"
              value={caption}
              onChange={e => setCaption(e.target.value)}
            />
          </>
        )}

        {/* VIDEO */}
        {mode === "video" && (
          <>
            <input
              type="file"
              accept="video/*"
              onChange={e => setVideoFile(e.target.files[0])}
            />
            <br />
            <textarea
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </>
        )}

        <br /><br />

        <button onClick={submit} disabled={loading}>
          {loading ? "Posting..." : "Post to Selected Pages"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {result && (
          <pre style={{ marginTop: 20 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    );
  }
