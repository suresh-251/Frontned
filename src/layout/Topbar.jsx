import { getCapabilities } from "../store/capabilities.store";

export default function Topbar() {
  const caps = getCapabilities();

  return (
    <div
      style={{
        background: "#fff",
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb"
      }}
    >
      <strong>
        {caps?.hasActivePage
          ? `Active Page: ${caps.activePageName}`
          : "No active page selected"}
      </strong>
    </div>
  );
}
