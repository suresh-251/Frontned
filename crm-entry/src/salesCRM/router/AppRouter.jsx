import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import Leads from '../pages/Leads';
import Deals from '../pages/Deals';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="leads" replace />} />
        <Route path="leads" element={<Leads />} />
        <Route path="deals" element={<Deals />} />
      </Route>
      <Route path="*" element={<Navigate to="/crm/sales" replace />} />
    </Routes>
  );
};

export default AppRouter;
