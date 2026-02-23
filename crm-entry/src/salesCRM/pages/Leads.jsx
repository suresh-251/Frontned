import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '../components/common';
import { leadsAPI } from '../api';
import Toast from '../utils/toast';
import { FaUsers, FaPlus, FaEnvelope, FaPhone, FaLinkedin, FaGlobe, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'New'
  });

  const sources = [
    { value: 'Website', label: 'Website' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Email Campaign', label: 'Email Campaign' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Cold Call', label: 'Cold Call' },
    { value: 'Other', label: 'Other' }
  ];

  const statuses = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Converted', label: 'Converted' },
    { value: 'Lost', label: 'Lost' }
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await leadsAPI.getAll();
      setLeads(data);
      if (data.length === 0) {
        Toast.info('No leads found. Create your first lead!');
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      Toast.error('Failed to load leads. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.create(formData);
      Toast.success('🎉 Lead created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', email: '', phone: '', source: '', status: 'New' });
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      Toast.error('Failed to create lead. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'New': { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: '🆕', text: 'text-white' },
      'Contacted': { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: '📞', text: 'text-white' },
      'Qualified': { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '✅', text: 'text-white' },
      'Converted': { bg: 'bg-gradient-to-r from-green-500 to-emerald-600', icon: '🎉', text: 'text-white' },
      'Lost': { bg: 'bg-gradient-to-r from-red-500 to-red-600', icon: '❌', text: 'text-white' }
    };
    const badge = badges[status] || { bg: 'bg-gray-100', icon: '', text: 'text-gray-800' };
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {status}
      </span>
    );
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Source', accessor: 'source' },
    {
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* Header Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100 slide-in-right">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl mr-4">
              <FaUsers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Leads Management
              </h1>
              <p className="text-gray-600 mt-2 flex items-center text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mr-2">
                  {leads.length} Total
                </span>
                Track and convert your sales leads into customers
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            variant="primary" 
            size="lg" 
            className="shadow-xl hover:shadow-2xl group"
          >
            <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'New Leads', count: leads.filter(l => l.status === 'New').length, gradient: 'from-blue-500 to-blue-700', icon: '🆕' },
          { label: 'Contacted', count: leads.filter(l => l.status === 'Contacted').length, gradient: 'from-yellow-500 to-orange-600', icon: '📞' },
          { label: 'Qualified', count: leads.filter(l => l.status === 'Qualified').length, gradient: 'from-purple-500 to-pink-600', icon: '✅' },
          { label: 'Converted', count: leads.filter(l => l.status === 'Converted').length, gradient: 'from-green-500 to-emerald-600', icon: '🎉' }
        ].map((stat, idx) => (
          <div key={idx} className={`bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-gray-900">{stat.count}</p>
              </div>
              <div className={`p-4 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg`}>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <Card className="slide-in-up border-2 border-blue-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg mr-3">
              <FaUsers className="text-white w-5 h-5" />
            </div>
            All Leads
          </h2>
          <p className="text-sm text-gray-500 mt-2 ml-11">View and manage all your leads in one place</p>
        </div>
        <Table
          columns={columns}
          data={leads}
          loading={loading}
          emptyMessage="No leads found. Create your first lead to get started! 🚀"
        />
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: '', email: '', phone: '', source: '', status: 'New' });
        }}
        title="Add New Lead"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-gray-100"
            >
              <FaTimesCircle className="mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="success" className="group">
              <FaCheckCircle className="mr-2 group-hover:scale-110 transition-transform" />
              Create Lead
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter lead's full name"
            icon={(props) => (
              <FaUsers {...props} />
            )}
          />
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="email@example.com"
            icon={(props) => (
              <FaEnvelope {...props} />
            )}
          />
          <Input
            label="Phone Number"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
            placeholder="+1 (555) 000-0000"
            icon={(props) => (
              <FaPhone {...props} />
            )}
          />
          <Select
            label="Lead Source"
            name="source"
            value={formData.source}
            onChange={handleInputChange}
            options={sources}
            required
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            options={statuses}
          />
        </form>
      </Modal>
    </div>
  );
};

export default Leads;
