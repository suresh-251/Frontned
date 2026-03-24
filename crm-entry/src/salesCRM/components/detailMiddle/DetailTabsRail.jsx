import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export default function DetailTabsRail({ tabs, activeTab, onTabChange, mobile = false, compact = false, eyebrow = "Activity Center" }) {
  const mobileTabsRailRef = useRef(null);

  const scrollMobileTabs = (direction) => {
    if (!mobileTabsRailRef.current) return;
    mobileTabsRailRef.current.scrollBy({
      left: direction * 140,
      behavior: "smooth",
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: mobile ? 6 : compact ? 10 : 18, rowGap: 0, padding: mobile ? "10px 10px 8px" : "10px 18px 0", overflowX: "visible", flexWrap: "wrap", flexShrink: 0, background: mobile ? "linear-gradient(180deg, #fbfdff 0%, #ffffff 100%)" : "#ffffff", borderBottom: "1px solid #eef2f7", position: "relative" }}>
      {mobile ? (
        <>
          <div style={{ width: "100%", minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{eyebrow}</div>
            <div style={{ marginTop: 3, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
              {tabs.find(([id]) => id === activeTab)?.[1] || "Activity"}
            </div>
            <div style={{ position: "relative", marginTop: 8, padding: "0 28px" }}>
              <button
                type="button"
                onClick={() => scrollMobileTabs(-1)}
                aria-label="Scroll tabs left"
                style={{ position: "absolute", left: 0, top: 0, bottom: 1, width: 24, border: "1px solid #d7e2ee", borderRadius: 10, background: "#ffffff", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
              >
                <ChevronLeft size={13} />
              </button>
              <div ref={mobileTabsRailRef} className="salescrm-scroll-hidden" style={{ display: "flex", gap: 6, overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 1 }}>
                {tabs.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTabChange?.(id)}
                    style={{ border: "1.5px solid", borderColor: activeTab === id ? "#8db6e8" : "#d7e2ee", borderRadius: 12, background: activeTab === id ? "linear-gradient(180deg, #eff6ff 0%, #e0efff 100%)" : "#ffffff", color: activeTab === id ? "#1d4ed8" : "#475569", padding: "7px 10px", display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 800, cursor: "pointer", textAlign: "left", flex: "0 0 auto", minWidth: "max-content", boxShadow: activeTab === id ? "0 8px 18px rgba(191, 219, 254, 0.32)" : "0 1px 2px rgba(15, 23, 42, 0.04)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollMobileTabs(1)}
                aria-label="Scroll tabs right"
                style={{ position: "absolute", right: 0, top: 0, bottom: 1, width: 24, border: "1px solid #d7e2ee", borderRadius: 10, background: "#ffffff", color: "#94a3b8", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      ) : tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onTabChange?.(id)}
          style={{ border: "none", borderBottom: activeTab === id ? "2px solid #93c5fd" : "2px solid transparent", background: "transparent", color: activeTab === id ? "#5b7fa6" : "#64748b", padding: compact ? "10px 2px 9px" : "10px 4px 9px", display: "inline-flex", alignItems: "center", gap: compact ? 5 : 6, fontSize: compact ? 12.5 : 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
