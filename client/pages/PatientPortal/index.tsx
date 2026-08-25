import { App as AppProvider } from "@superblocksteam/library";
import { Toaster } from "@/components/common/sonner";
import PatientPortalContent from "@/components/shared/PatientPortalContent";

/**
 * Standalone mobile-responsive patient portal page.
 * Renders outside the main app layout (no sidebar) for a clean mobile experience.
 * Access directly at /patient on a phone or tablet.
 */
export default function PatientPortalPage() {
  return (
    <AppProvider className="h-full w-full">
      <div className="min-h-screen max-w-md mx-auto bg-gradient-to-b from-teal-50 to-white">
        <PatientPortalContent />
      </div>
      <Toaster />
    </AppProvider>
  );
}
