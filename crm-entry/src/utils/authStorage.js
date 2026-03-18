const ACCESS_TOKEN_KEY = "accessToken";

export const getAccessToken = () => (
  localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY) || null
);

export const hasPersistentAccessToken = () => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY));

export const setAccessToken = (token, persist = true) => {
  if (!token) return;

  if (persist) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};
