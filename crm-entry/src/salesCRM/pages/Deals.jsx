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
    stage: 'New',
    expectedCloseDate: '',
    assignedEmployeeId: ''
  });

  const stages = [
    'New',
    'Prospect',
    'Qualification',
    'Qualified',
    'Proposal',
    'ProposalSent',
    'Negotiation',
    'ClosedWon',
    'ClosedLost'
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
      stage: 'Proposal',
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

  const formatStatus = (status) => {
    if (!status) return "—";
    return status.replace(/([A-Z])/g, ' $1').trim();
  };

  const formatLabel = (key) => {
    if (!key) return "";
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (err) {
      return "—";
    }
  };

  const getSafeValue = (obj, path, defaultValue = "—") => {
    if (!obj || !path) return defaultValue;
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current == null) return defaultValue;
      current = current[part];
    }
    
    return current ?? defaultValue;
  };

  const formatValue = (key, value) => {
    if (!value) return "—";

    if (key.toLowerCase().includes("date") || key === "createdAt") {
      try {
        const date = new Date(value);
        return date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
        .replace("am", "AM")
        .replace("pm", "PM");
      } catch {
        return "—";
      }
    }

    if (key === "value") {
      return `₹ ${Number(value).toLocaleString("en-IN")}`;
    }

    if (typeof value === "object") {
      return "—";
    }

    return value;
  };

  const hiddenFields = ["lead"];

  const columns = [
    { header: "Deal ID", accessor: "id" },
    {
      header: "Lead Name",
      render: (row) => getSafeValue(row, 'leadName')
    },
    {
      header: "Phone",
      render: (row) => getSafeValue(row, 'phone')
    },
    {
      header: "Value",
      render: (row) => {
        const val = getSafeValue(row, 'value');
        return val !== "—" ? `₹ ${Number(val).toLocaleString("en-IN")}` : val;
      }
    },
    {
      header: "Stage",
      render: (row) => {
        const stage = getSafeValue(row, 'stage');
        return stage !== "—" ? formatStatus(stage) : stage;
      }
    },
    {
      header: "Status",
      render: (row) => {
        const status = getSafeValue(row, 'status');
        return status !== "—" ? formatStatus(status) : status;
      }
    },
    {
      header: "Expected Close Date",
      render: (row) => formatDate(row.expectedCloseDate)
    },
    {
      header: "Score",
      render: (row) => getSafeValue(row, 'score')
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
        {/* Add Deal button hidden for now */}
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
            options={stages.map(s => ({
              value: s,
              label: formatStatus(s)
            }))}
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
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {Object.entries(selectedDeal)
              .filter(([key]) => !hiddenFields.includes(key))
              .map(([key, value]) => (
                <React.Fragment key={key}>
                  <div className="text-sm font-semibold text-gray-600">
                    {formatLabel(key)}
                  </div>
                  <div className="text-sm text-gray-800 break-words">
                    {formatValue(key, value)}
                  </div>
                </React.Fragment>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Deals;