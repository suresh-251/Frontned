import api from "./apiClient";

// 🔹 TEXT
export const postTextToFacebook = async (message) => {
  const res = await api.post("/post/facebook/text", {
    message
  });
  return res.data;
};

// 🔹 IMAGE
export const postImageToFacebook = async ({
  imageFile,
  imageUrl,
  caption
}) => {
  const formData = new FormData();

  if (imageFile) formData.append("ImageFile", imageFile);
  if (imageUrl) formData.append("ImageUrl", imageUrl);
  if (caption) formData.append("Caption", caption);

  const res = await api.post(
    "/post/facebook/image",
    formData
  );

  return res.data;
};

// 🔹 VIDEO
export const postVideoToFacebook = async ({
  videoFile,
  videoUrl,
  description
}) => {
  const formData = new FormData();

  if (videoFile) formData.append("VideoFile", videoFile);
  if (videoUrl) formData.append("VideoUrl", videoUrl);
  if (description) formData.append("Description", description);

  const res = await api.post(
    "/post/facebook/video",
    formData
  );

  return res.data;
};
