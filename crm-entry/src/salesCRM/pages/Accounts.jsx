import { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, Input, Select } from '../components/common';
import accountsAPI from '../api/accounts.api';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    phone: '',
    industry: ''
  });

  const industries = [
    'Healthcare',
    'Technology',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Construction',
    'Information Technology',
    'Other'
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsAPI.getAll();
      setAccounts(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      website: '',
      phone: '',
      industry: ''
    });
    setSelectedAccount(null);
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
      if (selectedAccount) {
        await accountsAPI.update(selectedAccount.id, formData);
      } else {
        await accountsAPI.create(formData); // POST to DB
      }

      setIsModalOpen(false);
      resetForm();
      fetchAccounts(); // refresh table
    } catch (err) {
      console.error(err);
      alert("Failed to save account");
    }
  };

  const handleEdit = (account) => {
    setSelectedAccount(account);
    setFormData({
      companyName: account.companyName,
      website: account.website,
      phone: account.phone,
      industry: account.industry
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this account?")) {
      try {
        await accountsAPI.delete(id);
        fetchAccounts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openView = async (id) => {
    try {
      const data = await accountsAPI.getById(id);
      setSelectedAccount(data);
      setIsViewOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Company Name", accessor: "companyName" },
    { header: "Industry", accessor: "industry" },
    { header: "Website", accessor: "website" },
    {
      header: "Created",
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString()
          : "-"
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => openView(row.id)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
            Edit
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
        <h1 className="text-3xl font-bold">Accounts</h1>
        <Button onClick={() => setIsModalOpen(true)}>Add Account</Button>
      </div>

      <Card>
        <Table columns={columns} data={accounts} loading={loading} />
      </Card>

      {/* ADD / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedAccount ? "Edit Account" : "Add New Account"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">

          <Input
            label="Company Name"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            required
          />

          <Select
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            options={industries.map(i => ({ value: i, label: i }))}
            required
          />

          <div className="flex justify-end">
            <Button type="submit">
              {selectedAccount ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Account Details"
      >
        {selectedAccount && (
          <div className="space-y-2">
            <p><b>ID:</b> {selectedAccount.id}</p>
            <p><b>Company:</b> {selectedAccount.companyName}</p>
            <p><b>Industry:</b> {selectedAccount.industry}</p>
            <p><b>Website:</b> {selectedAccount.website}</p>
            <p><b>Phone:</b> {selectedAccount.phone}</p>
            <p>
              <b>Created:</b>{" "}
              {selectedAccount.createdAt
                ? new Date(selectedAccount.createdAt).toLocaleString()
                : "-"}
            </p>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Accounts;