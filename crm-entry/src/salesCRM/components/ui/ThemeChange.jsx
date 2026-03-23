import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

const themes = [
  { id: "light", name: "Light", color: "#f8fafc" },
  { id: "dark", name: "Dark", color: "#232329" },
];

const allowedThemeIds = new Set(themes.map((theme) => theme.id));

export default function ThemeChange() {
  const [currentTheme, setCurrentTheme] = useState(
    allowedThemeIds.has(localStorage.getItem("sales-crm-theme"))
      ? localStorage.getItem("sales-crm-theme")
      : "light"
  );

  useEffect(() => {
    if (!allowedThemeIds.has(currentTheme)) {
      setCurrentTheme("light");
      return;
    }
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("sales-crm-theme", currentTheme);
  }, [currentTheme]);

  return (
    <div className="p-2 max-h-[200px] overflow-y-auto custom-scrollbar">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
        Theme Gallery
      </p>
      <div className="grid grid-cols-1 gap-1">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setCurrentTheme(t.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
              currentTheme === t.id
                ? "bg-indigo-500/10 text-indigo-500"
                : "text-slate-500 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-sm"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
            </div>
            {currentTheme === t.id && <Check size={12} />}
          </button>
        ))}
      </div>
    </div>
  );
}
