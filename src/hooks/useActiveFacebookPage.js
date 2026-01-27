import { useEffect, useState } from "react";
import {
  getAvailablePages,
  getActivePage,
  selectPage
} from "../api/facebook.pages.api";

export default function useActiveFacebookPage() {
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPages = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAvailablePages();
      setPages(data);

      const active = data.find(p => p.isActive);
      setActivePage(active || null);
    } catch {
      setError("Failed to load Facebook pages");
    } finally {
      setLoading(false);
    }
  };

  const changeActivePage = async (pageId) => {
    await selectPage(pageId);
    await loadPages(); // refresh state
  };

  useEffect(() => {
    loadPages();
  }, []);

  return {
    pages,
    activePage,
    loading,
    error,
    reloadPages: loadPages,
    setActivePage: changeActivePage
  };
}
