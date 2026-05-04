import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminContext } from '../../context/AdminContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FaTrophy, FaCalendarCheck, FaStar, FaHistory, FaUserShield, FaClock, FaImage, FaSignOutAlt, FaFileAlt, FaFileDownload, FaIdCard, FaGraduationCap, FaPassport, FaTimes, FaShieldAlt, FaCheckCircle, FaHospital, FaCar } from 'react-icons/fa';

const CSEmployeeDetail = () => {
    const { id } = useParams();
    const { atoken, backendurl } = useContext(AdminContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [rewardAmount, setRewardAmount] = useState('');
    const [rewardReason, setRewardReason] = useState('');
    const [showRewardModal, setShowRewardModal] = useState(false);

    const [incentiveAmount, setIncentiveAmount] = useState('');
    const [incentiveDays, setIncentiveDays] = useState('30');
    const [showIncentiveModal, setShowIncentiveModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const getDocIcon = (type) => {
        switch (type) {
            case 'qualification': return <FaGraduationCap className="text-blue-500" />;
            case 'aadhar':
            case 'pan': return <FaIdCard className="text-emerald-500" />;
            case 'passport': return <FaPassport className="text-purple-500" />;
            default: return <FaFileAlt className="text-slate-400" />;
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${backendurl}/api/cs-admin/employee/${id}/stats`, {
                headers: { atoken }
            });
            if (data.success) {
                setStats(data.stats);
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [id, atoken]);

    const handleGrantReward = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/reward/${id}`,
                { amount: Number(rewardAmount), reason: rewardReason },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Reward granted and email sent to employee!');
                setShowRewardModal(false);
                setRewardAmount(''); setRewardReason('');
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleGenerateReport = async () => {
        try {
            toast.info("Generating report...");
            const { data } = await axios.post(`${backendurl}/api/cs-admin/generate-report/${id}`,
                { period: 'weekly' },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success('Report generated and emailed successfully!');
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleSetIncentive = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${backendurl}/api/cs-admin/set-incentive/${id}`,
                { amount: Number(incentiveAmount), durationDays: Number(incentiveDays) },
                { headers: { atoken } }
            );
            if (data.success) {
                toast.success(data.message);
                setShowIncentiveModal(false);
                setIncentiveAmount('');
                fetchStats();
            } else toast.error(data.message);
        } catch (error) {
            toast.error(error.message);
        }
    };


    if (loading) return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Fetching agent performance data...</p>
        </div>
    );

    if (!stats || !stats.employee) return (
        <div className="p-8 text-center">
            <p className="text-red-500 font-bold">Error: Statistics data is not available.</p>
            <button onClick={fetchStats} className="mt-4 text-primary underline">Retry</button>
        </div>
    );

    const { employee, metrics, recentReviews, loginHistory } = stats;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4 border-r pr-6 border-gray-200">
                    <img src={employee.profilePic || 'https://via.placeholder.com/80'} alt="Profile" className="w-16 h-16 rounded-full border-2 border-emerald-100" />
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
                            {employee.faceVerified && (
                                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <FaCheckCircle className="mr-1" /> Biometric Verified
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <button onClick={() => setShowRewardModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
                        <FaTrophy className="mr-2" /> Grant Reward
                    </button>
                    <button onClick={() => setShowIncentiveModal(true)} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm">
                        <FaTrophy className="mr-2" /> Set Special Incentive
                    </button>
                    <button onClick={handleGenerateReport} className="text-emerald-600 hover:underline text-sm font-semibold">
                        Generate Weekly Report Now
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-yellow-400 mb-2"><FaStar size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{metrics.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500 mt-1">Average Rating ({metrics.totalRatings} total)</span>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-emerald-500 mb-2"><FaCalendarCheck size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{metrics.resolvedTickets}</span>
                    <span className="text-sm text-gray-500 mt-1">Tickets Resolved</span>
                    {metrics.resolvedTickets === 0 && (
                        <p className="text-[10px] text-amber-600 font-bold mt-2 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded">No Query Resolved History</p>
                    )}
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                    <div className="text-blue-500 mb-2"><FaHistory size={32} /></div>
                    <span className="text-3xl font-black text-gray-800">{loginHistory.length}</span>
                    <span className="text-sm text-gray-500 mt-1">Logins (Past 30 Days)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Recent Customer Reviews</h3>
                    <div className="space-y-4">
                        {recentReviews.map((rev, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-500">Ticket: {rev.ticketId}</span>
                                    <span className="text-yellow-500 font-bold text-sm">⭐ {rev.rating}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{rev.review}"</p>
                                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(rev.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                        {recentReviews.length === 0 && <p className="text-gray-500 text-sm italic">No reviews yet.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                        <FaHistory className="mr-2 text-blue-500" /> Login History (Recent)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase text-left border-b">
                                    <th className="pb-2 font-semibold">Login</th>
                                    <th className="pb-2 font-semibold">Logout</th>
                                    <th className="pb-2 font-semibold">Duration</th>
                                    <th className="pb-2 font-semibold">Face</th>
                                    <th className="pb-2 font-semibold">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loginHistory.slice(0, 10).map((log, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 text-gray-700 font-medium">
                                            {new Date(log.loginAt).toLocaleDateString()}<br />
                                            <span className="text-[10px] text-gray-400">{new Date(log.loginAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="py-3 text-gray-600">
                                            {log.logoutAt ? (
                                                <>
                                                    {new Date(log.logoutAt).toLocaleDateString()}<br />
                                                    <span className="text-[10px] text-gray-400">{new Date(log.logoutAt).toLocaleTimeString()}</span>
                                                </>
                                            ) : (
                                                <span className="text-emerald-500 font-bold flex items-center"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></span> Active</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-gray-500 italic">
                                            {log.sessionDurationMinutes ? `${log.sessionDurationMinutes}m` : '-'}
                                        </td>
                                        <td className="py-3">
                                            {log.loginFaceImage ? (
                                                <div className="group relative cursor-pointer" onClick={() => setSelectedDoc({ docUrl: log.loginFaceImage, docType: 'Login Scan' })}>
                                                    <img src={log.loginFaceImage} alt="Login Face" className="w-8 h-8 rounded border object-cover hover:ring-2 hover:ring-emerald-500 transition-all" />
                                                    <div className="hidden group-hover:block absolute -top-24 -left-12 p-1 bg-white border rounded shadow-lg z-50 pointer-events-none">
                                                        <img src={log.loginFaceImage} alt="Preview" className="w-24 h-24 object-cover" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300 text-xs">No Scan</span>
                                            )}
                                        </td>
                                        <td className="py-3 text-xs font-mono text-gray-400">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {loginHistory.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No login history available.</p>}
                    </div>
                </div>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <FaUserShield className="mr-2 text-indigo-500" /> Security & Identity Verification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b pb-8 mb-8">
                    <div
                        className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => employee.registeredFaceImage && setSelectedDoc({ docUrl: employee.registeredFaceImage, docType: 'Registered Master Scan' })}
                    >
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Registered Scanned Face</span>
                        {employee.registeredFaceImage ? (
                            <img src={employee.registeredFaceImage} alt="Registered Face" className="w-48 h-48 rounded-xl border-4 border-white shadow-md object-cover hover:scale-[1.02] transition-transform" />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed">
                                <FaImage size={48} className="mb-2 opacity-20" />
                                <span className="text-[10px] font-bold">NOT REGISTERED YET</span>
                            </div>
                        )}
                        <p className="mt-4 text-[11px] text-gray-400 text-center max-w-[250px]">
                            Click to view full biometric master scan.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <h4 className="text-indigo-900 font-bold text-sm mb-1">Biometric Verification Status</h4>
                            <p className="text-xs text-indigo-700 leading-relaxed">
                                Face recognition is {employee.faceVerified ? 'enabled and active' : 'not yet configured'} for this account.
                                {employee.faceVerified && ' Daily logins require a >99% biometric match.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Last Login IP</span>
                                <span className="text-xs font-mono text-gray-700">{employee.lastLoginIp || 'N/A'}</span>
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                <span className="block text-[10px] text-gray-400 uppercase font-bold">Account Status</span>
                                <span className={`text-xs font-bold ${employee.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {employee.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic">
                            * Registered at: {new Date(employee.joinedAt).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Verification Documents Subsection */}
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                    <FaFileAlt className="mr-2 text-emerald-500" /> Verification Documents
                </h4>
                {employee.documents && employee.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employee.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-lg">
                                        {getDocIcon(doc.docType)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 capitalize">{doc.docType}</p>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(doc)}
                                    className="p-2 bg-white rounded-full text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                    title="Preview Document"
                                >
                                    <FaFileAlt size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <FaFileAlt className="mx-auto text-gray-200 mb-2" size={32} />
                        <p className="text-xs text-gray-400 font-medium">No documents uploaded by this agent.</p>
                    </div>
                )}
            </div>

            {/* DigiLocker Verified Documents Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mr-3 shadow-sm">
                        <FaShieldAlt className="text-white text-sm" />
                    </span>
                    DigiLocker Verified Documents
                    {employee.digilocker?.linked && (
                        <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FaCheckCircle className="mr-1" /> Linked
                        </span>
                    )}
                </h3>

                {employee.digilocker?.linked ? (
                    <div className="space-y-4">
                        {/* DigiLocker Account Info */}
                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <FaShieldAlt className="text-white text-xs" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">{employee.digilocker?.digilockerName || employee.name}</p>
                                    <p className="text-[10px] text-gray-500 font-mono">Aadhaar: {employee.digilocker?.aadhaarNumber || 'N/A'}</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                Linked: {employee.digilocker?.linkedAt ? new Date(employee.digilocker.linkedAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>

                        {/* DigiLocker Documents Grid */}
                        {employee.digilockerDocuments && employee.digilockerDocuments.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {employee.digilockerDocuments.map((doc, idx) => {
                                    const colorMap = {
                                        aadhaar: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
                                        abha: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
                                        apaar: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
                                        pan: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
                                        driving_license: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
                                    };
                                    const iconMap = {
                                        aadhaar: <FaIdCard className="text-orange-500" />,
                                        abha: <FaHospital className="text-teal-500" />,
                                        apaar: <FaGraduationCap className="text-indigo-500" />,
                                        pan: <FaIdCard className="text-blue-600" />,
                                        driving_license: <FaCar className="text-purple-500" />,
                                    };
                                    const c = colorMap[doc.docType] || colorMap.aadhaar;
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border ${c.border} ${c.bg} transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        {iconMap[doc.docType] || <FaIdCard className="text-gray-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{doc.docName}</p>
                                                        <p className="text-[10px] text-gray-500 font-mono">{doc.docNumber}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${c.badge}`}>
                                                    <FaCheckCircle className="inline mr-0.5 text-[8px]" /> Verified
                                                </span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/60">
                                                <p className="text-[10px] text-gray-500"><strong>Issuer:</strong> {doc.issuer}</p>
                                                <p className="text-[10px] text-gray-500"><strong>Issued:</strong> {doc.issuedDate} • <strong>Fetched:</strong> {new Date(doc.fetchedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <FaShieldAlt className="mx-auto text-gray-200 mb-2" size={24} />
                                <p className="text-xs text-gray-400 font-medium">DigiLocker is linked but no documents have been fetched yet.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center">
                            <FaShieldAlt className="text-gray-300 text-xl" />
                        </div>
                        <p className="text-sm font-bold text-gray-500 mb-1">DigiLocker Not Linked</p>
                        <p className="text-xs text-gray-400">This agent has not linked their DigiLocker account yet.</p>
                    </div>
                )}
            </div>

            {/* Reward Modal */}
            {showRewardModal && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-amber-600"><FaTrophy className="mr-2" /> Issue Reward</h2>
                        <form onSubmit={handleGrantReward} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input type="number" required min="1" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason / Description</label>
                                <textarea required rows="3" value={rewardReason} onChange={e => setRewardReason(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-amber-500 focus:border-amber-500" />
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowRewardModal(false)} className="px-4 py-2 border rounded-md text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 font-bold">Grant & Notify</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Incentive Modal */}
            {showIncentiveModal && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center text-purple-600"><FaTrophy className="mr-2" /> Set Time-Sensitive Incentive</h2>
                        <p className="text-xs text-gray-500 mb-4">This amount will be added to the employee's dashboard earnings until the duration expires.</p>
                        <form onSubmit={handleSetIncentive} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                <input type="number" required min="1" value={incentiveAmount} onChange={e => setIncentiveAmount(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                                <select value={incentiveDays} onChange={e => setIncentiveDays(e.target.value)}
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500">
                                    <option value="7">7 Days</option>
                                    <option value="15">15 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="60">60 Days</option>
                                    <option value="90">90 Days</option>
                                </select>
                            </div>
                            <div className="pt-2 flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowIncentiveModal(false)} className="px-4 py-2 border rounded-md text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 font-bold">Set Incentive</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className="text-emerald-500 text-xl">{getDocIcon(selectedDoc.docType)}</div>
                                <div>
                                    <h3 className="font-bold text-gray-800 capitalize">{selectedDoc.docType}</h3>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                        {selectedDoc.docType.includes('Scan') ? 'Biometric Identity' : `Employee Doc: ${employee.name}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <a href={selectedDoc.docUrl} download target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-emerald-600 transition-colors" title="Download">
                                    <FaFileDownload size={20} />
                                </a>
                                <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <FaTimes size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 overflow-hidden">
                            {selectedDoc.docUrl.toLowerCase().endsWith('.pdf') ? (
                                <object
                                    data={selectedDoc.docUrl}
                                    type="application/pdf"
                                    className="w-full h-full"
                                >
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <FaFileAlt size={48} className="text-gray-300 mb-4" />
                                        <p className="text-gray-600 mb-4 font-medium">Unable to display PDF directly in this browser.</p>
                                        <a
                                            href={selectedDoc.docUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-all"
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
                        <div className="p-3 border-t bg-gray-50 text-center">
                            <button onClick={() => setSelectedDoc(null)} className="bg-gray-800 text-white px-8 py-2 rounded-lg font-bold text-sm hover:bg-gray-900 transition-all shadow-md">
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSEmployeeDetail;
