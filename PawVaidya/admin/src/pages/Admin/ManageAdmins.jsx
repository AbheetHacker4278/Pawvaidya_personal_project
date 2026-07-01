import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { Plus, Edit, Trash2, X, Check, Mail, History, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

const ManageAdmins = () => {
    const { atoken, getAllAdmins, addAdmin, updateAdmin, deleteAdmin, adminProfile, sendIndividualEmail, getActivityLogs, backendurl } = useContext(AdminContext);

    // State
    const [admins, setAdmins] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        phone: '',
        permissions: []
    });

    const [editingId, setEditingId] = useState(null);

    // Email Modal State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTarget, setEmailTarget] = useState(null);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailAttachments, setEmailAttachments] = useState([]);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Logs Modal State
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [selectedAdminLogs, setSelectedAdminLogs] = useState([]);
    const [selectedAdminInfo, setSelectedAdminInfo] = useState(null);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [logFilter, setLogFilter] = useState('all');

    const openEmailModal = (admin) => {
        setEmailTarget(admin);
        setEmailSubject('');
        setEmailMessage('');
        setEmailAttachments([]);
        setShowEmailModal(true);
    };

    const handleEmailFileChange = (e) => {
        setEmailAttachments(Array.from(e.target.files));
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!emailSubject.trim() || !emailMessage.trim()) {
            toast.error("Please fill in subject and message");
            return;
        }

        setSendingEmail(true);
        const formData = new FormData();
        formData.append('email', emailTarget.email);
        formData.append('subject', emailSubject);
        formData.append('message', emailMessage);

        emailAttachments.forEach(file => {
            formData.append('attachments', file);
        });

        const success = await sendIndividualEmail(formData);
        setSendingEmail(false);

        if (success) {
            setShowEmailModal(false);
        }
    };

    const openLogsModal = async (admin) => {
        setLoadingLogs(true);
        setSelectedAdminInfo(admin);
        setShowLogsModal(true);
        setSelectedAdminLogs([]);

        try {
            const data = await getActivityLogs(admin._id, 'admin');
            if (data.success) {
                setSelectedAdminLogs(data.logs);
                // The backend now returns adminInfo as well
                if (data.adminInfo) {
                    setSelectedAdminInfo(data.adminInfo);
                }
            }
        } catch (error) {
            console.error("Error fetching admin logs:", error);
            toast.error("Failed to load activity logs");
        } finally {
            setLoadingLogs(false);
        }
    };

    // Available Permissions — grouped by sidebar section
    const AVAILABLE_PERMISSIONS = [
        // ── Master Toggle ───────────────────────────────────
        { id: 'all',              label: 'All Permissions',      category: 'master',        desc: 'Full access to everything' },

        // ── Insights ────────────────────────────────────────
        { id: 'financials',       label: 'Financials',           category: 'Insights',      desc: 'Treasury & loss reports' },
        { id: 'deployments',      label: 'Deployments Monitor',  category: 'Insights',      desc: 'Render Status tracker' },
        { id: 'redis_monitor',    label: 'Redis Monitor',        category: 'Insights',      desc: 'Cache performance metrics' },

        // ── Management ──────────────────────────────────────
        { id: 'appointments',     label: 'Appointments',         category: 'Management',    desc: 'View & manage all bookings' },
        { id: 'add_doctor',       label: 'Add Doctor',           category: 'Management',    desc: 'Onboard new vets' },
        { id: 'doctors',          label: 'Doctor List & Rankings', category: 'Management', desc: 'Browse & rank doctors' },
        { id: 'users',            label: 'Total Users',          category: 'Management',    desc: 'View user registry' },
        { id: 'customer360',      label: 'Customer 360',         category: 'Management',    desc: '360° profile lookup' },
        { id: 'payment_details',  label: 'Payment Details',      category: 'Management',    desc: 'Transaction history' },
        { id: 'subscriptions',    label: 'All Subscriptions',    category: 'Management',    desc: 'Membership & retention' },
        { id: 'emergency_panel',  label: 'Emergency Panel',      category: 'Management',    desc: 'Ecosystem analytics' },
        { id: 'stray_campaigns',  label: 'Stray Campaigns',      category: 'Management',    desc: 'Monitor & support' },
        { id: 'polls',            label: 'Polls',                category: 'Management',    desc: 'Manage riddles & polls' },
        { id: 'beta_access',      label: 'Beta Access Manager',  category: 'Management',    desc: 'Early Tester program' },
        { id: 'media_registry',   label: 'Media Registry',       category: 'Management',    desc: 'Cloud assets manager' },
        { id: 'blacklist',        label: 'Blacklist Manager',    category: 'Management',    desc: 'Email blacklist' },
        { id: 'coupons',          label: 'Coupons Manager',      category: 'Management',    desc: 'Admin discount subsidy' },
        { id: 'security_monitor', label: 'Security Monitor',     category: 'Management',    desc: 'System threat alerts' },
        { id: 'manage_admins',    label: 'Manage Admins (Super)', category: 'Management',    desc: 'Create/Edit admins & roles' },

        // ── Communication ────────────────────────────────────
        { id: 'live_streams',     label: 'Live Streams',         category: 'Communication', desc: 'Active broadcasters' },
        { id: 'messages',         label: 'Messages',             category: 'Communication', desc: 'Support inbox' },
        { id: 'broadcast_email',  label: 'Broadcast Email',      category: 'Communication', desc: 'Mass campaigns' },
        { id: 'reports',          label: 'All Reports',          category: 'Communication', desc: 'System flags & reports' },
        { id: 'app_issues',       label: 'App Issue Reports',    category: 'Communication', desc: 'Bugs & UI feedback' },
        { id: 'unban',            label: 'Unban Requests',       category: 'Communication', desc: 'Appeals portal' },
        { id: 'deletion_requests', label: 'Deletion Requests',   category: 'Communication', desc: 'User account removal' },

        // ── Support Service ───────────────────────────────────
        { id: 'cs_employees',     label: 'CS Agents',            category: 'Support',       desc: 'Manage CS staff' },
        { id: 'cs_complaints',    label: 'CS Complaints',        category: 'Support',       desc: 'Agent grievance tickets' },
        { id: 'cs_chat',          label: 'CS Agent Chat',        category: 'Support',       desc: 'Support agent chat room' },
        { id: 'cs_tickets',       label: 'CS Tickets',           category: 'Support',       desc: 'Global ticket view' },
        { id: 'cruelty_reports',  label: 'Cruelty Reports',      category: 'Support',       desc: 'Animal abuse logs' },
        { id: 'misbehavior_reports', label: 'Misbehavior Reports', category: 'Support',       desc: 'User misbehavior reports' },
        { id: 'cs_reports',       label: 'CS Reports',           category: 'Support',       desc: 'Agent performance metrics' },

        // ── Settings ─────────────────────────────────────────
        { id: 'trash',            label: 'Trash',                category: 'Settings',      desc: 'Archived/deleted data' },
        { id: 'chat',             label: 'Doctor Chat',          category: 'Settings',      desc: 'Internal comms' },
    ];

    // Fetch Admins
    const fetchAdmins = async () => {
        if (atoken) {
            setLoading(true);
            const data = await getAllAdmins();
            setAdmins(data);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminProfile && adminProfile.role === 'master') {
            fetchAdmins();
        }
    }, [atoken, adminProfile]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePermissionChange = (permId) => {
        setFormData(prev => {
            const currentPerms = [...prev.permissions];
            if (permId === 'all') {
                return { ...prev, permissions: currentPerms.includes('all') ? [] : ['all'] };
            }

            // If 'all' is selected, deselect it when checking specific ones, or keep it? 
            // Better logic: 'all' overrides everything. 
            // For simplicity, if 'all' is clicked, toggle it. If others are clicked, toggle them.

            if (currentPerms.includes(permId)) {
                return { ...prev, permissions: currentPerms.filter(p => p !== permId) };
            } else {
                return { ...prev, permissions: [...currentPerms, permId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || (!isEdit && !formData.password)) {
            toast.error("Please fill all required fields");
            return;
        }

        const success = isEdit
            ? await updateAdmin(editingId, formData)
            : await addAdmin(formData);

        if (success) {
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'admin', phone: '', permissions: [] });
            fetchAdmins();
        }
    };

    const handleEdit = (admin) => {
        setFormData({
            name: admin.name,
            email: admin.email,
            password: '', // Don't show current password
            role: admin.role || 'admin',
            phone: admin.phone || '',
            permissions: admin.permissions || []
        });
        setEditingId(admin._id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const success = await deleteAdmin(id);
        if (success) fetchAdmins();
    };

    const openAddModal = () => {
        setFormData({ name: '', email: '', password: '', role: 'admin', phone: '', permissions: [] });
        setIsEdit(false);
        setShowModal(true);
    };

    if (!adminProfile || adminProfile.role !== 'master') {
        return <div className="p-5 text-center text-red-500">Access Denied</div>;
    }

    return (
        <div className="m-5">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Admins</h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
                >
                    <Plus size={20} /> Add Admin
                </button>
            </div>

            {/* Admin List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
                            ) : admins.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-4">No child admins found</td></tr>
                            ) : (
                                admins.map((admin) => (
                                    <tr key={admin._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{admin.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{admin.phone || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {admin.permissions?.includes('all') ? (
                                                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">All Access</span>
                                                ) : (
                                                    admin.permissions?.slice(0, 3).map(p => (
                                                        <span key={p} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                                            {AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label || p}
                                                        </span>
                                                    ))
                                                )}
                                                {admin.permissions?.length > 3 && (
                                                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                                        +{admin.permissions.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {admin.role !== 'master' && (
                                                    <>
                                                        <button
                                                            onClick={() => openLogsModal(admin)}
                                                            className="text-gray-600 hover:text-gray-900 mr-4"
                                                            title="View Activity Logs"
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEmailModal(admin)}
                                                            className="text-purple-600 hover:text-purple-900 mr-4"
                                                            title="Send Email"
                                                        >
                                                            <Mail size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(admin)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(admin._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {admin.role === 'master' && (
                                                    <span className="text-gray-400 text-xs italic">Master Admin</span>
                                                )}
                                            </td>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEdit ? 'Edit Admin' : 'Add New Admin'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="Admin Name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="admin@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (SMS Alerting)</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                                            placeholder="+1234567890"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            {isEdit ? 'Password (leave blank to keep)' : 'Password'}
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={!isEdit}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm"
                                            placeholder="••••••••"
                                            minLength={8}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <label className="block text-sm font-black text-gray-800 mb-3 uppercase tracking-wider text-[11px]">Permissions Matrix</label>

                                    {/* Master toggle */}
                                    <div className="mb-4 p-3.5 bg-gradient-to-r from-emerald-50 to-green-50/30 border border-emerald-100 rounded-xl flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="perm-all"
                                            checked={formData.permissions.includes('all')}
                                            onChange={() => handlePermissionChange('all')}
                                            className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                        />
                                        <div>
                                            <label htmlFor="perm-all" className="text-sm font-black text-emerald-800 cursor-pointer">⚡ All Permissions</label>
                                            <p className="text-xs text-emerald-600 font-medium">Grant full access to all sections and operations</p>
                                        </div>
                                    </div>

                                    {/* Grouped permissions */}
                                    <div className="space-y-4">
                                        {['Insights', 'Management', 'Communication', 'Finance', 'Support', 'Settings'].map(category => {
                                            const perms = AVAILABLE_PERMISSIONS.filter(p => p.category === category);
                                            if (!perms.length) return null;
                                            const categoryColors = {
                                                Insights: 'bg-teal-50 border-teal-100 text-teal-700',
                                                Management: 'bg-blue-50 border-blue-100 text-blue-700',
                                                Communication: 'bg-purple-50 border-purple-100 text-purple-700',
                                                Finance: 'bg-amber-50 border-amber-100 text-amber-700',
                                                Support: 'bg-rose-50 border-rose-100 text-rose-700',
                                                Settings: 'bg-slate-50 border-slate-100 text-slate-700',
                                            };
                                            return (
                                                <div key={category} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                                    <p className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md inline-block mb-3 border ${categoryColors[category]}`}>{category}</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {perms.map((perm) => (
                                                            <div key={perm.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                                                formData.permissions.includes(perm.id) || formData.permissions.includes('all')
                                                                    ? 'bg-emerald-50/40 border-emerald-200/80 shadow-sm shadow-emerald-50'
                                                                    : 'bg-white border-gray-200/60 hover:border-gray-300'
                                                            }`}
                                                            onClick={() => handlePermissionChange(perm.id)}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    id={`perm-${perm.id}`}
                                                                    checked={formData.permissions.includes(perm.id) || formData.permissions.includes('all')}
                                                                    onChange={() => handlePermissionChange(perm.id)}
                                                                    disabled={formData.permissions.includes('all') && perm.id !== 'all'}
                                                                    className="w-4 h-4 mt-0.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 shrink-0"
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                                <div>
                                                                    <label htmlFor={`perm-${perm.id}`} className="text-xs font-black text-gray-800 cursor-pointer leading-tight block">{perm.label}</label>
                                                                    <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">{perm.desc}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Selected count */}
                                    <p className="text-xs text-slate-400 mt-3 font-semibold text-right">
                                        {formData.permissions.includes('all')
                                            ? '✅ All permissions selected'
                                            : `${formData.permissions.length} permission${formData.permissions.length !== 1 ? 's' : ''} selected`
                                        }
                                    </p>
                                </div>

                                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="make-master"
                                            checked={formData.role === 'master'}
                                            onChange={(e) => {
                                                const isMaster = e.target.checked;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    role: isMaster ? 'master' : 'admin',
                                                    permissions: isMaster ? ['all'] : []
                                                }));
                                            }}
                                            className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                                        />
                                        <label htmlFor="make-master" className="ml-2 font-bold text-sm text-gray-900 cursor-pointer">
                                            Promote to Master Admin
                                        </label>
                                    </div>
                                    <p className="mt-1 text-xs text-amber-700/80 ml-7 font-medium leading-normal">
                                        Warning: This will transfer Master privileges to this user. You may lose your Master status if you are not the system administrator.
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-gray-50/50 shrink-0 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-sm"
                                >
                                    {isEdit ? 'Update Admin' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b flex justify-between items-center bg-purple-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Mail className="text-purple-600" /> Send Email to {emailTarget?.name}
                            </h2>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                                <input
                                    type="email"
                                    value={emailTarget?.email || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={emailSubject}
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter email subject"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    value={emailMessage}
                                    onChange={(e) => setEmailMessage(e.target.value)}
                                    required
                                    rows="6"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Type your message here..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                                                <span>Upload files</span>
                                                <input type="file" multiple className="sr-only" onChange={handleEmailFileChange} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Any file up to 10MB</p>
                                    </div>
                                </div>
                                {emailAttachments.length > 0 && (
                                    <ul className="mt-2 divide-y divide-gray-200">
                                        {emailAttachments.map((file, idx) => (
                                            <li key={idx} className="py-2 flex items-center justify-between text-sm">
                                                <div className="flex items-center">
                                                    <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                                                </div>
                                                <div className="ml-4 flex-shrink-0 font-medium text-purple-600">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2 disabled:bg-purple-400"
                                >
                                    {sendingEmail ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={18} /> Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Logs Modal */}
            {showLogsModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-modalIn">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Activity Logs & Login Info</h2>
                                    <p className="text-sm text-gray-500">{selectedAdminInfo?.name} • {selectedAdminInfo?.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLogsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Login Stats Header */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Login</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {selectedAdminInfo?.lastLogin ? new Date(selectedAdminInfo.lastLogin).toLocaleString() : 'Never'}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Failed Attempts</p>
                                    <p className={`text-sm font-medium ${selectedAdminInfo?.failedLoginAttempts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {selectedAdminInfo?.failedLoginAttempts || 0}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-1 md:col-span-2">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Last Failed At</p>
                                    <p className="text-sm font-medium text-gray-800">
                                        {selectedAdminInfo?.lastFailedLoginAt ? new Date(selectedAdminInfo.lastFailedLoginAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Trusted Locations */}
                            {selectedAdminInfo?.trustedGeolocations?.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-green-500" /> Trusted Locations
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAdminInfo.trustedGeolocations.map((loc, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                                                {loc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logs Table */}
                            <div className="relative">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-700">Recent Activity</h3>
                                    <div className="flex gap-2">
                                        {['all', 'login', 'action'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setLogFilter(f)}
                                                className={`px-3 py-1 text-xs rounded-lg transition-all ${logFilter === f ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[450px] overflow-y-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] font-bold sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 bg-gray-50">Time</th>
                                                <th className="px-4 py-3 bg-gray-50">Type</th>
                                                <th className="px-4 py-3 bg-gray-50">Description</th>
                                                <th className="px-4 py-3 bg-gray-50">IP Address</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loadingLogs ? (
                                                <tr><td colSpan="4" className="px-4 py-10 text-center text-gray-400">Loading activity logs...</td></tr>
                                            ) : selectedAdminLogs.length === 0 ? (
                                                <tr><td colSpan="4" className="px-4 py-10 text-center text-gray-400">No activity logs found</td></tr>
                                            ) : (
                                                selectedAdminLogs
                                                    .filter(log => {
                                                        if (logFilter === 'all') return true;
                                                        if (logFilter === 'login') return log.activityType === 'login' || log.activityType === 'logout';
                                                        return !['login', 'logout'].includes(log.activityType);
                                                    })
                                                    .map((log) => (
                                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs">
                                                                {new Date(log.timestamp).toLocaleString()}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.activityType === 'login' ? 'bg-blue-100 text-blue-700' :
                                                                    log.activityType === 'error' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {log.activityType}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-700 text-xs">
                                                                {log.activityDescription}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                                                                {log.ipAddress || '—'}
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowLogsModal(false)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all font-medium text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAdmins;
