import api from "./apiClient";

// 🔹 MULTI TEXT
export const postMultiText = async ({ pageIds, message }) => {
  const res = await api.post("/post/facebook/multi/text", {
    pageIds,
    message
  });
  return res.data;
};

// 🔹 MULTI IMAGE
export const postMultiImage = async ({
  pageIds,
  imageFile,
  caption
}) => {
  const formData = new FormData();

  pageIds.forEach(id => formData.append("PageIds", id));
  formData.append("ImageFile", imageFile);
  if (caption) formData.append("Caption", caption);

  const res = await api.post(
    "/post/facebook/multi/image",
    formData
  );

  return res.data;
};

// 🔹 MULTI VIDEO
export const postMultiVideo = async ({
  pageIds,
  videoFile,
  description
}) => {
  const formData = new FormData();

  pageIds.forEach(id => formData.append("PageIds", id));
  formData.append("VideoFile", videoFile);
  if (description) formData.append("Description", description);

  const res = await api.post(
    "/post/facebook/multi/video",
    formData
  );

  return res.data;
};
