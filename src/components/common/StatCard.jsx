import { Link } from "react-router-dom";

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendDirection = "up",
  color = "blue",
  icon,
  to 
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
    red: "from-red-500 to-red-600"
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600"
  };

  const CardContent = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
            {trend && (
              <span className={`text-sm font-semibold ${trendColors[trendDirection]} flex items-center gap-1`}>
                {trendDirection === "up" && "↑"}
                {trendDirection === "down" && "↓"}
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-md`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to}>{CardContent}</Link>;
  }

  return CardContent;
}
