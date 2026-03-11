import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { name: "Leads", path: "/crm/sales/leads" },
];

export default function Topbar() {

  const navigate = useNavigate();
  const [scrolled,setScrolled] = React.useState(false)

  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll",onScroll)
    return () => window.removeEventListener("scroll",onScroll)
  },[])

  const handleLogout = ()=>{
    localStorage.removeItem("salesCrmToken");
    navigate("/");
  }

  return (

    <header style={{
      position:"fixed",
      top:0,
      left:0,
      right:0,
      height:"64px",
      background:"#ffffff",
      borderBottom:"1px solid #e5e7eb",
      display:"flex",
      alignItems:"center",
      padding:"0 24px",
      zIndex:200,
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none"
    }}>

      {/* Brand */}
      <div style={{
        fontWeight:800,
        fontSize:"20px",
        marginRight:"30px",
        cursor:"pointer"
      }}
      onClick={()=>navigate("/crm/sales")}
      >
        Sales CRM
      </div>

      {/* Navigation Tabs */}
      <ul style={{
        listStyle:"none",
        display:"flex",
        gap:"6px",
        margin:0,
        padding:0
      }}>

        {NAV_LINKS.map(link=>(
          <li key={link.path}>
            <NavLink
              to={link.path}
              end={link.path === "/crm/sales"}
              style={({isActive})=>({
                textDecoration:"none",
                padding:"8px 14px",
                borderRadius:"8px",
                fontSize:"14px",
                fontWeight:600,
                background:isActive ? "#eef2ff" : "transparent",
                color:isActive ? "#5b4cf5" : "#6b7280"
              })}
            >
              {link.name}
            </NavLink>
          </li>
        ))}

      </ul>

      {/* Right side */}
      <div style={{
        marginLeft:"auto",
        display:"flex",
        alignItems:"center",
        gap:"12px"
      }}>

        {/* Notification */}
        <button style={{
          width:"36px",
          height:"36px",
          borderRadius:"10px",
          border:"1px solid #e5e7eb",
          background:"#f8fafc",
          cursor:"pointer"
        }}>
          🔔
        </button>

        {/* Avatar */}
        <div style={{
          width:"36px",
          height:"36px",
          borderRadius:"50%",
          background:"linear-gradient(135deg,#5b4cf5,#8b5cf6)",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          color:"#fff",
          fontWeight:700,
          fontSize:"12px"
        }}>
          SM
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            padding:"8px 14px",
            borderRadius:"8px",
            border:"none",
            background:"#fee2e2",
            color:"#dc2626",
            fontWeight:600,
            cursor:"pointer"
          }}
        >
          Logout
        </button>

      </div>

    </header>
  );
}