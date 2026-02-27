// import React, { useState, useEffect } from 'react';
// import { Card, Button } from '../components/common';
// import { dealsAPI, forecastAPI, leadsAPI, accountsAPI } from '../api';
// import { 
//   LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
// } from 'recharts';
// import { 
//   FaChartLine, FaDollarSign, FaUsers, FaBuilding, 
//   FaTrophy, FaFire, FaArrowUp, FaArrowDown, FaCheck 
// } from 'react-icons/fa';

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalDeals: 0,
//     totalValue: 0,
//     totalLeads: 0,
//     totalAccounts: 0,
//     forecast: 0
//   });
//   const [loading, setLoading] = useState(true);
//   const [deals, setDeals] = useState([]);

//   // Chart data
//   const [revenueData, setRevenueData] = useState([
//     { month: 'Jan', revenue: 45000, target: 50000 },
//     { month: 'Feb', revenue: 52000, target: 55000 },
//     { month: 'Mar', revenue: 48000, target: 52000 },
//     { month: 'Apr', revenue: 61000, target: 60000 },
//     { month: 'May', revenue: 55000, target: 58000 },
//     { month: 'Jun', revenue: 67000, target: 65000 },
//   ]);

//   const [pipelineData, setPipelineData] = useState([
//     { name: 'Prospecting', value: 15, color: '#3B82F6' },
//     { name: 'Qualification', value: 25, color: '#8B5CF6' },
//     { name: 'Proposal', value: 20, color: '#EC4899' },
//     { name: 'Negotiation', value: 30, color: '#10B981' },
//     { name: 'Closed Won', value: 10, color: '#F59E0B' },
//   ]);

//   const [activityData, setActivityData] = useState([
//     { day: 'Mon', calls: 12, meetings: 5, emails: 20 },
//     { day: 'Tue', calls: 15, meetings: 7, emails: 25 },
//     { day: 'Wed', calls: 10, meetings: 4, emails: 18 },
//     { day: 'Thu', calls: 18, meetings: 9, emails: 30 },
//     { day: 'Fri', calls: 14, meetings: 6, emails: 22 },
//     { day: 'Sat', calls: 5, meetings: 2, emails: 8 },
//     { day: 'Sun', calls: 3, meetings: 1, emails: 5 },
//   ]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       setLoading(true);
//       const [dealsData, leads, accounts, forecast] = await Promise.all([
//         dealsAPI.getAll(),
//         leadsAPI.getAll(),
//         accountsAPI.getAll(),
//         forecastAPI.getMonthly()
//       ]);

//       setDeals(dealsData);
//       const totalValue = dealsData.reduce((sum, deal) => sum + (deal.value || 0), 0);

//       // Update pipeline data based on real deals
//       const pipelineCount = {
//         'Prospecting': 0,
//         'Qualification': 0,
//         'Proposal': 0,
//         'Negotiation': 0,
//         'Closed Won': 0
//       };
      
//       dealsData.forEach(deal => {
//         if (pipelineCount.hasOwnProperty(deal.stage)) {
//           pipelineCount[deal.stage]++;
//         }
//       });

//       setPipelineData([
//         { name: 'Prospecting', value: pipelineCount['Prospecting'], color: '#3B82F6' },
//         { name: 'Qualification', value: pipelineCount['Qualification'], color: '#8B5CF6' },
//         { name: 'Proposal', value: pipelineCount['Proposal'], color: '#EC4899' },
//         { name: 'Negotiation', value: pipelineCount['Negotiation'], color: '#10B981' },
//         { name: 'Closed Won', value: pipelineCount['Closed Won'], color: '#F59E0B' },
//       ]);

//       setStats({
//         totalDeals: dealsData.length,
//         totalValue,
//         totalLeads: leads.length,
//         totalAccounts: accounts.length,
//         forecast: forecast.forecastAmount || 0
//       });
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
//   };

//   const StatCard = ({ title, value, icon: Icon, gradient, isCurrency = false, trend, trendValue }) => (
//     <div className={`relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100`}>
//       {/* Gradient Background */}
//       <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`}></div>
      
//       <div className="relative p-6">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-4">
//           <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
//             <Icon className="w-6 h-6 text-white" />
//           </div>
//           {trend && (
//             <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//               {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
//               <span>{trendValue}%</span>
//             </div>
//           )}
//         </div>

//         {/* Content */}
//         <div>
//           <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
//             {title}
//           </p>
//           <p className="text-4xl font-extrabold text-gray-900">
//             {loading ? (
//               <span className="inline-block w-24 h-10 bg-gray-200 rounded-lg shimmer"></span>
//             ) : (
//               isCurrency ? formatCurrency(value) : value.toLocaleString()
//             )}
//           </p>
//         </div>

//         {/* Decorative Line */}
//         <div className={`mt-4 h-1 w-20 rounded-full bg-gradient-to-r ${gradient}`}></div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="space-y-6 fade-in">
//       {/* Header */}
//       <div className="slide-in-right bg-white rounded-2xl shadow-md p-6 border border-gray-100">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
//               <FaChartLine className="text-blue-600 mr-4" />
//               Sales Dashboard
//             </h1>
//             <p className="text-gray-600 mt-3 flex items-center text-lg">
//               <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold mr-3">
//                 <FaCheck className="mr-1" /> Live
//               </span>
//               Real-time insights into your sales performance
//             </p>
//           </div>
//           <div className="hidden lg:flex items-center space-x-3">
//             <div className="text-right">
//               <p className="text-sm text-gray-500">Current Month</p>
//               <p className="text-2xl font-bold text-gray-900">February 2026</p>
//             </div>
//             <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
//               <FaTrophy className="w-8 h-8 text-yellow-300" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           title="Total Deals"
//           value={stats.totalDeals}
//           icon={FaChartLine}
//           gradient="from-blue-500 to-blue-700"
//           trend="up"
//           trendValue="12.5"
//         />
        
//         <StatCard
//           title="Total Revenue"
//           value={stats.totalValue}
//           icon={FaDollarSign}
//           gradient="from-green-500 to-emerald-700"
//           isCurrency
//           trend="up"
//           trendValue="8.3"
//         />

//         <StatCard
//           title="Active Leads"
//           value={stats.totalLeads}
//           icon={FaUsers}
//           gradient="from-purple-500 to-pink-700"
//           trend="up"
//           trendValue="15.2"
//         />

//         <StatCard
//           title="Total Accounts"
//           value={stats.totalAccounts}
//           icon={FaBuilding}
//           gradient="from-orange-500 to-red-700"
//           trend="down"
//           trendValue="2.1"
//         />
//       </div>

//       {/* Charts Row 1 */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Revenue Trend Chart */}
//         <Card className="slide-in-up">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h3 className="text-2xl font-bold text-gray-900 flex items-center">
//                 <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3">
//                   <FaFire className="text-white w-5 h-5" />
//                 </div>
//                 Revenue Trend
//               </h3>
//               <p className="text-sm text-gray-500 mt-1 ml-12">Monthly performance vs target</p>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={300}>
//             <AreaChart data={revenueData}>
//               <defs>
//                 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
//                   <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//                 </linearGradient>
//                 <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
//                   <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//               <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px', fontWeight: '600' }} />
//               <YAxis stroke="#6B7280" style={{ fontSize: '12px', fontWeight: '600' }} />
//               <Tooltip 
//                 contentStyle={{ 
//                   backgroundColor: '#fff', 
//                   border: '2px solid #E5E7EB',
//                   borderRadius: '12px',
//                   boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
//                 }}
//               />
//               <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
//               <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
//               <Area type="monotone" dataKey="target" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorTarget)" />
//             </AreaChart>
//           </ResponsiveContainer>
//         </Card>

//         {/* Pipeline Distribution */}
//         <Card className="slide-in-up">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h3 className="text-2xl font-bold text-gray-900 flex items-center">
//                 <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
//                   <FaChartLine className="text-white w-5 h-5" />
//                 </div>
//                 Deal Pipeline
//               </h3>
//               <p className="text-sm text-gray-500 mt-1 ml-12">Distribution by stage</p>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={pipelineData}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
//                 outerRadius={100}
//                 fill="#8884d8"
//                 dataKey="value"
//               >
//                 {pipelineData.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={entry.color} />
//                 ))}
//               </Pie>
//               <Tooltip 
//                 contentStyle={{ 
//                   backgroundColor: '#fff', 
//                   border: '2px solid #E5E7EB',
//                   borderRadius: '12px',
//                   boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
//                 }}
//               />
//             </PieChart>
//           </ResponsiveContainer>
//         </Card>
//       </div>

//       {/* Charts Row 2 */}
//       <div className="grid grid-cols-1 gap-6">
//         {/* Activity Chart */}
//         <Card className="slide-in-up">
//           <div className="flex items-center justify-between mb-6">
//             <div>
//               <h3 className="text-2xl font-bold text-gray-900 flex items-center">
//                 <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg mr-3">
//                   <FaUsers className="text-white w-5 h-5" />
//                 </div>
//                 Weekly Activity
//               </h3>
//               <p className="text-sm text-gray-500 mt-1 ml-12">Calls, meetings, and emails</p>
//             </div>
//           </div>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={activityData}>
//               <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//               <XAxis dataKey="day" stroke="#6B7280" style={{ fontSize: '12px', fontWeight: '600' }} />
//               <YAxis stroke="#6B7280" style={{ fontSize: '12px', fontWeight: '600' }} />
//               <Tooltip 
//                 contentStyle={{ 
//                   backgroundColor: '#fff', 
//                   border: '2px solid #E5E7EB',
//                   borderRadius: '12px',
//                   boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
//                 }}
//               />
//               <Legend wrapperStyle={{ fontSize: '14px', fontWeight: '600' }} />
//               <Bar dataKey="calls" fill="#3B82F6" radius={[8, 8, 0, 0]} />
//               <Bar dataKey="meetings" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
//               <Bar dataKey="emails" fill="#EC4899" radius={[8, 8, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </Card>
//       </div>

//       {/* Monthly Forecast */}
//       <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl slide-in-up">
//         <div className="absolute inset-0 bg-black opacity-10"></div>
//         <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        
//         <div className="relative p-10 text-center">
//           <div className="flex items-center justify-center mb-6">
//             <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
//               <FaTrophy className="w-12 h-12 text-yellow-300 animate-pulse" />
//             </div>
//           </div>
//           <p className="text-xl font-bold text-white/90 mb-4 uppercase tracking-wider">
//             Monthly Revenue Forecast
//           </p>
//           <p className="text-7xl font-black text-white drop-shadow-2xl mb-4">
//             {loading ? (
//               <span className="inline-block w-64 h-20 bg-white/20 rounded-2xl shimmer"></span>
//             ) : (
//               formatCurrency(stats.forecast)
//             )}
//           </p>
//           <p className="text-white/80 text-lg font-semibold">
//             🎯 Target Achievement: <span className="text-green-300 font-bold">95%</span>
//           </p>
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <Card className="slide-in-up">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-2xl font-bold text-gray-900 flex items-center">
//             <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg mr-3">
//               <FaFire className="text-white w-5 h-5" />
//             </div>
//             Quick Actions
//           </h3>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <Button 
//             variant="primary" 
//             onClick={() => window.location.href = '/crm/sales/leads'}
//             className="group hover:shadow-2xl"
//             size="lg"
//           >
//             <FaUsers className="mr-2 group-hover:rotate-12 transition-transform" />
//             Add Lead
//           </Button>
//           <Button 
//             variant="success" 
//             onClick={() => window.location.href = '/crm/sales/deals'}
//             className="group hover:shadow-2xl"
//             size="lg"
//           >
//             <FaChartLine className="mr-2 group-hover:rotate-12 transition-transform" />
//             Add Deal
//           </Button>
//           <Button 
//             variant="warning" 
//             onClick={() => window.location.href = '/crm/sales/accounts'}
//             className="group hover:shadow-2xl"
//             size="lg"
//           >
//             <FaBuilding className="mr-2 group-hover:rotate-12 transition-transform" />
//             Add Account
//           </Button>
//           <Button 
//             variant="outline" 
//             onClick={() => fetchDashboardData()}
//             className="group hover:shadow-2xl"
//             size="lg"
//           >
//             <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh Data
//           </Button>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default Dashboard;




import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/common';
import { dealsAPI, forecastAPI, leadsAPI, accountsAPI } from '../api';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  FaChartLine, FaDollarSign, FaUsers, FaBuilding, 
  FaTrophy, FaFire, FaArrowUp, FaArrowDown, FaCheck 
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
  const [deals, setDeals] = useState([]);

  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', revenue: 45000, target: 50000 },
    { month: 'Feb', revenue: 52000, target: 55000 },
    { month: 'Mar', revenue: 48000, target: 52000 },
    { month: 'Apr', revenue: 61000, target: 60000 },
    { month: 'May', revenue: 55000, target: 58000 },
    { month: 'Jun', revenue: 67000, target: 65000 },
  ]);

  const [pipelineData, setPipelineData] = useState([]);
  const [activityData, setActivityData] = useState([
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

      setDeals(dealsData);
      const totalValue = dealsData.reduce((sum, deal) => sum + (deal.value || 0), 0);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  const StatCard = ({ title, value, icon: Icon, gradient, isCurrency = false, trend, trendValue }) => (
    <div className="relative rounded-xl bg-white shadow-md hover:shadow-lg transition-all border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br opacity-5 rounded-xl"></div>

      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[11px] font-semibold ${
              trend === 'up'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
              <span>{trendValue}%</span>
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
          {title}
        </p>

        <p className="text-xl font-bold text-gray-900">
          {loading ? '...' : isCurrency ? formatCurrency(value) : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 text-sm">
      
      {/* HEADER */}
      <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <FaChartLine className="mr-3 text-blue-600" />
              Sales Dashboard
            </h1>
            <p className="text-gray-500 text-xs mt-1">
              Real-time insights into your sales performance
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Deals" value={stats.totalDeals} icon={FaChartLine} gradient="from-blue-500 to-blue-700" trend="up" trendValue="12.5" />
        <StatCard title="Total Revenue" value={stats.totalValue} icon={FaDollarSign} gradient="from-green-500 to-emerald-700" isCurrency trend="up" trendValue="8.3" />
        <StatCard title="Active Leads" value={stats.totalLeads} icon={FaUsers} gradient="from-purple-500 to-pink-700" trend="up" trendValue="15.2" />
        <StatCard title="Total Accounts" value={stats.totalAccounts} icon={FaBuilding} gradient="from-orange-500 to-red-700" trend="down" trendValue="2.1" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-lg font-semibold mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#93C5FD" />
              <Area type="monotone" dataKey="target" stroke="#8B5CF6" fill="#C4B5FD" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">Deal Pipeline</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pipelineData} dataKey="value" outerRadius={80}>
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ACTIVITY */}
      <Card>
        <h3 className="text-lg font-semibold mb-3">Weekly Activity</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
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