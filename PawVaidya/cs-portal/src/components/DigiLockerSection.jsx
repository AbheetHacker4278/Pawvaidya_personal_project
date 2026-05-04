import React, { useContext, useState, useEffect } from 'react';
import { CSContext } from '../context/CSContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaTimes, FaCheckCircle, FaSync, FaUnlink, FaShieldAlt, FaIdCard, FaHospital, FaGraduationCap, FaCar } from 'react-icons/fa';

const DOC_ICONS = {
    aadhaar: <FaIdCard className="text-orange-500" />, 
    abha: <FaHospital className="text-teal-500" />,
    apaar: <FaGraduationCap className="text-indigo-500" />,
    pan: <FaIdCard className="text-blue-600" />,
    driving_license: <FaCar className="text-purple-500" />,
};

const DOC_COLORS = {
    aadhaar: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
    abha: { bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700' },
    apaar: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-700' },
    pan: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
    driving_license: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
};

const DigiLockerSection = () => {
    const { employee, setEmployee, cstoken, backendUrl } = useContext(CSContext);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [status, setStatus] = useState(null);
    const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

    const isLinked = employee?.digilocker?.linked;

    useEffect(() => {
        if (cstoken && employee) fetchStatus();
    }, [cstoken, employee?._id]);

    const fetchStatus = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/cs/digilocker/status`, {
                headers: { cstoken }
            });
            if (data.success) setStatus(data);
        } catch (err) { console.error(err); }
    };

    const handleLinkDigiLocker = async () => {
        setLinking(true);
        try {
            // Step 1: Initiate
            const { data: initData } = await axios.post(`${backendUrl}/api/cs/digilocker/initiate`, {}, {
                headers: { cstoken }
            });
            if (!initData.success) { toast.error(initData.message); return; }

            // Step 2: Simulate OAuth callback (in production, user would be redirected)
            toast.info('Connecting to DigiLocker...', { autoClose: 1500 });
            await new Promise(r => setTimeout(r, 2000));

            const { data: cbData } = await axios.post(`${backendUrl}/api/cs/digilocker/callback`, 
                { stateToken: initData.stateToken },
                { headers: { cstoken } }
            );

            if (cbData.success) {
                setEmployee(cbData.employee);
                toast.success('🎉 DigiLocker linked successfully!');
                fetchStatus();
            } else {
                toast.error(cbData.message);
            }
        } catch (err) {
            toast.error('Failed to link DigiLocker');
            console.error(err);
        } finally {
            setLinking(false);
        }
    };

    const handleFetchDocuments = async (docTypes = null) => {
        setFetching(true);
        try {
            const body = docTypes ? { docTypes } : {};
            const { data } = await axios.post(`${backendUrl}/api/cs/digilocker/fetch-documents`, body, {
                headers: { cstoken }
            });
            if (data.success) {
                setEmployee(data.employee);
                toast.success(data.message);
                fetchStatus();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to fetch documents');
            console.error(err);
        } finally {
            setFetching(false);
        }
    };

    const handleUnlink = async () => {
        setLoading(true);
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/digilocker/unlink`, {}, {
                headers: { cstoken }
            });
            if (data.success) {
                setEmployee(data.employee);
                toast.success(data.message);
                setShowConfirmUnlink(false);
                setStatus(null);
                fetchStatus();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error('Failed to unlink');
        } finally {
            setLoading(false);
        }
    };

    const digiDocs = employee?.digilockerDocuments || [];

    return (
        <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-5">
                <h3 className="text-lg font-bold flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mr-3 shadow-sm">
                        <FaShieldAlt className="text-white text-sm" />
                    </span>
                    DigiLocker Integration
                </h3>
                {isLinked && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <FaCheckCircle className="mr-1" /> Linked
                    </span>
                )}
            </div>

            {!isLinked ? (
                /* ── Not Linked State ─────────────────────────────── */
                <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <FaShieldAlt className="text-white text-3xl" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">Link Your DigiLocker</h4>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                        Connect your DigiLocker account to automatically fetch government-verified documents 
                        like Aadhaar, ABHA Health ID, APAAR ID, PAN Card, and Driving License.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                        {['Aadhaar', 'ABHA', 'APAAR', 'PAN', 'DL'].map(doc => (
                            <span key={doc} className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">{doc}</span>
                        ))}
                    </div>
                    <button
                        onClick={handleLinkDigiLocker}
                        disabled={linking}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 text-sm"
                    >
                        {linking ? (
                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Connecting...</>
                        ) : (
                            <><FaShieldAlt className="mr-2" /> Link DigiLocker Now</>
                        )}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        🔒 Secure OAuth 2.0 • Government of India
                    </p>
                </div>
            ) : (
                /* ── Linked State ─────────────────────────────────── */
                <div className="space-y-6">
                    {/* Account Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <FaShieldAlt className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{employee.digilocker?.digilockerName || employee.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                    Aadhaar: {employee.digilocker?.aadhaarNumber || 'N/A'} • Linked {employee.digilocker?.linkedAt ? new Date(employee.digilocker.linkedAt).toLocaleDateString() : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            <button
                                onClick={() => handleFetchDocuments()}
                                disabled={fetching}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                            >
                                {fetching ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div> : <FaSync className="mr-1.5" />}
                                {fetching ? 'Fetching...' : 'Fetch All Documents'}
                            </button>
                            <button
                                onClick={() => setShowConfirmUnlink(true)}
                                className="inline-flex items-center px-3 py-1.5 bg-white hover:bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-bold transition-all"
                            >
                                <FaUnlink className="mr-1.5" /> Unlink
                            </button>
                        </div>
                    </div>

                    {/* Documents Grid */}
                    {digiDocs.length > 0 ? (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                Fetched Documents ({digiDocs.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {digiDocs.map((doc, idx) => {
                                    const colors = DOC_COLORS[doc.docType] || DOC_COLORS.aadhaar;
                                    return (
                                        <div key={idx} className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                                        {DOC_ICONS[doc.docType] || <FaIdCard className="text-slate-400" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{doc.docName}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono">{doc.docNumber}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${colors.badge}`}>
                                                    <FaCheckCircle className="inline mr-0.5 text-[8px]" /> Verified
                                                </span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/60">
                                                <p className="text-[10px] text-slate-500"><strong>Issuer:</strong> {doc.issuer}</p>
                                                <p className="text-[10px] text-slate-500"><strong>Issued:</strong> {doc.issuedDate} • <strong>Fetched:</strong> {new Date(doc.fetchedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                            <FaSync className="mx-auto text-slate-200 mb-2" size={28} />
                            <p className="text-xs text-slate-400 font-medium mb-3">No documents fetched yet.</p>
                            <button
                                onClick={() => handleFetchDocuments()}
                                disabled={fetching}
                                className="text-xs font-bold text-blue-600 hover:underline"
                            >
                                Click "Fetch All Documents" to pull your records
                            </button>
                        </div>
                    )}

                    {/* Available Docs to Fetch */}
                    {status?.availableDocTypes && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Available Documents</h4>
                            <div className="flex flex-wrap gap-2">
                                {status.availableDocTypes.map(dt => (
                                    <button
                                        key={dt.type}
                                        onClick={() => !dt.alreadyFetched && handleFetchDocuments([dt.type])}
                                        disabled={fetching || dt.alreadyFetched}
                                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                            dt.alreadyFetched 
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default' 
                                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                                        }`}
                                    >
                                        <span className="mr-1.5">{dt.icon}</span>
                                        {dt.name.split('(')[0].trim()}
                                        {dt.alreadyFetched && <FaCheckCircle className="ml-1.5 text-emerald-500 text-[10px]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Unlink Confirmation Modal */}
            {showConfirmUnlink && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
                                <FaUnlink className="text-red-500 text-xl" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Unlink DigiLocker?</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                This will remove all fetched government documents from your profile. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowConfirmUnlink(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold">Cancel</button>
                            <button onClick={handleUnlink} disabled={loading} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                                {loading ? 'Unlinking...' : 'Yes, Unlink'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigiLockerSection;
