import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { PageLoader } from "@/components/ui";
import { useAccountStore } from "@/store";
import { FleetChatWidget } from "@/modules/chat/FleetChatWidget";
import { ActionExecutor } from "@/modules/chat/ActionExecutor";

export function DashboardLayout() {
  const location = useLocation();
  const loadAccounts = useAccountStore((s) => s.loadAccounts);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
      {/* Fleet Chat Assistant — floats over all dashboard pages */}
      <FleetChatWidget />
      {/* Executes actions dispatched by the chat assistant */}
      <ActionExecutor />
    </div>
  );
}

export default DashboardLayout;
