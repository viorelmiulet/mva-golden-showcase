import { useEffect } from "react";
import { useGA4 } from "@/hooks/useGA4";
import { useInternalAnalytics } from "@/hooks/useInternalAnalytics";
import { useWebVitals } from "@/hooks/useWebVitals";
import { useConversionAutoCapture } from "@/hooks/useConversionTracking";

const DeferredAnalytics = () => {
  useInternalAnalytics();
  useGA4();
  useWebVitals();
  useConversionAutoCapture();


  useEffect(() => {
    document.documentElement.dataset.analyticsReady = "true";

    return () => {
      delete document.documentElement.dataset.analyticsReady;
    };
  }, []);

  return null;
};

export default DeferredAnalytics;