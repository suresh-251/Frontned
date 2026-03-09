import { useState, useEffect } from "react";

const NAV_LINKS = ["Dashboard", "Leads", "Contacts", "Deals"];

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Navbar({ activePage, setActivePage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleNav = (page) => {
    setActivePage(page);
    setMenuOpen(false);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
        <div className="navbar-inner">
          {/* Brand */}
          <div className="navbar-brand" onClick={() => handleNav("Dashboard")}>
            <span className="brand-name">Sales CRM</span>
          </div>

          {/* Desktop Nav */}
          <ul className="navbar-links desktop-only">
            {NAV_LINKS.map(link => (
              <li key={link}>
                <button
                  className={`nav-link-btn ${activePage === link ? "active" : ""}`}
                  onClick={() => handleNav(link)}
                >
                  {link}
                  {activePage === link && <span className="nav-active-dot" />}
                </button>
              </li>
            ))}
          </ul>

          {/* Right Side */}
          <div className="navbar-right">
            <button className="nav-icon-btn" aria-label="Notifications">
              <IconBell />
              <span className="nav-badge">3</span>
            </button>
            <div className="nav-avatar" title="Mythili Chowdary">
              <span>MC</span>
            </div>
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <div
        className={`mobile-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <div className="nav-avatar large"><span>MC</span></div>
          <div>
            <div className="mobile-user-name">Mythili Chowdary</div>
            <div className="mobile-user-role">Sales Manager</div>
          </div>
        </div>
        <ul className="mobile-nav-links">
          {NAV_LINKS.map(link => (
            <li key={link}>
              <button
                className={`mobile-nav-btn ${activePage === link ? "active" : ""}`}
                onClick={() => handleNav(link)}
              >
                {link}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}