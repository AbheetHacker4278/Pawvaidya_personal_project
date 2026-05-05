import React, { useContext, useState, useRef } from 'react';
import { CSContext } from '../context/CSContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserShield, FaCamera, FaImage, FaTimes, FaFileAlt, FaTrash, FaPlus, FaIdCard, FaGraduationCap, FaPassport, FaFilePdf } from 'react-icons/fa';
import FaceCamera from '../components/FaceCamera';
import DigiLockerSection from '../components/DigiLockerSection';

const EmployeeProfile = () => {
    const { employee, setEmployee, cstoken, backendUrl } = useContext(CSContext);
    const [uploading, setUploading] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');

    // Document states
    const [docType, setDocType] = useState('qualification');
    const [docFile, setDocFile] = useState(null);

    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);

    // Initialize form states when employee changes or entering edit mode
    React.useEffect(() => {
        if (employee) {
            setName(employee.name || '');
            setPhone(employee.phone || '');
            setBio(employee.bio || '');
        }
    }, [employee, isEditing]);

    if (!employee) return null;

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('employeeId', employee._id);

        try {
            setUploading(true);
            const { data } = await axios.post(`${backendUrl}/api/cs/update-profile`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'cstoken': cstoken
                }
            });

            if (data.success) {
                setEmployee(data.employee);
                toast.success('Profile picture updated');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            const { data } = await axios.post(`${backendUrl}/api/cs/update-profile`,
                { name, phone, bio },
                { headers: { cstoken } }
            );

            if (data.success) {
                setEmployee(data.employee);
                toast.success('Profile updated successfully');
                setIsEditing(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update profile');
        } finally {
            setUploading(false);
        }
    };

    const handleDocUpload = async (e) => {
        e.preventDefault();
        if (!docFile) return toast.error('Please select a file');

        const formData = new FormData();
        formData.append('docType', docType);
        formData.append('docFile', docFile);

        try {
            setUploading(true);
            const { data } = await axios.post(`${backendUrl}/api/cs/upload-document`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'cstoken': cstoken
                }
            });

            if (data.success) {
                setEmployee(data.employee);
                toast.success('Document uploaded');
                setDocFile(null);
                if (docInputRef.current) docInputRef.current.value = '';
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleDocDelete = async (docId) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            setUploading(true);
            const { data } = await axios.post(`${backendUrl}/api/cs/delete-document`, { docId }, {
                headers: { cstoken }
            });

            if (data.success) {
                setEmployee(data.employee);
                toast.success('Document deleted');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete document');
        } finally {
            setUploading(false);
        }
    };

    const handleFaceCapture = async (descriptor, imageData) => {
        try {
            setUploading(true);
            const { data } = await axios.post(`${backendUrl}/api/cs/re-register-face`,
                { faceDescriptor: descriptor, faceImage: imageData },
                { headers: { cstoken } }
            );

            if (data.success) {
                setEmployee(data.employee);
                toast.success('Biometrics updated successfully');
                setShowFaceModal(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update biometrics');
        } finally {
            setUploading(false);
        }
    };

    const getDocIcon = (type) => {
        switch (type) {
            case 'qualification': return <FaGraduationCap className="text-blue-500" />;
            case 'aadhar':
            case 'pan': return <FaIdCard className="text-emerald-500" />;
            case 'passport': return <FaPassport className="text-purple-500" />;
            default: return <FaFileAlt className="text-slate-400" />;
        }
    };

    const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`;

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
            <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6 text-slate-800 border border-slate-200">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                    <h2 className="text-xl font-bold">My Profile</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 space-y-6 md:space-y-0">
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current.click()}>
                            <img
                                src={employee.profilePic || defaultProfilePic}
                                alt="Profile"
                                className={`w-32 h-32 rounded-full border-4 border-white shadow-sm object-cover ${uploading ? 'opacity-50' : 'group-hover:opacity-75'} transition-opacity`}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white bg-black/50 px-2 py-1 rounded text-xs">Change Photo</span>
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {!isEditing && (
                            <div className="mt-4 text-center">
                                <h3 className="text-2xl font-bold">{employee.name}</h3>
                                <p className="text-slate-500">{employee.email}</p>
                                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {employee.status.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 w-full">
                        {isEditing ? (
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Full Name</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Phone Number</label>
                                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Bio</label>
                                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows="3" required
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-sm" />
                                    </div>
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button type="submit" disabled={uploading} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm">
                                        {uploading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="bg-slate-100 text-slate-600 px-6 py-2 rounded-lg text-sm font-bold">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Phone</h4>
                                        <p className="mt-1 font-medium">{employee.phone || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Joined</h4>
                                        <p className="mt-1 font-medium">{new Date(employee.joinedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Bio</h4>
                                        <p className="mt-1 text-slate-700 italic">{employee.bio || 'No bio provided yet.'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Avg Rating</span>
                                        <span className="text-lg font-black text-yellow-500">{employee.averageRating ? employee.averageRating.toFixed(1) : '0.0'}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Reviews</span>
                                        <span className="text-lg font-black text-slate-700">{employee.totalRatings || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Tickets</span>
                                        <span className="text-lg font-black text-emerald-600">{employee.totalTicketsResolved || 0}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">Online</span>
                                        <span className="text-lg font-black text-blue-500">{employee.isOnline ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6 border border-slate-200">
                <h3 className="text-lg font-bold border-b border-slate-200 pb-4 mb-4 flex items-center">
                    <FaFileAlt className="mr-2 text-primary" /> Documents & Verification
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Upload Form */}
                    <div className="space-y-4">
                        <form onSubmit={handleDocUpload} className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Upload New Document</h4>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Document Type</label>
                                <select
                                    value={docType}
                                    onChange={e => setDocType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                                >
                                    <option value="qualification">Qualification/Degree</option>
                                    <option value="aadhar">Aadhar Card</option>
                                    <option value="pan">PAN Card</option>
                                    <option value="passport">Passport</option>
                                    <option value="other">Other ID/Document</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Select File (Image or PDF)</label>
                                <input
                                    type="file"
                                    ref={docInputRef}
                                    onChange={e => setDocFile(e.target.files[0])}
                                    accept="image/*,.pdf"
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={uploading || !docFile}
                                className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            >
                                <FaPlus />
                                <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
                            </button>
                        </form>
                    </div>

                    {/* Document List */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Uploaded Documents</h4>
                        {employee.documents && employee.documents.length > 0 ? (
                            <div className="space-y-2">
                                {employee.documents.map((doc) => (
                                    <div key={doc._id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-primary/30 transition-colors group">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center">
                                                {getDocIcon(doc.docType)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 capitalize">{doc.docType}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => setSelectedDoc(doc)}
                                                className="text-[10px] font-bold text-primary hover:underline uppercase"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDocDelete(doc._id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                <FaFileAlt className="mx-auto text-slate-200 mb-2" size={32} />
                                <p className="text-xs text-slate-400 font-medium">No documents uploaded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DigiLocker Integration Section */}
            <DigiLockerSection />

            {/* Security Section */}
            <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6 border border-slate-200">
                <h3 className="text-lg font-bold border-b border-slate-200 pb-4 mb-4 flex items-center">
                    <FaUserShield className="mr-2 text-primary" /> Security & Biometrics
                </h3>

                <div className="flex flex-col md:flex-row items-center md:space-x-8 space-y-6 md:space-y-0">
                    <div className="w-40 h-40 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200 flex items-center justify-center relative group">
                        {employee.registeredFaceImage ? (
                            <img src={employee.registeredFaceImage} alt="Master Scan" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center p-2">
                                <FaImage className="mx-auto text-slate-300 mb-2" size={32} />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">No Scan Data</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold uppercase">Biometric ID</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                            <h4 className="text-primary font-bold text-sm mb-1">About Biometric Verification</h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                We use face recognition to ensure secure access to the support portal. Your master scan is compared with your daily login scan to verify identity.
                                If your appearance changes significantly or the master scan is unclear, please update it.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowFaceModal(true)}
                            className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm w-full md:w-auto"
                        >
                            <FaCamera />
                            <span>{employee.registeredFaceImage ? 'Update Registered Biometrics' : 'Register Biometrics Now'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Face Camera Modal */}
            {showFaceModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        <button
                            onClick={() => setShowFaceModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10"
                        >
                            <FaTimes size={20} />
                        </button>
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-2">Update Biometrics</h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Please look directly into the camera. Ensure your face is well-lit and clearly visible.
                            </p>
                            <FaceCamera
                                onCapture={handleFaceCapture}
                                buttonText="Scan & Save Biometrics"
                                loadingText="Initializing Secure Camera..."
                            />
                            <p className="mt-4 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
                                Biometric data is encrypted and stored securely.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center space-x-3">
                                <div className="text-primary text-xl">{getDocIcon(selectedDoc.docType)}</div>
                                <div>
                                    <h3 className="font-bold text-slate-800 capitalize">{selectedDoc.docType}</h3>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Verification Document</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-100 overflow-hidden">
                            {selectedDoc.docUrl.toLowerCase().endsWith('.pdf') ? (
                                <object
                                    data={selectedDoc.docUrl}
                                    type="application/pdf"
                                    className="w-full h-full"
                                >
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <FaFilePdf size={48} className="text-slate-300 mb-4" />
                                        <p className="text-slate-600 mb-4 font-medium">Unable to display PDF directly in this browser.</p>
                                        <a
                                            href={selectedDoc.docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-primary text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all text-sm"
                                        >
                                            Open Document in New Tab
                                        </a>
                                    </div>
                                </object>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center p-8">
                                    <img src={selectedDoc.docUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t bg-slate-50 text-center">
                            <button onClick={() => setSelectedDoc(null)} className="bg-slate-800 text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-slate-900 transition-all shadow-md">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProfile;
