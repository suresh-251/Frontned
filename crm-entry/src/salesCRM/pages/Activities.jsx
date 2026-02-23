import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '../components/common';
import { activitiesAPI, dealsAPI } from '../api';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    dealId: '',
    type: '',
    description: '',
    dueDate: '',
    status: 'Pending'
  });

  const activityTypes = [
    { value: 'Call', label: 'Call' },
    { value: 'Email', label: 'Email' },
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Task', label: 'Task' },
    { value: 'Reminder', label: 'Reminder' }
  ];

  const statuses = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchActivities();
    fetchDeals();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await activitiesAPI.getAll();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const data = await dealsAPI.getAll();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
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
      await activitiesAPI.create({
        ...formData,
        dealId: parseInt(formData.dealId)
      });
      setIsModalOpen(false);
      setFormData({ dealId: '', type: '', description: '', dueDate: '', status: 'Pending' });
      fetchActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Failed to create activity. Please try again.');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await activitiesAPI.updateStatus(id, newStatus);
      fetchActivities();
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activitiesAPI.delete(id);
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { header: 'Type', accessor: 'type' },
    { header: 'Description', accessor: 'description' },
    { 
      header: 'Due Date', 
      render: (row) => new Date(row.dueDate).toLocaleDateString()
    },
    {
      header: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleStatusUpdate(row.id, e.target.value)}
          className="px-2 py-1 border rounded text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
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

  const dealOptions = deals.map(deal => ({
    value: deal.id.toString(),
    label: deal.title
  }));

  return (
    <div className="p-6 space-y-6 fade-in">
      <div className="flex justify-between items-center slide-in-right">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center">
            <svg className="w-10 h-10 mr-3 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Activities
          </h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
            Manage your sales activities and tasks
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="warning" size="lg" className="shadow-xl">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Activity
        </Button>
      </div>

      <Card gradient className="slide-in-up">
        <Table
          columns={columns}
          data={activities}
          loading={loading}
          emptyMessage="No activities found. Create your first activity!"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ dealId: '', type: '', description: '', dueDate: '', status: 'Pending' });
        }}
        title="📅 Add New Activity"
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
            <Button onClick={handleSubmit} variant="success">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Create Activity
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-1">
          <Select
            label="Deal"
            name="dealId"
            value={formData.dealId}
            onChange={handleInputChange}
            options={dealOptions}
            required
          />
          <Select
            label="Activity Type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            options={activityTypes}
            required
          />
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Enter activity description"
            icon={(props) => (
              <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          />
          <Input
            label="Due Date"
            name="dueDate"
            type="datetime-local"
            value={formData.dueDate}
            onChange={handleInputChange}
            required
            icon={(props) => (
              <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
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

export default Activities;
