import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import Leads from '../pages/Leads';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
         <Route path="leads" element={<Leads />} />
      </Route>
      <Route path="*" element={<Navigate to="/crm/sales" replace />} />
    </Routes>
  );
};

export default AppRouter;