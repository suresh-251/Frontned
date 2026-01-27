import { useEffect, useState } from "react";
import { getLeads, getLeadForms } from "../api/facebook.leads.api";
import { useFacebookPage } from "../context/FacebookPageContext";

export default function useFacebookDashboard() {
  const { activePage } = useFacebookPage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePage) {
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.all([
      getLeads({ pageId: activePage.pageId }),
      getLeadForms()
    ])
      .then(([leads, forms]) => {
        setStats({
          pageName: activePage.name,
          totalLeads: leads.length,
          newLeads: leads.filter(l => l.status === "new").length,
          enabledForms: forms.filter(f => f.isEnabled).length
        });
      })
      .catch(() => {
        setStats(null);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [activePage?.pageId]); // 🔥 THIS IS THE KEY

  return loading ? null : stats;
}
