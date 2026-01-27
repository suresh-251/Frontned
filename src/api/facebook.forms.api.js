import api from "./apiClient";

export const enableForm = async (pageId, formId) => {
  return api.post(
    `/facebook/pages/${pageId}/forms/${formId}/enable`
  );
};

export const disableForm = async (pageId, formId) => {
  return api.post(
    `/facebook/pages/${pageId}/forms/${formId}/disable`
  );
};
