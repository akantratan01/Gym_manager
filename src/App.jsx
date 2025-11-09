import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Bell, Calendar, DollarSign, Users, AlertCircle, CheckCircle } from 'lucide-react';
import './App.css';

function App() {
  const [members, setMembers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    email: '',
    address: '',
    membershipType: 'monthly',
    feeAmount: '',
    feePaid: false,
    joinDate: new Date().toISOString().split('T')[0],
    lastPaymentDate: '',
    dueDate: ''
  });

  // Load members from localStorage on mount
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = () => {
    try {
      const stored = localStorage.getItem('gym-members');
      if (stored) {
        setMembers(JSON.parse(stored));
      }
    } catch (error) {
      console.log('No existing members found');
    }
  };

  const saveMembers = (updatedMembers) => {
    try {
      localStorage.setItem('gym-members', JSON.stringify(updatedMembers));
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error saving members:', error);
      alert('Failed to save data. Please try again.');
    }
  };

  const calculateDueDate = (lastPaymentDate, membershipType) => {
    if (!lastPaymentDate) return '';
    const date = new Date(lastPaymentDate);
    switch (membershipType) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      if (name === 'lastPaymentDate' || name === 'membershipType') {
        const paymentDate = name === 'lastPaymentDate' ? value : prev.lastPaymentDate;
        const memType = name === 'membershipType' ? value : prev.membershipType;
        updated.dueDate = calculateDueDate(paymentDate, memType);
      }
      
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.contact || !formData.feeAmount) {
      alert('Please fill in all required fields');
      return;
    }

    const memberData = {
      ...formData,
      id: editingMember ? editingMember.id : Date.now(),
      age: parseInt(formData.age) || 0,
      feeAmount: parseFloat(formData.feeAmount) || 0
    };

    let updatedMembers;
    if (editingMember) {
      updatedMembers = members.map(m => m.id === editingMember.id ? memberData : m);
    } else {
      updatedMembers = [...members, memberData];
    }

    saveMembers(updatedMembers);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      contact: '',
      email: '',
      address: '',
      membershipType: 'monthly',
      feeAmount: '',
      feePaid: false,
      joinDate: new Date().toISOString().split('T')[0],
      lastPaymentDate: '',
      dueDate: ''
    });
    setShowAddForm(false);
    setEditingMember(null);
  };

  const handleEdit = (member) => {
    setFormData(member);
    setEditingMember(member);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      const updatedMembers = members.filter(m => m.id !== id);
      saveMembers(updatedMembers);
    }
  };

  const markAsPaid = (member) => {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = calculateDueDate(today, member.membershipType);
    
    const updatedMembers = members.map(m => 
      m.id === member.id 
        ? { ...m, feePaid: true, lastPaymentDate: today, dueDate }
        : m
    );
    
    saveMembers(updatedMembers);
  };

  const sendReminder = (member) => {
    const daysUntil = getDaysUntilDue(member.dueDate);
    const message = daysUntil < 0 
      ? `Payment OVERDUE by ${Math.abs(daysUntil)} days!` 
      : `Payment due in ${daysUntil} days`;
    
    alert(`Reminder sent to ${member.name}\n${member.contact}\n\n${message}\nAmount: ₹${member.feeAmount}\nDue Date: ${new Date(member.dueDate).toLocaleDateString()}`);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.contact.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'paid') return matchesSearch && member.feePaid;
    if (filterStatus === 'unpaid') return matchesSearch && !member.feePaid;
    if (filterStatus === 'overdue') {
      const days = getDaysUntilDue(member.dueDate);
      return matchesSearch && days !== null && days < 0;
    }
    if (filterStatus === 'due-soon') {
      const days = getDaysUntilDue(member.dueDate);
      return matchesSearch && days !== null && days >= 0 && days <= 7;
    }
    return matchesSearch;
  });

  const stats = {
    total: members.length,
    paid: members.filter(m => m.feePaid).length,
    unpaid: members.filter(m => !m.feePaid).length,
    overdue: members.filter(m => {
      const days = getDaysUntilDue(m.dueDate);
      return days !== null && days < 0;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="text-purple-400" />
            Gym Membership Management
          </h1>
          <p className="text-purple-200">Track members, payments, and send reminders</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Members</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="text-blue-400" size={40} />
            </div>
          </div>

          <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Paid</p>
                <p className="text-3xl font-bold text-white">{stats.paid}</p>
              </div>
              <CheckCircle className="text-green-400" size={40} />
            </div>
          </div>

          <div className="bg-yellow-500/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Unpaid</p>
                <p className="text-3xl font-bold text-white">{stats.unpaid}</p>
              </div>
              <AlertCircle className="text-yellow-400" size={40} />
            </div>
          </div>

          <div className="bg-red-500/20 backdrop-blur-lg rounded-xl p-4 border border-red-400/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">Overdue</p>
                <p className="text-3xl font-bold text-white">{stats.overdue}</p>
              </div>
              <Calendar className="text-red-400" size={40} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-purple-300" size={20} />
              <input
                type="text"
                placeholder="Search by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Members</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="due-soon">Due Soon (7 days)</option>
            </select>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-200 mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Contact *</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-purple-200 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Membership Type</label>
                <select
                  name="membershipType"
                  value={formData.membershipType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Fee Amount *</label>
                <input
                  type="number"
                  name="feeAmount"
                  value={formData.feeAmount}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Join Date</label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-purple-200 mb-2">Last Payment Date</label>
                <input
                  type="date"
                  name="lastPaymentDate"
                  value={formData.lastPaymentDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-purple-200">
                  <input
                    type="checkbox"
                    name="feePaid"
                    checked={formData.feePaid}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded"
                  />
                  Fee Paid
                </label>
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Age</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Contact</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Fee</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Due Date</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-purple-300">
                      No members found. Add your first member to get started!
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const daysUntil = getDaysUntilDue(member.dueDate);
                    let statusColor = 'text-gray-400';
                    let statusText = 'No due date';
                    
                    if (daysUntil !== null) {
                      if (daysUntil < 0) {
                        statusColor = 'text-red-400';
                        statusText = `Overdue by ${Math.abs(daysUntil)} days`;
                      } else if (daysUntil <= 7) {
                        statusColor = 'text-yellow-400';
                        statusText = `Due in ${daysUntil} days`;
                      } else {
                        statusColor = 'text-green-400';
                        statusText = `${daysUntil} days left`;
                      }
                    }

                    return (
                      <tr key={member.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="px-6 py-4 text-white font-medium">{member.name}</td>
                        <td className="px-6 py-4 text-purple-200">{member.age || '-'}</td>
                        <td className="px-6 py-4 text-purple-200">{member.contact}</td>
                        <td className="px-6 py-4 text-purple-200">₹{member.feeAmount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            member.feePaid 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {member.feePaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-purple-200">
                            {member.dueDate ? new Date(member.dueDate).toLocaleDateString() : '-'}
                          </div>
                          <div className={`text-sm ${statusColor} font-semibold`}>
                            {statusText}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {!member.feePaid && (
                              <button
                                onClick={() => markAsPaid(member)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                title="Mark as Paid"
                              >
                                <DollarSign size={18} />
                              </button>
                            )}
                            {member.dueDate && (
                              <button
                                onClick={() => sendReminder(member)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                title="Send Reminder"
                              >
                                <Bell size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;