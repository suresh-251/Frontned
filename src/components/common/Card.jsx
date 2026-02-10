export default function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
        hover ? "hover:shadow-lg hover:border-gray-300" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
