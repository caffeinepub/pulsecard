import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import PublicProfilePage from "./pages/PublicProfilePage";
import RecordsPage from "./pages/RecordsPage";

// Export for use in other components
export { useNavigate, useParams };

// Root layout with navbar
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <Outlet />
      <Toaster richColors position="top-right" />
    </div>
  ),
});

// Layout with navbar + footer
const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "main-layout",
  component: () => (
    <>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/",
  component: LandingPage,
});

const profileRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/profile",
  component: () => (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  ),
});

const recordsRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/records",
  component: () => (
    <ProtectedRoute>
      <RecordsPage />
    </ProtectedRoute>
  ),
});

// Public patient route — no navbar
const patientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/patient/$profileId",
  component: PublicProfilePage,
});

const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([indexRoute, profileRoute, recordsRoute]),
  patientRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
