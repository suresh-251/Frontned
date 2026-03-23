import hrApi from "../hr.api";

const BASE = "/api/JobOpening";

/** GET all job openings */
export const getAllJobOpenings = async () => {
  const res = await hrApi.get(BASE);
  return res.data;
};

/** GET job openings by department */
export const getJobOpeningsByDept = async (departmentId) => {
  const res = await hrApi.get(`${BASE}/department/${departmentId}`);
  return res.data;
};

/** GET single job opening */
export const getJobOpeningById = async (id) => {
  const res = await hrApi.get(`${BASE}/${id}`);
  return res.data;
};

/**
 * POST create job opening
 * Body: { title, departmentId, totalOpenings, description }
 * NOTE: description must not contain literal newlines — use trim() before sending.
 */
export const createJobOpening = async ({ title, departmentId, totalOpenings, description }) => {
  const res = await hrApi.post(BASE, {
    title:         title.trim(),
    departmentId:  Number(departmentId),
    totalOpenings: Number(totalOpenings),
    description:   description.trim(),
  });
  return res.data;
};

/**
 * PUT update job opening
 * Body: { title, totalOpenings, description, status }
 */
export const updateJobOpening = async (id, { title, totalOpenings, description, status }) => {
  const res = await hrApi.put(`${BASE}/${id}`, {
    title:         title.trim(),
    totalOpenings: Number(totalOpenings),
    description:   description.trim(),
    status,
  });
  return res.data;
};

/** DELETE job opening */
export const deleteJobOpening = async (id) => {
  const res = await hrApi.delete(`${BASE}/${id}`);
  return res.data;
};
