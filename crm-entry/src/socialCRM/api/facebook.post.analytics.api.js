// import api from "./apiClient";

// /**
//  * Facebook Post Analytics APIs
//  */

// // GET /api/analytics/facebook/posts
// export const getFacebookPosts = async () => {
//   const response = await api.get("/analytics/facebook/posts");
//   return response.data;
// };

// // GET /api/analytics/facebook/posts/top
// export const getTopFacebookPosts = async () => {
//   const response = await api.get("/analytics/facebook/posts/top");
//   return response.data;
// };

// // GET /api/analytics/facebook/posts/overview
// export const getFacebookPostsOverview = async () => {
//   const response = await api.get("/analytics/facebook/posts/overview");
//   return response.data;
// };

// // GET /api/analytics/facebook/posts/engagement-trend
// export const getFacebookEngagementTrend = async () => {
//   const response = await api.get("/analytics/facebook/posts/engagement-trend");
//   return response.data;
// };

// // GET /api/analytics/facebook/posts/best-time
// export const getBestTimeToPost = async () => {
//   const response = await api.get("/analytics/facebook/posts/best-time");
//   return response.data;
// };

// // GET /api/analytics/facebook/posts/best-day
// export const getBestDayToPost = async () => {
//   const response = await api.get("/analytics/facebook/posts/best-day");
//   return response.data;
// };




import api from "./apiClient";

/**
 * ===============================
 * FACEBOOK POST ANALYTICS APIs
 * ===============================
 */


/* ===============================
   GET POSTS
   GET /api/analytics/facebook/posts
   =============================== */
export const getFacebookPosts = async (limit = 10) => {
  const response = await api.get(
    "/analytics/facebook/posts",
    {
      params: { limit }
    }
  );

  return response.data || [];
};


/* ===============================
   GET TOP POSTS
   GET /api/analytics/facebook/posts/top
   =============================== */
export const getTopFacebookPosts = async ({
  days = 7,
  top = 5,
  metric = "engagement",
} = {}) => {

  const response = await api.get(
    "/analytics/facebook/posts/top",
    {
      params: {
        days,
        top,
        metric,
      },
    }
  );

  return response.data || [];
};


/* ===============================
   GET POSTS OVERVIEW
   GET /api/analytics/facebook/posts/overview
   =============================== */
export const getFacebookPostsOverview = async (days = 7) => {

  const response = await api.get(
    "/analytics/facebook/posts/overview",
    {
      params: { days }
    }
  );

  return response.data || {};
};


/* ===============================
   GET ENGAGEMENT TREND
   GET /api/analytics/facebook/posts/engagement-trend
   =============================== */
export const getFacebookEngagementTrend = async (days = 7) => {

  const response = await api.get(
    "/analytics/facebook/posts/engagement-trend",
    {
      params: { days }
    }
  );

  return response.data || [];
};


/* ===============================
   GET BEST TIME TO POST
   GET /api/analytics/facebook/posts/best-time
   =============================== */
export const getBestTimeToPost = async (days = 30) => {

  const response = await api.get(
    "/analytics/facebook/posts/best-time",
    {
      params: { days }
    }
  );

  return response.data || [];
};


/* ===============================
   GET BEST DAY TO POST
   GET /api/analytics/facebook/posts/best-day
   =============================== */
export const getBestDayToPost = async (days = 30) => {

  const response = await api.get(
    "/analytics/facebook/posts/best-day",
    {
      params: { days }
    }
  );

  return response.data || [];
};