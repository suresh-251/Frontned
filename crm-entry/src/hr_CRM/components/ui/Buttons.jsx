import React from "react";

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 shadow-lg",
  secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
  danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
  ghost: "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
};

export const Button = ({ children, variant = "primary", className = "", icon: Icon, ...props }) => {
  return (
    <button 
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};