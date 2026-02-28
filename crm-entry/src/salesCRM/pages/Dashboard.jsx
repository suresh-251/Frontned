import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/common';
import { dealsAPI, forecastAPI, leadsAPI, accountsAPI } from '../api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FaChartLine, FaDollarSign, FaUsers, FaBuilding,
  FaTrophy, FaFire, FaArrowUp, FaArrowDown
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    totalLeads: 0,
    totalAccounts: 0,
    forecast: 0
  });

  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState([]);

  const [revenueData] = useState([
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 55000 },
    { month: 'Mar', revenue: 48000, target: 52000 },
    { month: 'Apr', revenue: 61000, target: 60000 },
    { month: 'May', revenue: 55000, target: 58000 },
    { month: 'Jun', revenue: 67000, target: 65000 },
  ]);

  const [activityData] = useState([
    { day: 'Mon', calls: 12, meetings: 5, emails: 20 },
    { day: 'Tue', calls: 15, meetings: 7, emails: 25 },
    { day: 'Wed', calls: 10, meetings: 4, emails: 18 },
    { day: 'Thu', calls: 18, meetings: 9, emails: 30 },
    { day: 'Fri', calls: 14, meetings: 6, emails: 22 },
    { day: 'Sat', calls: 5, meetings: 2, emails: 8 },
    { day: 'Sun', calls: 3, meetings: 1, emails: 5 },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [dealsData, leads, accounts, forecast] = await Promise.all([
        dealsAPI.getAll(),
        leadsAPI.getAll(),
        accountsAPI.getAll(),
        forecastAPI.getMonthly()
      ]);

      const totalValue = dealsData.reduce(
        (sum, deal) => sum + (deal.value || 0),
        0
      );

      const pipelineCount = {
        Prospecting: 0,
        Qualification: 0,
        Proposal: 0,
        Negotiation: 0,
        'Closed Won': 0
      };

      dealsData.forEach(deal => {
        if (pipelineCount.hasOwnProperty(deal.stage)) {
          pipelineCount[deal.stage]++;
        }
      });

      setPipelineData([
        { name: 'Prospecting', value: pipelineCount.Prospecting, color: '#3B82F6' },
        { name: 'Qualification', value: pipelineCount.Qualification, color: '#8B5CF6' },
        { name: 'Proposal', value: pipelineCount.Proposal, color: '#EC4899' },
        { name: 'Negotiation', value: pipelineCount.Negotiation, color: '#10B981' },
        { name: 'Closed Won', value: pipelineCount['Closed Won'], color: '#F59E0B' },
      ]);

      setStats({
        totalDeals: dealsData.length,
        totalValue,
        totalLeads: leads.length,
        totalAccounts: accounts.length,
        forecast: forecast.forecastAmount || 0
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  const StatCard = ({ title, value, icon: Icon, gradient, isCurrency, trend, trendValue }) => (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 border">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />

      <div className="p-4 relative">
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
            <Icon className="text-white" />
          </div>

          <p className="text-sm font-semibold text-gray-600 flex-1">
            {title}
          </p>

          {trend && (
            <div className={`flex items-center text-xs px-2 py-1 rounded ${
              trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
              {trendValue}%
            </div>
          )}
        </div>

        <p className="text-2xl font-bold text-center">
          {loading ? '...' : isCurrency ? formatCurrency(value) : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-3xl font-bold flex items-center">
          <FaChartLine className="mr-2 text-blue-600" />
          Sales Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          Real-time insights into your sales performance
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Deals" value={stats.totalDeals} icon={FaChartLine} gradient="from-blue-500 to-blue-700" trend="up" trendValue="12.5" />
        <StatCard title="Revenue" value={stats.totalValue} icon={FaDollarSign} gradient="from-green-500 to-emerald-700" isCurrency trend="up" trendValue="8.3" />
        <StatCard title="Leads" value={stats.totalLeads} icon={FaUsers} gradient="from-purple-500 to-pink-700" />
        <StatCard title="Accounts" value={stats.totalAccounts} icon={FaBuilding} gradient="from-orange-500 to-red-700" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-2">Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area dataKey="revenue" stroke="#3B82F6" fill="#93C5FD" />
              <Area dataKey="target" stroke="#8B5CF6" fill="#C4B5FD" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2">Pipeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pipelineData} dataKey="value" outerRadius={90}>
                {pipelineData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ACTIVITY */}
      <Card>
        <h3 className="font-semibold mb-2">Activity</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={activityData}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calls" fill="#3B82F6" />
            <Bar dataKey="meetings" fill="#8B5CF6" />
            <Bar dataKey="emails" fill="#EC4899" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
};

export default Dashboard;