import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  headerAction,
  className = '',
  padding = true,
  hover = false,
  onClick,
  gradient = false
}) => {
  const baseStyles = 'bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden';
  const hoverStyles = hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : '';
  const paddingStyles = padding ? 'p-6' : '';
  
  return (
    <div 
      className={`${baseStyles} ${hoverStyles} ${className} slide-in-up`}
      onClick={onClick}
    >
      {(title || headerAction) && (
        <div className={`flex items-center justify-between mb-4 pb-4 ${gradient ? 'bg-gradient-to-r from-blue-600 to-purple-600 -m-6 p-6 mb-0' : 'border-b border-gray-100'}`}>
          <div>
            {title && (
              <h3 className={`text-xl font-bold flex items-center ${gradient ? 'text-white' : 'text-gray-900'}`}>
                {!gradient && <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></span>}
                {gradient && (
                  <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {title}
              </h3>
            )}
            {subtitle && <p className={`text-sm mt-2 ${gradient ? 'text-blue-100 ml-8' : 'text-gray-500 ml-4'}`}>{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={paddingStyles}>
        {children}
      </div>
    </div>
  );
};

export default Card;
