export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  onClick, 
  disabled = false,
  type = "button",
  className = "",
  leftIcon,
  rightIcon,
  fullWidth = false
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    link: "text-blue-600 hover:text-blue-700 underline focus:ring-blue-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
}
