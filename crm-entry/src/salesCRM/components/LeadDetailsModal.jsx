import { useEffect, useState } from "react";
import { X } from "lucide-react";
import leadsAPI from "../api/leads.api";
import Toast from "../utils/toast";
import { formatStatus } from "../pages/leads/utils";
import { useViewportWidth } from "./leadDetails/shared";
import {
  ConvertToDealModal,
  LeftPanel,
  Middle,
  Timeline,
} from "./leadDetails/sections";

export default function LeadDetailsModal({ lead, onClose, onDealConverted }) {
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [activeTab, setActiveTab] = useState("activity");
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("activities");
  const viewportWidth = useViewportWidth();
  const isMobileLayout = viewportWidth < 820;
  const isTabletLayout = !isMobileLayout && viewportWidth < 1100;
  const overlayPadding = isMobileLayout ? 0 : isTabletLayout ? 16 : 24;
  const modalWidth = isMobileLayout ? "100vw" : isTabletLayout ? "min(1024px, calc(100vw - 32px))" : "min(1440px, calc(100vw - 48px))";
  const modalHeight = isMobileLayout ? "100dvh" : isTabletLayout ? "min(94vh, 920px)" : "min(88vh, 860px)";
  const shellRadius = isMobileLayout ? 0 : isTabletLayout ? 24 : 28;
  const leadStatus = formatStatus(lead?.status || "");
  const leadLabel = lead?.company ? `${lead.company} - ${leadStatus}` : leadStatus;
  const mobilePanels = [
    ["contact", "Contact"],
    ["activities", "Activities"],
    ["timeline", "Timeline"],
  ];

  const loadTimeline = async () => {
    if (!lead?.id) return;
    setTimelineLoading(true);
    try {
      const data = await leadsAPI.getTimeline(lead.id);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (error) {
      Toast.error(error?.response?.data?.message || "Unable to load timeline");
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [lead?.id]);

  useEffect(() => {
    setActiveTab("activity");
    setMobilePanel("activities");
  }, [lead?.id]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="overlay" onClick={onClose} style={{ padding: overlayPadding, zIndex: 700 }}>
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: modalWidth,
            height: modalHeight,
            background: isMobileLayout ? "linear-gradient(180deg, #eef4fb 0%, #f8fafc 100%)" : "#f8fafc",
            borderRadius: shellRadius,
            overflow: "hidden",
            boxShadow: "0 32px 90px rgba(15, 23, 42, 0.22)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {!isMobileLayout ? (
            <button
              className="icon-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close lead details modal"
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                zIndex: 8,
                width: 32,
                height: 32,
                borderRadius: 12,
                border: "1px solid #d8e3ef",
                background: "rgba(255,255,255,0.96)",
                boxShadow: "0 6px 14px rgba(148, 163, 184, 0.12)",
                padding: 0,
              }}
            >
              <X size={14} />
            </button>
          ) : null}

          {isMobileLayout ? (
            <div
              style={{
                padding: "10px 12px 8px",
                borderBottom: "1px solid #dfe7f1",
                background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)",
                backdropFilter: "blur(14px)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 8px", borderRadius: 999, background: "#eef4ff", border: "1px solid #d6e4ff", color: "#315c85", fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Lead Workspace
                  </div>
                  <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900, color: "#0f172a", lineHeight: 1.05 }}>
                    {lead?.name || "Lead details"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                    {leadLabel || "Sales lead workspace"}
                  </div>
                </div>
                <button
                  className="icon-btn"
                  onClick={onClose}
                  title="Close"
                  style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 12, border: "1px solid #d7e2ee", background: "rgba(255,255,255,0.94)", boxShadow: "0 6px 14px rgba(148, 163, 184, 0.12)", padding: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="salescrm-scroll-hidden" style={{ display: "flex", gap: 8, justifyContent: "center", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", marginTop: 10, paddingBottom: 1 }}>
                {mobilePanels.map(([id, label]) => {
                  const active = mobilePanel === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMobilePanel(id)}
                      style={{
                        width: "fit-content",
                        padding: "6px 9px",
                        borderRadius: 14,
                        border: "1.5px solid",
                        borderColor: active ? "#8db6e8" : "#d7e2ee",
                        background: active ? "linear-gradient(180deg, #eff6ff 0%, #e0efff 100%)" : "#ffffff",
                        color: active ? "#1d4ed8" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        textAlign: "left",
                        boxShadow: active ? "0 10px 20px rgba(191, 219, 254, 0.35)" : "0 1px 2px rgba(15, 23, 42, 0.04)",
                        cursor: "pointer",
                        flex: "0 0 auto",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800, color: active ? "#0f172a" : "#1e293b" }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isMobileLayout ? (
            <div className="salescrm-scroll-hidden" style={{ flex: 1, minHeight: 0, height: "100%", overflowY: "auto", overflowX: "hidden", padding: "8px 8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
              {mobilePanel === "contact" ? (
                <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)", display: "flex", flexDirection: "column", minHeight: 0, flex: "0 0 auto" }}>
                  <LeftPanel
                    lead={lead}
                    onConvert={() => setShowConvertModal(true)}
                    onOpenTab={(tab) => {
                      setActiveTab(tab);
                      setMobilePanel("activities");
                    }}
                    stacked
                    mobile
                  />
                </div>
              ) : null}

              {mobilePanel === "activities" ? (
                <div style={{ borderRadius: 20, overflow: "hidden", background: "#ffffff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)", display: "flex", flexDirection: "column", minHeight: 0, flex: "0 0 auto" }}>
                  <Middle lead={lead} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} timeline={timeline} compact mobile />
                </div>
              ) : null}

              {mobilePanel === "timeline" ? (
                <div style={{ borderRadius: 20, overflow: "hidden", background: "#fbfdff", border: "1px solid #d8e3ef", boxShadow: "0 10px 24px rgba(148, 163, 184, 0.14)", display: "flex", flexDirection: "column", minHeight: 0, flex: "0 0 auto" }}>
                  <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked mobile />
                </div>
              ) : null}
            </div>
          ) : isTabletLayout ? (
            <div className="salescrm-scroll-hidden" style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateRows: "minmax(0, 1fr) 320px", overflow: "hidden", background: "#ffffff" }}>
              <div style={{ minHeight: 0, display: "grid", gridTemplateColumns: "220px minmax(0, 1fr)", overflow: "hidden" }}>
                <div style={{ minHeight: 0, overflow: "auto", background: "#ffffff", borderRight: "1px solid #e5e7eb" }}>
                  <LeftPanel lead={lead} onConvert={() => setShowConvertModal(true)} onOpenTab={setActiveTab} stacked={false} hideAvatar />
                </div>
                <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                  <Middle lead={lead} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} timeline={timeline} compact />
                </div>
              </div>
              <div style={{ minHeight: 0, borderTop: "1px solid #e5e7eb", background: "#fbfdff", overflow: "hidden" }}>
                <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "214px minmax(0, 1fr) 300px", overflow: "hidden", background: "#ffffff" }}>
              <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                <LeftPanel lead={lead} onConvert={() => setShowConvertModal(true)} onOpenTab={setActiveTab} stacked={false} />
              </div>
              <div style={{ minHeight: 0, overflow: "hidden", background: "#ffffff" }}>
                <Middle lead={lead} activeTab={activeTab} onTabChange={setActiveTab} onActivitySaved={loadTimeline} timeline={timeline} compact={false} />
              </div>
              <div style={{ minHeight: 0, overflow: "hidden" }}>
                <Timeline items={timeline} loading={timelineLoading} onRefresh={loadTimeline} stacked={false} />
              </div>
            </div>
          )}
        </div>
      </div>
      {showConvertModal ? <ConvertToDealModal lead={lead} onClose={() => setShowConvertModal(false)} onConverted={onDealConverted} /> : null}
    </>
  );
}
