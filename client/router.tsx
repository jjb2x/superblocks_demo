import { createBrowserRouter } from "react-router";
import { PageNotFound, RouteLoadError } from "@superblocksteam/library";
import RegisteredApp from "./App.js";

export const router = createBrowserRouter([
  {
    // Login page — standalone, no sidebar
    path: "/",
    index: true,
    lazy: () => import("./pages/Login/index.js").then((m) => ({ Component: m.default })),
  },
  {
    // Standalone patient portal — no sidebar, mobile-optimized
    path: "/patient",
    lazy: () => import("./pages/PatientPortal/index.js").then((m) => ({ Component: m.default })),
  },
  {
    // Main app with sidebar layout
    path: "/app",
    Component: RegisteredApp,
    errorElement: <RouteLoadError />,
    children: [
      {
        index: true,
        lazy: () => import("./pages/ExecutiveOverview/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "operations",
        lazy: () => import("./pages/OperationsDashboard/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "queue",
        lazy: () => import("./pages/ExceptionQueue/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "new-issue",
        lazy: () => import("./pages/AddNewIssue/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "location",
        lazy: () => import("./pages/LocationDetail/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "shipping",
        lazy: () => import("./pages/ShippingLicensing/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "integration",
        lazy: () => import("./pages/DataIntegration/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "integration/queries",
        lazy: () => import("./pages/SourceQueryEditor/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "mhav",
        lazy: () => import("./pages/MyHealthVanderbilt/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "security",
        lazy: () => import("./pages/SecurityCompliance/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "admin",
        lazy: () => import("./pages/Administration/index.js").then((m) => ({ Component: m.default })),
      },
      {
        path: "*",
        Component: () => (
          <PageNotFound
            title="Page not found"
            buttonPath="/app"
            buttonText="Return to Executive Overview"
          />
        ),
      },
    ],
  },
]);
