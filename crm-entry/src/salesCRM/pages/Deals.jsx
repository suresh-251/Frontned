import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '../components/common';
import { dealsAPI } from '../api';
import Toast from '../utils/toast';
import { FaChartLine, FaDollarSign, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTrophy } from 'react-icons/fa';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'Prospecting'
  });

  const stages = [
    { value: 'Prospecting', label: 'Prospecting' },
    { value: 'Qualification', label: 'Qualification' },
    { value: 'Proposal', label: 'Proposal' },
    { value: 'Negotiation', label: 'Negotiation' },
    { value: 'Closed Won', label: 'Closed Won' },
    { value: 'Closed Lost', label: 'Closed Lost' }
  ];

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await dealsAPI.getAll();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
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
      if (selectedDeal) {
        await dealsAPI.updateStage(selectedDeal.id, formData.stage);
      } else {
        await dealsAPI.create(formData);
      }
      setIsModalOpen(false);
      setFormData({ title: '', value: '', stage: 'Prospecting' });
      setSelectedDeal(null);
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Failed to save deal. Please try again.');
    }
  };

  const handleUpdateStage = async (deal, newStage) => {
    try {
      await dealsAPI.updateStage(deal.id, newStage);
      fetchDeals();
    } catch (error) {
      console.error('Error updating deal stage:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await dealsAPI.delete(id);
        fetchDeals();
      } catch (error) {
        console.error('Error deleting deal:', error);
        alert('Failed to delete deal. Please try again.');
      }
    }
  };

  const getStageBadge = (stage) => {
    const colors = {
      'Prospecting': 'bg-blue-100 text-blue-800',
      'Qualification': 'bg-yellow-100 text-yellow-800',
      'Proposal': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[stage] || 'bg-gray-100 text-gray-800'}`}>
        {stage}
      </span>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { 
      header: 'Value', 
      render: (row) => <span className="font-semibold text-green-600">{formatCurrency(row.value)}</span>
    },
    {
      header: 'Stage',
      render: (row) => (
        <select
          value={row.stage}
          onChange={(e) => handleUpdateStage(row, e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {stages.map(stage => (
            <option key={stage.value} value={stage.value}>{stage.label}</option>
          ))}
        </select>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex justify-between items-center slide-in-right">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center">
            <svg className="w-10 h-10 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Deals
          </h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Manage your sales pipeline
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="success" size="lg" className="shadow-xl">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Deal
        </Button>
      </div>

      <Card gradient className="slide-in-up">
        <Table
          columns={columns}
          data={deals}
          loading={loading}
          emptyMessage="No deals found. Create your first deal!"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDeal(null);
          setFormData({ title: '', value: '', stage: 'Prospecting' });
        }}
        title={selectedDeal ? '📝 Update Deal Stage' : '💰 Add New Deal'}
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-gray-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant={selectedDeal ? 'warning' : 'success'}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {selectedDeal ? 'Update Deal' : 'Create Deal'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-1">
          <Input
            label="Deal Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter deal title"
            icon={(props) => (
              <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          />
          <Input
            label="Deal Value"
            name="value"
            type="number"
            value={formData.value}
            onChange={handleInputChange}
            required
            placeholder="Enter deal value"
            icon={(props) => (
              <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <Select
            label="Stage"
            name="stage"
            value={formData.stage}
            onChange={handleInputChange}
            options={stages}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Deals;
