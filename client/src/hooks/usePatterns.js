import { useCallback, useEffect, useState } from "react";
import { getPatternInsights } from "../services/analyticsService";
import { friendlyApiError } from "../utils/apiError";

/**
 * Loads the pattern signals (shared, briefly cached across pages).
 * Pattern data is supplementary: pages keep working if it fails.
 */
const usePatterns = () => {
  const [patterns, setPatterns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    try {
      const data = await getPatternInsights({ force });
      setPatterns(data);
      setError("");
    } catch (err) {
      setError(friendlyApiError(err, "Unable to load buying patterns."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getPatternInsights()
      .then((data) => {
        if (!cancelled) setPatterns(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(friendlyApiError(err, "Unable to load buying patterns."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    return load(true);
  }, [load]);

  return { patterns, loading, error, refresh };
};

export default usePatterns;
