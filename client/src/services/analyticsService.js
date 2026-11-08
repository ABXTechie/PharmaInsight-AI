import api from "./api";

export const getDashboardAnalytics = async () => {
  const response = await api.get("/analytics/dashboard");

  return response.data;
};

/*
 * Customer & product pattern signals (retention, trends, cross-sell).
 *
 * Several pages read the same payload, so it is cached briefly and
 * concurrent callers share one request. Any change to sales, customers
 * or products clears the cache (see clearPatternCache callers).
 */
const PATTERN_CACHE_MS = 60 * 1000;
let patternCache = null; // { data, at }
let patternRequest = null;

export const clearPatternCache = () => {
  patternCache = null;
};

export const getPatternInsights = async ({ force = false } = {}) => {
  if (!force && patternCache && Date.now() - patternCache.at < PATTERN_CACHE_MS) {
    return patternCache.data;
  }

  if (!patternRequest) {
    patternRequest = api
      .get("/analytics/patterns")
      .then((response) => {
        patternCache = { data: response.data, at: Date.now() };
        return response.data;
      })
      .finally(() => {
        patternRequest = null;
      });
  }

  return patternRequest;
};
