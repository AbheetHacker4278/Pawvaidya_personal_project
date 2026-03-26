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

    // Available Permissions
    const AVAILABLE_PERMISSIONS = [
        { id: 'all', label: 'All Permissions' },
        { id: 'appointments', label: 'Manage Appointments' },
        { id: 'add_doctor', label: 'Add Doctor' },
        { id: 'doctors', label: 'Manage Doctors' },
        { id: 'users', label: 'Manage Users' },
        { id: 'messages', label: 'Messages' },
        { id: 'reports', label: 'Reports' },
        { id: 'unban', label: 'Unban Requests' },
        { id: 'trash', label: 'Trash' },
        { id: 'chat', label: 'Chat' }
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEdit ? 'Edit Admin' : 'Add New Admin'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="Admin Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (SMS Alerting)</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:primary focus:border-transparent outline-none transition-all font-mono"
                                    placeholder="+1234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {isEdit ? 'Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required={!isEdit}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    minLength={8}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg mb-4">
                                    {AVAILABLE_PERMISSIONS.map((perm) => (
                                        <div key={perm.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`perm-${perm.id}`}
                                                checked={formData.permissions.includes(perm.id)}
                                                onChange={() => handlePermissionChange(perm.id)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                                            />
                                            <label htmlFor={`perm-${perm.id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
                                                {perm.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                                            className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                        />
                                        <label htmlFor="make-master" className="ml-2 font-medium text-gray-900 cursor-pointer">
                                            Promote to Master Admin
                                        </label>
                                    </div>
                                    <p className="mt-1 text-xs text-yellow-700 ml-7">
                                        Warning: This will transfer Master privileges to this user. You may lose your Master status if you are not the system administrator.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
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
