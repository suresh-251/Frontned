import api from "../axios";

export const getManagersByDomain = async (domainCode) => {
  const res = await api.get("/api/users/managers", {
    params: { domainCode },
  });
  return res.data;
};

export const getMyTeam = async () => {
  const res = await api.get("/api/self/team");
  return res.data;
};