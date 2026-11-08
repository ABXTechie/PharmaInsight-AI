// Turns API failures into messages a shop owner can act on.
// A 404 "Route Not Found" means the frontend is newer than the deployed
// backend (the server hasn't been redeployed with the latest code).
export const isMissingRoute = (error) =>
  error?.response?.status === 404 &&
  /route not found/i.test(error?.response?.data?.message || "");

export const friendlyApiError = (error, fallback) => {
  if (isMissingRoute(error)) {
    return "This feature needs the latest server update. Redeploy the backend, then try again.";
  }
  if (error?.code === "ECONNABORTED") {
    return "The server took too long to respond. Please try again.";
  }
  if (!error?.response && error?.message === "Network Error") {
    return "Can't reach the server. Check your connection and try again.";
  }
  return error?.response?.data?.message || fallback;
};
