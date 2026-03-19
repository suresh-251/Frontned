// Social CRM Theme Colors — derived from NAFA Barter logo
// Primary Red: #C41E3A  |  Accent Orange: #E8612D
export const colors = {
  // Primary Colors (Logo Red)
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#C41E3A', // Main primary — from logo
    600: '#A31830',
    700: '#8B1429',
    800: '#701022',
    900: '#5C0D1B',
  },

  // Accent Colors (Logo Orange)
  accent: {
    50: '#FFF7ED',
    100: '#FFEDD5',
    200: '#FED7AA',
    300: '#FDBA74',
    400: '#FB923C',
    500: '#E8612D', // Main accent — from logo
    600: '#D14E22',
    700: '#B43D19',
    800: '#923212',
    900: '#78290E',
  },

  // Success Colors
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },

  // Warning Colors
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Error Colors
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutral/Gray Colors
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Background Colors
  background: {
    main: '#FFFFFF',
    paper: '#FFFFFF',
    card: '#FFFFFF',
  },

  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    white: '#FFFFFF',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  },
};

// Helper function to get color
export const getColor = (colorPath) => {
  const path = colorPath.split('.');
  let color = colors;

  for (const key of path) {
    color = color[key];
    if (!color) return colorPath;
  }

  return color;
};
