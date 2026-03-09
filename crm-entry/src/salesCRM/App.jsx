import { useState } from "react";
import Navbar from "./layout/Navbar";
import Leads from "./pages/Leads";
import "./App.css";

export default function App() {
  const [activePage, setActivePage] = useState("Leads");

  return (
    <div className="app-root">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="app-main">
        {activePage === "Leads" && <Leads />}
        {activePage === "Dashboard" && (
          <div className="placeholder-page">
            <div className="placeholder-icon">📊</div>
            <h2>Dashboard</h2>
            <p>Coming soon — navigate to Leads to see the full experience.</p>
          </div>
        )}
        {activePage === "Contacts" && (
          <div className="placeholder-page">
            <div className="placeholder-icon">👥</div>
            <h2>Contacts</h2>
            <p>Coming soon.</p>
          </div>
        )}
        {activePage === "Deals" && (
          <div className="placeholder-page">
            <div className="placeholder-icon">🤝</div>
            <h2>Deals</h2>
            <p>Coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}