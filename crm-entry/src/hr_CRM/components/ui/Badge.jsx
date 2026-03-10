export const Badge = ({ children, type = "success" }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    warning: "bg-amber-50 text-amber-600 border-amber-100",
    error: "bg-rose-50 text-rose-600 border-rose-100",
    info: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${styles[type]}`}>
      {children}
    </span>
  );
};