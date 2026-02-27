import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '../components/common';
import dealsAPI from '../api/deals.api';

const Deals = () => {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [formData, setFormData] = useState({
    accountId: '',
    contactId: '',
    title: '',
    value: '',
    stage: 'Prospecting',
    expectedCloseDate: '',
    assignedEmployeeId: ''
  });

  const stages = [
    'Prospecting',
    'Qualification',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost'
  ];

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await dealsAPI.getAll();
      setDeals(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load deals");
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

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        accountId: Number(formData.accountId),
        contactId: Number(formData.contactId),
        title: formData.title,
        value: Number(formData.value),
        stage: formData.stage,
        expectedCloseDate: formData.expectedCloseDate
          ? new Date(formData.expectedCloseDate).toISOString()
          : null,
        assignedEmployeeId: Number(formData.assignedEmployeeId),
        createdAt: new Date().toISOString()
      };

      await dealsAPI.create(payload);

      setIsModalOpen(false);
      fetchDeals();
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to create deal");
    }
  };

  const resetForm = () => {
    setFormData({
      accountId: '',
      contactId: '',
      title: '',
      value: '',
      stage: 'Prospecting',
      expectedCloseDate: '',
      assignedEmployeeId: ''
    });
  };

  const handleUpdateStage = async (deal, newStage) => {
    try {
      await dealsAPI.updateStage(deal.id, newStage);
      fetchDeals();
    } catch (err) {
      console.error(err);
      alert("Failed to update stage");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this deal?")) {
      try {
        await dealsAPI.delete(id);
        fetchDeals();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openView = async (id) => {
    try {
      const data = await dealsAPI.getById(id);
      setSelectedDeal(data);
      setIsViewOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Title", accessor: "title" },
    { header: "Value", accessor: "value" },
    {
      header: "Stage",
      render: (row) => (
        <select
          value={row.stage}
          onChange={(e) => handleUpdateStage(row, e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {stages.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openView(row.id)}>
            View
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deals</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Deal</Button>
      </div>

      <Card>
        <Table columns={columns} data={deals} loading={loading} />
      </Card>

      {/* ADD DEAL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Deal"
      >
        <form onSubmit={handleCreate} className="space-y-3">

          <Input label="Account ID" name="accountId" type="number" value={formData.accountId} onChange={handleInputChange} required />
          <Input label="Contact ID" name="contactId" type="number" value={formData.contactId} onChange={handleInputChange} required />
          <Input label="Title" name="title" value={formData.title} onChange={handleInputChange} required />
          <Input label="Value" name="value" type="number" value={formData.value} onChange={handleInputChange} required />

          <Select
            label="Stage"
            name="stage"
            value={formData.stage}
            onChange={handleInputChange}
            options={stages.map(s => ({ value: s, label: s }))}
          />

          <Input
            label="Expected Close Date"
            name="expectedCloseDate"
            type="datetime-local"
            value={formData.expectedCloseDate}
            onChange={handleInputChange}
          />

          <Input
            label="Assigned Employee ID"
            name="assignedEmployeeId"
            type="number"
            value={formData.assignedEmployeeId}
            onChange={handleInputChange}
            required
          />

          <div className="flex justify-end">
            <Button type="submit">Create Deal</Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Deal Details"
      >
        {selectedDeal && (
          <div className="space-y-2">
            {Object.entries(selectedDeal).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b py-1">
                <span className="font-semibold">{key}</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Deals;