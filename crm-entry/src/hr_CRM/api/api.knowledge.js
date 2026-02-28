import hrApi from "./hr.api";

/**
 * ✅ Get All Knowledge Records
 * GET: /api/Knowledge
 */
export const getKnowledgeList = async () => {
  const response = await hrApi.get("/api/Knowledge");
  return response.data;
};

/**
 * ✅ Create Knowledge Record
 * POST: /api/Knowledge
 * Body:
 * {
 *   branchId: number,
 *   recordType: string,
 *   code: string,
 *   title: string,
 *   category: string,
 *   subCategory: string,
 *   summary: string,
 *   approvalStatus: string,
 *   approvedBy: string,
 *   visibility: string,
 *   status: string,
 *   createdBy: number
 * }
 */
export const createKnowledge = async (knowledgeData) => {
  const response = await hrApi.post("/api/Knowledge", knowledgeData);
  return response.data;
};

/**
 * ✅ Delete Knowledge Record
 * DELETE: /api/Knowledge/{id}
 */
export const deleteKnowledge = async (id) => {
  const response = await hrApi.delete(`/api/Knowledge/${id}`);
  return response.data;
};