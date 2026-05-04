import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import FaceCamera from '../components/FaceCamera';
import { CSContext } from '../context/CSContext';

const Register = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { backendUrl } = useContext(CSContext);

    const needsProfile = localStorage.getItem('cs_needsProfile') === 'true';
    const needsFace = localStorage.getItem('cs_needsFace') === 'true';

    useEffect(() => {
        if (!needsProfile && needsFace) setStep(2);
    }, [needsProfile, needsFace]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const preToken = localStorage.getItem('cs_preToken');
            const empId = localStorage.getItem('cs_empId');

            // Using cstoken here, but for incomplete profiles we'll pass employeeId directly to completeProfile
            // Actually the backend expects employeeId in body and cstoken in headers...
            // Let's modify the backend call or pass it via unauthenticated endpoint if needed.
            // Wait, completeProfile currently checks authCSEmployee. That might fail since we only have preToken.
            // Let's pass preToken in headers as cstoken temporarily, or backend completeProfile should just use employeeId.
            // But let's fix backend authCSEmployee to also accept preToken? 
            // The user must be authenticated. Since completeProfile is protected by authCSEmployee, which expects a full cstoken...
            // Uh oh, we only have preToken here! I should adjust the completeProfile function to take employeeId from body instead, or use preToken.
            // Let's try sending it with preToken. 

            const { data } = await axios.post(`${backendUrl}/api/cs/complete-profile`,
                { employeeId: empId, name, phone, bio },
                { headers: { cstoken: preToken } } // Pass preToken
            );

            if (data.success) {
                toast.success(data.message);
                if (needsFace) {
                    setStep(2);
                } else {
                    toast.info("Please log in again to verify face.");
                    navigate('/login');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFaceCapture = async (descriptor, imageData) => {
        setLoading(true);
        try {
            const preToken = localStorage.getItem('cs_preToken');
            const { data } = await axios.post(`${backendUrl}/api/cs/face-register`, {
                preToken,
                faceDescriptor: descriptor,
                faceImage: imageData
            });

            if (data.success) {
                toast.success("Face registration complete! Please log in.");
                localStorage.removeItem('cs_preToken');
                navigate('/login');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Complete Your Account
                </h2>
                <div className="flex justify-center mt-4 mb-2 space-x-2">
                    <div className={`h-2 w-12 rounded ${step === 1 ? 'bg-primary' : (needsProfile ? 'bg-green-500' : 'bg-slate-300')}`}></div>
                    <div className={`h-2 w-12 rounded ${step === 2 ? 'bg-primary' : 'bg-slate-300'}`}></div>
                </div>
            </div>

            <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
                    {step === 1 && (
                        <form className="space-y-6" onSubmit={handleProfileSubmit}>
                            <h3 className="text-lg font-medium text-slate-900">Step 1: Profile Details</h3>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                                <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Phone</label>
                                <input type="text" required value={phone} onChange={e => setPhone(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Bio</label>
                                <textarea required value={bio} onChange={e => setBio(e.target.value)} rows="3"
                                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
                            >
                                {loading ? 'Saving...' : 'Next Step'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-slate-900 text-center">Step 2: Face Registration</h3>
                            <p className="text-sm text-slate-600 text-center">
                                Please look directly at the camera. This scan will be used for future logins to verify your identity.
                            </p>
                            <FaceCamera onCapture={handleFaceCapture} buttonText="Register Face" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
