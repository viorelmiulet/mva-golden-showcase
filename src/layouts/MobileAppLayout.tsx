import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileOnboarding from "@/components/mobile/MobileOnboarding";

const ONBOARDING_KEY = "mva-mobile-onboarding-complete";

const MobileAppLayout = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
    setIsChecking(false);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  if (isChecking) {
    return null;
  }

  if (showOnboarding) {
    return <MobileOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
