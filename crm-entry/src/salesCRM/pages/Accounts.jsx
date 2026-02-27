// import React, { useState, useEffect } from 'react';
// import { Card, Button, Table, Modal, Input, Select } from '../components/common';
// import { accountsAPI } from '../api';

// const Accounts = () => {
//   const [accounts, setAccounts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedAccount, setSelectedAccount] = useState(null);
//   const [formData, setFormData] = useState({
//     companyName: '',
//     website: '',
//     phone: '',
//     industry: ''
//   });

//   const industries = [
//     { value: 'Healthcare', label: 'Healthcare' },
//     { value: 'Technology', label: 'Technology' },
//     { value: 'Finance', label: 'Finance' },
//     { value: 'Retail', label: 'Retail' },
//     { value: 'Manufacturing', label: 'Manufacturing' },
//     { value: 'Education', label: 'Education' },
//     { value: 'Other', label: 'Other' }
//   ];

//   useEffect(() => {
//     fetchAccounts();
//   }, []);

//   const fetchAccounts = async () => {
//     try {
//       setLoading(true);
//       const data = await accountsAPI.getAll();
//       setAccounts(data);
//     } catch (error) {
//       console.error('Error fetching accounts:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (selectedAccount) {
//         await accountsAPI.update(selectedAccount.id, formData);
//       } else {
//         await accountsAPI.create(formData);
//       }
//       setIsModalOpen(false);
//       setFormData({ companyName: '', website: '', phone: '', industry: '' });
//       setSelectedAccount(null);
//       fetchAccounts();
//     } catch (error) {
//       console.error('Error saving account:', error);
//       alert('Failed to save account. Please try again.');
//     }
//   };

//   const handleEdit = (account) => {
//     setSelectedAccount(account);
//     setFormData({
//       companyName: account.companyName,
//       website: account.website,
//       phone: account.phone,
//       industry: account.industry
//     });
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this account?')) {
//       try {
//         await accountsAPI.delete(id);
//         fetchAccounts();
//       } catch (error) {
//         console.error('Error deleting account:', error);
//         alert('Failed to delete account. Please try again.');
//       }
//     }
//   };

//   const columns = [
//     { header: 'Company Name', accessor: 'companyName' },
//     { header: 'Website', accessor: 'website' },
//     { header: 'Phone', accessor: 'phone' },
//     { header: 'Industry', accessor: 'industry' },
//     {
//       header: 'Actions',
//       render: (row) => (
//         <div className="flex space-x-2">
//           <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
//             Edit
//           </Button>
//           <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
//             Delete
//           </Button>
//         </div>
//       )
//     }
//   ];

//   return (
//     <div className="p-6 space-y-6 fade-in">
//       <div className="flex justify-between items-center slide-in-right">
//         <div>
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
//             <svg className="w-10 h-10 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//             </svg>
//             Accounts
//           </h1>
//           <p className="text-gray-600 mt-2 flex items-center">
//             <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
//             Manage your company accounts
//           </p>
//         </div>
//         <Button onClick={() => setIsModalOpen(true)} size="lg" className="shadow-xl">
//           <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//           </svg>
//           Add Account
//         </Button>
//       </div>

//       <Card gradient className="slide-in-up">
//         <Table
//           columns={columns}
//           data={accounts}
//           loading={loading}
//           emptyMessage="No accounts found. Create your first account!"
//         />
//       </Card>

//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => {
//           setIsModalOpen(false);
//           setSelectedAccount(null);
//           setFormData({ companyName: '', website: '', phone: '', industry: '' });
//         }}
//         title={selectedAccount ? '✏️ Edit Account' : '➕ Add New Account'}
//         size="md"
//         footer={
//           <div className="flex justify-end space-x-3">
//             <Button 
//               variant="ghost" 
//               onClick={() => setIsModalOpen(false)}
//               className="hover:bg-gray-200"
//             >
//               <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//               Cancel
//             </Button>
//             <Button onClick={handleSubmit} variant={selectedAccount ? 'warning' : 'success'}>
//               <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//               {selectedAccount ? 'Update Account' : 'Create Account'}
//             </Button>
//           </div>
//         }
//       >
//         <form onSubmit={handleSubmit} className="space-y-1">
//           <Input
//             label="Company Name"
//             name="companyName"
//             value={formData.companyName}
//             onChange={handleInputChange}
//             required
//             placeholder="Enter company name"
//             icon={(props) => (
//               <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//               </svg>
//             )}
//           />
//           <Input
//             label="Website"
//             name="website"
//             value={formData.website}
//             onChange={handleInputChange}
//             placeholder="www.example.com"
//             icon={(props) => (
//               <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
//               </svg>
//             )}
//           />
//           <Input
//             label="Phone"
//             name="phone"
//             value={formData.phone}
//             onChange={handleInputChange}
//             placeholder="Enter phone number"
//             icon={(props) => (
//               <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//               </svg>
//             )}
//           />
//           <Select
//             label="Industry"
//             name="industry"
//             value={formData.industry}
//             onChange={handleInputChange}
//             options={industries}
//             required
//           />
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Accounts;



import React, { useEffect, useState } from 'react';
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