import { createContext, useContext } from "react";
import useActiveFacebookPage from "../hooks/useActiveFacebookPage";

const FacebookPageContext = createContext(null);

export function FacebookPageProvider({ children }) {
  const pageState = useActiveFacebookPage();
  return (
    <FacebookPageContext.Provider value={pageState}>
      {children}
    </FacebookPageContext.Provider>
  );
}   

export function useFacebookPage() {
  const ctx = useContext(FacebookPageContext);
  if (!ctx) {
    throw new Error("useFacebookPage must be used inside FacebookPageProvider");
  }
  return ctx;
}
