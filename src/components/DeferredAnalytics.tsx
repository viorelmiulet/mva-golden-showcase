import { useEffect } from "react";
import { useGA4 } from "@/hooks/useGA4";
import { useInternalAnalytics } from "@/hooks/useInternalAnalytics";
import { useWebVitals } from "@/hooks/useWebVitals";

const DeferredAnalytics = () => {
  useInternalAnalytics();
  useGA4();
  useWebVitals();

  useEffect(() => {
    document.documentElement.dataset.analyticsReady = "true";

    return () => {
      delete document.documentElement.dataset.analyticsReady;
    };
  }, []);

  return null;
};

export default DeferredAnalytics;