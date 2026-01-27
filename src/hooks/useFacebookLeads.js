import { useEffect, useState, useRef } from "react";
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

  // 🔒 Always keep latest filters for polling
  const filtersRef = useRef(filters);
  const lastCountRef = useRef(0);

  // keep ref in sync
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const loadLeads = async (override = {}, silent = false) => {
    if (!silent) setLoading(true);

    const finalFilters = {
      ...filtersRef.current,
      ...override
    };

    const data = await getLeads(finalFilters);

    // update only if data changed
    if (data.length !== lastCountRef.current) {
      lastCountRef.current = data.length;
      setLeads(data);
    }

    if (!silent) setLoading(false);
  };

  // 🔁 AUTO REFRESH (webhook → DB → UI)
  useEffect(() => {
    loadLeads({}, true); // silent first load

    const interval = setInterval(() => {
      loadLeads({}, true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 🔘 MANUAL reload (filters / button)
  const reload = (override = {}) => {
    const newFilters = {
      ...filtersRef.current,
      ...override
    };

    setFilters(newFilters);
    loadLeads(override);
  };

  const changeStatus = async (leadId, newStatus) => {
    await updateLeadStatus(leadId, newStatus);
    await loadLeads();
  };

  return {
    leads,
    loading,
    filters,
    setFilters, // if UI directly updates filters
    reload,     // manual refresh
    changeStatus
  };
}
