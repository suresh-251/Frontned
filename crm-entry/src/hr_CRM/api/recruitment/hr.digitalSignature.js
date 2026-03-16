import hrApi from "../hr.api";

// Fetch all signature requests
export const getAllSignatures = () => hrApi.get("/api/DigitalSignature/all");

// Fetch history by Employee ID
export const getSignatureHistory = (employeeId) => hrApi.get(`/api/DigitalSignature/history/${employeeId}`);

// Get status by ID
export const getSignatureStatus = (id) => hrApi.get(`/api/DigitalSignature/status/${id}`);

// Request a signature (POST - multipart/form-data)
export const requestSignature = (formData) => hrApi.post("/api/DigitalSignature/request", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// Sign a document (POST - multipart/form-data)
export const signDocument = (id, formData) => hrApi.post(`/api/DigitalSignature/sign/${id}`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// Update signature request (PUT - multipart/form-data)
export const updateSignature = (id, formData) => hrApi.put(`/api/DigitalSignature/update/${id}`, formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// Delete signature record (DELETE)
export const deleteSignature = (id) => hrApi.delete(`/api/DigitalSignature/delete/${id}`);