import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Normalizes URLs by removing trailing slashes (except for root "/").
 * This ensures SEO consistency: /proprietati/ → /proprietati
 */
const TrailingSlashRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      const normalized = pathname.replace(/\/+$/, "") || "/";
      navigate(`${normalized}${search}${hash}`, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default TrailingSlashRedirect;
