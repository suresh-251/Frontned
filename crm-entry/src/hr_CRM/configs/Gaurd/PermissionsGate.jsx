import React from 'react';
import { hasPermission } from '../auth.utils';

export default function PermissionGate({ permission, children }) {
  // If the string isn't in the token, the children (buttons/links) won't exist
  if (!hasPermission(permission)) return null;
  
  return <>{children}</>;
}