import { useEffect, useState } from "react";
import {
  getLeads,
  updateLeadStatus
} from "../api/facebook.leads.api";

export default function useFacebookLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    pageId: "",
    formId: "",
    status: ""
  });

  const loadLeads = async (override = {}) => {
    setLoading(true);

    const finalFilters = { ...filters, ...override };
    setFilters(finalFilters);

    const data = await getLeads(finalFilters);
    setLeads(data);

    setLoading(false);
  };

  const changeStatus = async (leadId, newStatus) => {
    await updateLeadStatus(leadId, newStatus);
    await loadLeads();
  };

  useEffect(() => {
    loadLeads();
  }, []);

  return {
    leads,
    loading,
    filters,
    setFilters,
    reload: loadLeads,
    changeStatus
  };
}
