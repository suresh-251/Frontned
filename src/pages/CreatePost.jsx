import { useEffect, useState } from "react";
import {
  postTextToFacebook,
  postImageToFacebook,
  postVideoToFacebook
} from "../api/facebook.posts.api";
import { loadCapabilities } from "../store/capabilities.store";

export default function CreatePost() {
  const [caps, setCaps] = useState(null);
  const [mode, setMode] = useState(null);

  const [message, setMessage] = useState("");
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCapabilities().then(setCaps);
  }, []);

  useEffect(() => {
    if (!caps) return;
    if (caps.canPostText) setMode("text");
    else if (caps.canPostImage) setMode("image");
    else if (caps.canPostVideo) setMode("video");
  }, [caps]);

  const resetFiles = () => {
    setImageFile(null);
    setVideoFile(null);
    setVideoUrl("");
  };

  const resetStatus = () => {
    setSuccess("");
    setError("");
  };

  if (!caps) return <p>Loading...</p>;

  if (!caps.hasActivePage) {
    return (
      <div className="card">
        <h3>No Facebook Page Selected</h3>
        <a href="/facebook/pages/select">Select Page</a>
      </div>
    );
  }

  const submitText = async () => {
    try {
      setLoading(true);
      resetStatus();
      await postTextToFacebook(message);
      setSuccess("Post published successfully ✅");
      setMessage("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitImage = async () => {
    try {
      setLoading(true);
      resetStatus();
      await postImageToFacebook({ imageFile, caption });
      setSuccess("Image posted successfully ✅");
      resetFiles();
      setCaption("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitVideo = async () => {
    try {
      setLoading(true);
      resetStatus();
      await postVideoToFacebook({
        videoFile,
        videoUrl,
        description
      });
      setSuccess("Video posted successfully ✅");
      resetFiles();
      setDescription("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Post</h2>

      <div>
        {caps.canPostText && (
          <button onClick={() => { setMode("text"); resetFiles(); }}>
            Text
          </button>
        )}
        {caps.canPostImage && (
          <button onClick={() => { setMode("image"); resetFiles(); }}>
            Image
          </button>
        )}
        {caps.canPostVideo && (
          <button onClick={() => { setMode("video"); resetFiles(); }}>
            Video
          </button>
        )}
      </div>

      {success && <p style={{ color: "green" }}>{success}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {mode === "text" && (
        <>
          <textarea value={message} onChange={e => setMessage(e.target.value)} />
          <button onClick={submitText}>Post</button>
        </>
      )}

      {mode === "image" && (
        <>
          <input type="file" accept="image/*"
            onChange={e => setImageFile(e.target.files[0])} />
          <textarea value={caption} onChange={e => setCaption(e.target.value)} />
          <button onClick={submitImage}>Post Image</button>
        </>
      )}

      {mode === "video" && (
        <>
          <input type="file" accept="video/*"
            onChange={e => setVideoFile(e.target.files[0])} />
          <textarea value={description}
            onChange={e => setDescription(e.target.value)} />
          <button onClick={submitVideo}>Post Video</button>
        </>
      )}
    </div>
  );
}
