import React from 'react';

const Input = ({ 
  label, 
  name,
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  icon: Icon,
  helperText
}) => {
  return (
    <div className={`mb-5 ${className} slide-in-right`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border-2 rounded-lg
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 focus:ring-red-400 bg-red-50' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'}
            focus:outline-none focus:ring-2 
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-all duration-200
            hover:border-blue-300
            placeholder:text-gray-400
            text-gray-900 font-medium
          `}
        />
        {/* Animated border */}
        <div className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${error ? 'hidden' : 'group-focus-within:w-full'}`}></div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center slide-in-left">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
