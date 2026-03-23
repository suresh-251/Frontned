import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import Leads from '../pages/Leads';
import Deals from '../pages/Deals';
import Accounts from '../pages/Accounts';
import Calendar from '../pages/Calendar';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="leads" replace />} />
        <Route path="leads" element={<Leads />} />
        <Route path="deals" element={<Deals />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="calendar" element={<Calendar />} />
      </Route>
      <Route path="*" element={<Navigate to="/crm/sales" replace />} />
    </Routes>
  );
};

export default AppRouter;
