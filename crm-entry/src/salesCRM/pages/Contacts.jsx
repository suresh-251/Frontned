import { useState, useEffect } from "react";
import { Card, Button, Table, Modal, Input } from "../components/common";
import contactsAPI from "../api/contacts.api";
import Toast from "../utils/toast";
import { FaUser, FaEye, FaTrash , FaEdit } from "react-icons/fa";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    leadId: "",
    accountId: "",
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const data = await contactsAPI.getAll();
      setContacts(data);
    } catch (err) {
      console.error(err);
      Toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchById = async () => {
    if (!searchId) {
      Toast.error("Please enter Contact ID");
      return;
    }
    try {
      setLoading(true);
      const data = await contactsAPI.getById(Number(searchId));
      setContacts([data]);
      Toast.success("Contact found");
    } catch {
      Toast.error("Contact not found");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchId("");
    fetchContacts();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        leadId: formData.leadId ? Number(formData.leadId) : null,
        accountId: formData.accountId ? Number(formData.accountId) : null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      };
      await contactsAPI.create(payload);
      Toast.success("Contact created successfully");
      setIsModalOpen(false);
      fetchContacts();
      resetForm();
    } catch (err) {
      console.error(err);
      Toast.error("Failed to create contact");
    }
  };
  
  const openEdit = (contact) => {
  setFormData({
    leadId: contact.leadId ?? "",
    accountId: contact.accountId ?? "",
    name: contact.name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
  });
  setEditId(contact.id);
  setIsEditOpen(true);
};

  const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      id: editId,
      leadId: formData.leadId ? Number(formData.leadId) : 0,
      accountId: formData.accountId ? Number(formData.accountId) : 0,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    await contactsAPI.update(editId, payload); // PUT call
    Toast.success("Contact updated successfully");

    setIsEditOpen(false);
    fetchContacts();
    resetForm();
  } catch (err) {
    console.error(err);
    Toast.error("Failed to update contact");
  }
};

  const resetForm = () => {
    setFormData({
      leadId: "",
      accountId: "",
      name: "",
      email: "",
      phone: "",
    });
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await contactsAPI.delete(deleteId);
      Toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (err) {
      console.error(err);
      Toast.error("Failed to delete contact");
    } finally {
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const openView = async (id) => {
    try {
      const data = await contactsAPI.getById(id);
      setSelectedContact(data);
      setIsViewOpen(true);
    } catch {
      Toast.error("Failed to load contact details");
    }
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
  {
  header: "Actions",
  render: (row) => (
    <div className="flex gap-2">
      <Button size="sm" cursor="pointer" onClick={() => openView(row.id)}>
        <FaEye className="mr-1" /> View
      </Button>

      <Button size="sm" onClick={() => openEdit(row)}>
        <FaEdit className="mr-1" /> Edit
      </Button>

      <Button size="sm" variant="danger" onClick={() => openDeleteModal(row.id)}>
        <FaTrash className="mr-1" /> Delete
      </Button>
    </div>
  ),
},
  ];

  return (
    <div className="p-6 space-y-4 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow p-4 border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow mr-3">
            <FaUser className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Contacts</h1>
            <p className="text-gray-500 text-sm mt-1">
              Keep customers close, conversations closer
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} variant="primary">
          Add Contact
        </Button>
      </div>

      {/* SEARCH */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <Input
            type="number"
            placeholder="Search by Contact ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2 mt-2 md:mt-0">
            <Button size="sm" onClick={handleSearchById}>Search</Button>
            <Button size="sm" variant="secondary" onClick={clearSearch}>Clear</Button>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="overflow-auto">
        <Table columns={columns} data={contacts} loading={loading} emptyMessage="No contacts found." />
      </Card>

      {/* ADD CONTACT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Contact" size="md">
        <form className="space-y-3" onSubmit={handleCreate}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Lead ID" name="leadId" value={formData.leadId} onChange={handleInputChange} />
            <Input label="Account ID" name="accountId" value={formData.accountId} onChange={handleInputChange} />
            <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} />
            <Input label="Email" name="email" value={formData.email} onChange={handleInputChange} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
          </div>
          <div className="flex justify-end mt-3">
            <Button type="submit">Save Contact</Button>
          </div>
        </form>
      </Modal>

      {/* VIEW CONTACT MODAL */}
      {isViewOpen && selectedContact && (
        <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Contact Details" size="md">
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(selectedContact).map(([key, value]) => (
              <div key={key} className="flex justify-between bg-gray-50 p-2 rounded border">
                <span className="text-xs font-semibold text-gray-500 uppercase">{key}</span>
                <span className="text-sm font-medium break-words">{value ?? "—"}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Delete" size="sm">
        <div className="space-y-3">
          <p>Are you sure you want to delete this contact?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Yes, Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal
  isOpen={isEditOpen}
  onClose={() => setIsEditOpen(false)}
  title="Edit Contact"
  size="md"
>
  <form className="space-y-3" onSubmit={handleUpdate}>
    <div className="grid grid-cols-2 gap-3">
      <Input label="Lead ID" name="leadId" value={formData.leadId} onChange={handleInputChange} />
      <Input label="Account ID" name="accountId" value={formData.accountId} onChange={handleInputChange} />
      <Input label="Name" name="name" value={formData.name} onChange={handleInputChange} />
      <Input label="Email" name="email" value={formData.email} onChange={handleInputChange} />
      <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} />
    </div>
    <div className="flex justify-end mt-3">
      <Button type="submit">Update Contact</Button>
    </div>
  </form>
</Modal>

    </div>
  );
};

export default Contacts;