import { Outlet } from "react-router";
import { App as AppProvider } from "@superblocksteam/library";
import { Toaster } from "./components/common/sonner";
import AppLayout from "./components/layout/AppLayout";
import { AppContextProvider } from "./context/AppContext";
import { PriorityProvider } from "./context/PriorityContext";

export default function AppComponent() {
  return (
    <>
      {/* Do not remove the AppProvider */}
      <AppProvider className="h-full w-full">
        <AppContextProvider>
          <PriorityProvider>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </PriorityProvider>
        </AppContextProvider>
      </AppProvider>
      <Toaster />
    </>
  );
}
