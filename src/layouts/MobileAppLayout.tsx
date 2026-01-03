import { Outlet } from "react-router-dom";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

const MobileAppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content area - fills available space */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      {/* Bottom Navigation - fixed at bottom */}
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
