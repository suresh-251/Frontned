import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layout/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import Leads from '../pages/Leads';
import LeadManager from '../pages/LeadManager';
import Deals from '../pages/Deals';
import Accounts from '../pages/Accounts';
import Activities from '../pages/Activities';
import Contacts from '../pages/Contacts';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="lead-manager" element={<LeadManager />} />
        <Route path="deals" element={<Deals />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="activities" element={<Activities />} />
      </Route>
      <Route path="*" element={<Navigate to="/crm/sales" replace />} />
    </Routes>
  );
};

export default AppRouter;