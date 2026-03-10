export const Card = ({ children, title, subtitle, className = "" }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className=" py-4 border-b border-slate-50">
          {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};