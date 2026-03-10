import api from "./apiClient";
import { BASE_URL } from "./apiClient";

export const createUnifiedPost = async (payload) => {
  const formData = new FormData();

  payload.platforms.forEach(p =>
    formData.append("Platforms", p)
  );

  payload.targetAccountIds.forEach(id =>
    formData.append("TargetAccountIds", id)
  );

  formData.append("Type", payload.type);
  formData.append("Content", payload.content || "");

  if (payload.file) {
    formData.append("MediaFiles", payload.file);
  }

  const res = await api.post("/post", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return res.data;
};

export const deletePost = (id) => api.delete(`/post/history/${id}`);

export const editPost = (id, content) => api.patch(`/post/history/${id}`, { content });

export const getPostMediaUrl = (id) => `${BASE_URL}/post/${id}/media`;
