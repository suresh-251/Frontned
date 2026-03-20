import hrApi from "../hr.api";

export const getAllSignatures        = ()       => hrApi.get("/api/DigitalSignature/all");
export const getSignatureHistory     = (userId) => hrApi.get(`/api/DigitalSignature/history/${userId}`);
export const getSignatureStatus      = (id)     => hrApi.get(`/api/DigitalSignature/status/${id}`);
export const requestSignature        = (fd)     => hrApi.post("/api/DigitalSignature/request", fd, { headers: { "Content-Type": "multipart/form-data" } });
export const signDocument            = (id, fd) => hrApi.post(`/api/DigitalSignature/sign/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
export const updateSignature         = (id, fd) => hrApi.put(`/api/DigitalSignature/update/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteSignature         = (id)     => hrApi.delete(`/api/DigitalSignature/delete/${id}`);
export const viewDocument            = (id)     => hrApi.get(`/api/DigitalSignature/view/${id}`, { responseType: "blob" });
export const downloadSignedDocument  = (id)     => hrApi.get(`/api/DigitalSignature/download-signed/${id}`, { responseType: "blob" });
