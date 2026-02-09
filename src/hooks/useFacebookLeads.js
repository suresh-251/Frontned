import { useEffect, useState, useRef } from "react";
import {
  getLeads,
  updateLeadStatus,
  assignLead as assignLeadApi
} from "../api/facebook.leads.api";

export default function useFacebookLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    pageId: "",
    formId: "",
    status: ""
  });

  const filtersRef = useRef(filters);
  const lastCountRef = useRef(0);

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

    if (data.length !== lastCountRef.current) {
      lastCountRef.current = data.length;
      setLeads(data);
    }

    if (!silent) setLoading(false);
  };

  // AUTO REFRESH
  useEffect(() => {
    loadLeads({}, true);

    const interval = setInterval(() => {
      loadLeads({}, true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

const reload = (override = {}) => {
  const newFilters = {
    ...filtersRef.current,
    ...override
  };

  setFilters(newFilters);

  // 🔥 always reload leads, even if pageId is empty
  loadLeads(newFilters);
};


  const changeStatus = async (leadId, newStatus) => {
    await updateLeadStatus(leadId, newStatus);
    await loadLeads();
  };

const assignLead = async (leadId, user) => {
  await assignLeadApi(leadId, {
    userId: user.id,
    userName: user.name,
    remark: "Assigned from Leads page"
  });

  await loadLeads({}, true);
};



  return {
    leads,
    loading,
    filters,
    setFilters,
    reload,
    changeStatus,
    assignLead
  };
}
