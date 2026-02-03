import { useEffect, useState } from "react";
import api from "../api/apiClient";

export default function useInstagramAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/instagram/accounts")
      .then(res => setAccounts(res.data))
      .finally(() => setLoading(false));
  }, []);

  return { accounts, loading };
}