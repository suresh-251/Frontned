import { Suspense, lazy } from "react";
import { useParams } from "react-router-dom";

/* Lazy-load each CRM module — only the active one downloads */
const SocialEntry = lazy(() => import("../../socialCRM/SocialEntry"));
const SalesEntry = lazy(() => import("../../salesCRM/SalesEntry"));
const HrRoutes = lazy(() => import("../../hr_CRM/routes/Hr.routes"));

const ModuleLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      <p className="mt-3 text-sm text-gray-500">Loading module...</p>
    </div>
  </div>
);

export default function CrmShell() {
  const { domainCode } = useParams();
  const code = domainCode?.toLowerCase();

  let ModuleComponent = null;

  if (code === "socialmedia") ModuleComponent = SocialEntry;
  else if (code === "sales") ModuleComponent = SalesEntry;
  else if (code === "hr") ModuleComponent = HrRoutes;

  if (!ModuleComponent) {
    return (
      <div className="p-10 text-center text-red-500 text-xl">
        CRM Not Available
      </div>
    );
  }

  return (
    <Suspense fallback={<ModuleLoader />}>
      <ModuleComponent />
    </Suspense>
  );
}
