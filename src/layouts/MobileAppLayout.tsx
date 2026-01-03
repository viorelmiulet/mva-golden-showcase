import { Outlet } from "react-router-dom";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

const MobileAppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content with safe area padding */}
      <main className="pb-20 pt-safe">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
