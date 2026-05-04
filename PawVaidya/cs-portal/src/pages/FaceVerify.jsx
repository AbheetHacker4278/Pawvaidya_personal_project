import React, { useContext, useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import FaceCamera from '../components/FaceCamera';
import { CSContext } from '../context/CSContext';

const FaceVerify = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { backendUrl, setCSToken } = useContext(CSContext);
    const cameraRef = useRef();

    const handleFaceCapture = async (descriptor, imageData) => {
        setLoading(true);
        try {
            const preToken = localStorage.getItem('cs_preToken');
            if (!preToken) {
                toast.error("Authentication session expired.");
                navigate('/login');
                return;
            }

            const { data } = await axios.post(`${backendUrl}/api/cs/face-verify`, {
                preToken,
                faceDescriptor: descriptor,
                faceImage: imageData
            });

            if (data.success) {
                if (cameraRef.current) cameraRef.current.setSuccess();
                toast.success(data.message);
                
                setTimeout(() => {
                    setCSToken(data.token);
                    localStorage.setItem('cstoken', data.token);
                    localStorage.removeItem('cs_preToken');
                    navigate('/'); // Go to dashboard
                }, 1000);
            } else {
                if (cameraRef.current) cameraRef.current.setFailure(data.message);
                toast.error(data.message);
            }
        } catch (error) {
            if (cameraRef.current) cameraRef.current.setFailure(error.message);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    Security Verification
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Please verify your face to access the support portal.
                </p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-10 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100">
                    <FaceCamera ref={cameraRef} onCapture={handleFaceCapture} buttonText="Verify Identity" />
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => navigate('/login')} 
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            ← Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceVerify;
