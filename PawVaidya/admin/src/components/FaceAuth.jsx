import React, { useEffect, useRef, useState, useContext } from 'react';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';

const FaceAuth = ({ mode, onAuthSuccess, onCancel, email }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureVideo, setCaptureVideo] = useState(false);
    const [faceDetected, setFaceDetected] = useState(false);
    const { backendUrl, aToken } = useContext(AdminContext);

    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
                startVideo();
            } catch (err) {
                console.error("Error loading models:", err);
                toast.error("Failed to load face recognition models");
            }
        };
        loadModels();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            closeVideo();
        };
    }, []);

    const startVideo = () => {
        setCaptureVideo(true);
        navigator.mediaDevices
            .getUserMedia({ video: { width: 300 } })
            .then((stream) => {
                let video = videoRef.current;
                if (video) {
                    video.srcObject = stream;
                    video.play();
                }
            })
            .catch((err) => {
                console.error("error:", err);
                toast.error("Could not access webcam");
            });
    };

    const closeVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setCaptureVideo(false);
    };

    const handleVideoOnPlay = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(async () => {
            if (canvasRef.current && videoRef.current) {
                const displaySize = {
                    width: 300,
                    height: 225
                };

                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                }

                if (detections.length > 0) {
                    setFaceDetected(true);
                } else {
                    setFaceDetected(false);
                }
            }
        }, 100);
    };

    const captureAndAuthenticate = async () => {
        if (!faceDetected || !videoRef.current) return;

        // Get fresh detection
        const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();

        if (!detections) {
            toast.error("No face detected. Please position yourself clearly.");
            return;
        }

        const descriptor = Array.from(detections.descriptor);

        try {
            if (mode === 'register') {
                // Capture image from video
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('atoken');
                console.log("Registering face for:", email);
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/admin/register-face',
                    { faceDescriptor: descriptor, email, image: imageBase64 },
                    { headers: { atoken: token } }
                );

                if (data.success) {
                    toast.success("Face Registered Successfully");
                    if (onAuthSuccess) onAuthSuccess();
                } else {
                    toast.error(data.message);
                }

            } else if (mode === 'login') {
                // Capture image for logs
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/admin/login-face',
                    { faceDescriptor: descriptor, image: imageBase64 }
                );

                if (data.success) {
                    toast.success("Login Successful");
                    if (onAuthSuccess) onAuthSuccess(data);
                } else {
                    toast.error(data.message);
                }
            } else if (mode === 'doctor_register') {
                // Capture image from video
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('dtoken');
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/doctor/register-face',
                    { faceDescriptor: descriptor, image: imageBase64 },
                    { headers: { dtoken: token } }
                );

                if (data.success) {
                    toast.success("Face Registered Successfully");
                    if (onAuthSuccess) onAuthSuccess();
                } else {
                    toast.error(data.message);
                }
            } else if (mode === 'doctor_clockin') {
                // Capture image for logs
                const canvas = document.createElement('canvas');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageBase64 = canvas.toDataURL('image/jpeg');

                const token = localStorage.getItem('dtoken');
                const { data } = await axios.post(
                    import.meta.env.VITE_BACKEND_URL + '/api/doctor/clock-in',
                    { faceDescriptor: descriptor, image: imageBase64 },
                    { headers: { dtoken: token } }
                );

                if (data.success) {
                    toast.success("Attendance Marked Successfully");
                    if (onAuthSuccess) onAuthSuccess(data);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            console.error("Face Auth Error:", error);
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Authentication failed: " + error.message);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
                <h2 className="text-xl font-bold mb-4">
                    {mode === 'login' || mode === 'doctor_clockin' ? 'Face Attendance/Login' : 'Register Face'}
                </h2>

                <div className="relative flex justify-center items-center h-[225px] w-[300px] bg-gray-100 rounded overflow-hidden">
                    {!modelsLoaded && <p>Loading AI Models...</p>}
                    {captureVideo && modelsLoaded && (
                        <div className="absolute">
                            <video
                                ref={videoRef}
                                height="225"
                                width="300"
                                onPlay={handleVideoOnPlay}
                                style={{ borderRadius: '10px' }}
                                muted
                                playsInline
                                autoPlay
                            />
                            <canvas ref={canvasRef} className="absolute top-0 left-0" />
                        </div>
                    )}
                </div>

                <div className="mt-4 flex gap-3">
                    <button
                        onClick={captureAndAuthenticate}
                        disabled={!faceDetected}
                        className={`px-4 py-2 rounded text-white font-semibold transition ${faceDetected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                    >
                        {mode === 'login' || mode === 'doctor_clockin' ? 'Give Attendance' : 'Save Face'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white font-semibold"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceAuth;
