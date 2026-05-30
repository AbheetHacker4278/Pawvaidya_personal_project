import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export const CSContext = createContext();

const SHIFT_DURATION = 10 * 60 * 60; // 10 hours in seconds
const SYNC_INTERVAL = 60; // sync to backend every 60 seconds

export const CSProvider = ({ children }) => {
    const [cstoken, setCSToken] = useState(localStorage.getItem('cstoken') || '');
    const [employee, setEmployee] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);

    // Break Timer States
    const [isBreakActive, setIsBreakActive] = useState(localStorage.getItem('isBreakActive') === 'true');
    const [breakTimeRemaining, setBreakTimeRemaining] = useState(parseInt(localStorage.getItem('breakTimeRemaining')) || 0);
    const [hasReachedMax, setHasReachedMax] = useState(localStorage.getItem('hasReachedMax') === 'true');
    const [breakStartTime, setBreakStartTime] = useState(localStorage.getItem('breakStartTime') || null);
    
    // Post Break Verification
    const [isPostBreakVerification, setPostBreakVerification] = useState(localStorage.getItem('isPostBreakVerification') === 'true');

    // ── 10-Hour Shift Timer ──
    // shiftWorkSeconds = total seconds worked (NOT including active break)
    const [shiftWorkSeconds, setShiftWorkSeconds] = useState(
        parseInt(localStorage.getItem('shiftWorkSeconds')) || 0
    );
    // shiftBreakSeconds = total seconds on break
    const [shiftBreakSeconds, setShiftBreakSeconds] = useState(
        parseInt(localStorage.getItem('shiftBreakSeconds')) || 0
    );
    const [shiftStarted, setShiftStarted] = useState(localStorage.getItem('shiftStarted') === 'true');
    const [shiftCompleted, setShiftCompleted] = useState(localStorage.getItem('shiftCompleted') === 'true');
    const [shiftBreakCount, setShiftBreakCount] = useState(
        parseInt(localStorage.getItem('shiftBreakCount')) || 0
    );
    // Gamification
    const [performanceData, setPerformanceData] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    
    // Early logout modal
    const [showEarlyLogoutModal, setShowEarlyLogoutModal] = useState(false);

    // Screen Recording States & Refs
    const [isRecording, setIsRecording] = useState(false);
    const [isUploadingRecording, setIsUploadingRecording] = useState(false);
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingChunksRef = useRef([]);
    const recordingStartTimeRef = useRef(null);
    
    const syncCounterRef = useRef(0);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const getEmployeeProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/cs/profile', { headers: { cstoken } });
            if (data.success) {
                setEmployee(data.employee);

                // Enforce calendar day break limit (max 2 per day)
                const breaksTodayCount = data.employee.breakHistory?.filter(
                    b => new Date(b.date).toDateString() === new Date().toDateString()
                ).length || 0;
                
                // Ensure local shiftBreakCount doesn't drop below the actual backend count for today
                setShiftBreakCount(prev => {
                    const next = Math.max(prev, breaksTodayCount);
                    localStorage.setItem('shiftBreakCount', next);
                    return next;
                });
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchIncomingRequests = async () => {
        if (!cstoken || !employee) return;
        try {
            const { data } = await axios.get(backendUrl + '/api/complaint/employee/requests', { headers: { cstoken } });
            if (data.success) {
                setIncomingRequests(data.requests);
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    const fetchPerformance = async () => {
        if (!cstoken || !employee) return;
        try {
            const { data } = await axios.get(`${backendUrl}/api/cs-gamification/performance/${employee._id}`, { headers: { cstoken } });
            if (data.success) {
                setPerformanceData(data.performance);
            }
        } catch (error) {
            console.warn('Performance fetch failed:', error.message);
        }
    };

    const fetchLeaderboard = async () => {
        if (!cstoken) return;
        try {
            const { data } = await axios.get(`${backendUrl}/api/cs-gamification/leaderboard`, { headers: { cstoken } });
            if (data.success) {
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.warn('Leaderboard fetch failed:', error.message);
        }
    };

    // Sync shift data to backend
    const syncShiftToBackend = useCallback(async (workSecs, breakSecs) => {
        if (!cstoken) return;
        try {
            await axios.post(`${backendUrl}/api/cs/shift/sync`, {
                workSeconds: workSecs,
                breakSeconds: breakSecs
            }, { headers: { cstoken } });
        } catch (err) {
            console.warn('Shift sync failed:', err.message);
        }
    }, [cstoken, backendUrl]);

    // ── Shift tick: increment work seconds when not on break and shift is active ──
    useEffect(() => {
        if (!shiftStarted || shiftCompleted || isBreakActive) return;

        const timer = setInterval(() => {
            setShiftWorkSeconds(prev => {
                const next = prev + 1;
                localStorage.setItem('shiftWorkSeconds', next);

                // Sync every SYNC_INTERVAL seconds
                syncCounterRef.current += 1;
                if (syncCounterRef.current >= SYNC_INTERVAL) {
                    syncCounterRef.current = 0;
                    // Read break seconds from localStorage at sync time
                    const bSecs = parseInt(localStorage.getItem('shiftBreakSeconds')) || 0;
                    syncShiftToBackend(next, bSecs);
                }

                // Shift complete — cap at SHIFT_DURATION, completion handled by effect below
                if (next >= SHIFT_DURATION) {
                    return SHIFT_DURATION;
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [shiftStarted, shiftCompleted, isBreakActive, syncShiftToBackend]);

    const handleShiftComplete = async () => {
        setShiftCompleted(true);
        localStorage.setItem('shiftCompleted', 'true');
        const bSecs = parseInt(localStorage.getItem('shiftBreakSeconds')) || 0;
        
        await stopAndUploadScreenRecording();

        try {
            await axios.post(`${backendUrl}/api/cs/shift/complete`, {
                workSeconds: SHIFT_DURATION,
                breakSeconds: bSecs
            }, { headers: { cstoken } });
        } catch (err) {
            console.warn('Shift complete API failed:', err.message);
        }
        toast.success('🎉 Congratulations! You have completed your 10-hour shift!', { autoClose: 8000 });
    };

    // ── Break tick: accumulate break seconds while break is active ──
    useEffect(() => {
        if (!isBreakActive) return;
        const timer = setInterval(() => {
            setShiftBreakSeconds(prev => {
                const next = prev + 1;
                localStorage.setItem('shiftBreakSeconds', next);
                return next;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isBreakActive]);

    // Detect shift completion
    useEffect(() => {
        if (shiftWorkSeconds >= SHIFT_DURATION && shiftStarted && !shiftCompleted) {
            handleShiftComplete();
        }
    }, [shiftWorkSeconds]);

    // CS Messages/Notifications States & API Callers
    const [csMessages, setCsMessages] = useState([]);
    const [unreadCsMessagesCount, setUnreadCsMessagesCount] = useState(0);

    const getCSMessages = async () => {
        if (!cstoken) return [];
        try {
            const { data } = await axios.get(`${backendUrl}/api/cs/messages`, { headers: { cstoken } });
            if (data.success) {
                setCsMessages(data.messages);
                const unread = data.messages.filter(msg => !msg.readByEmployee).length;
                setUnreadCsMessagesCount(unread);
                return data.messages;
            }
        } catch (error) {
            console.error('Failed to fetch CS notifications:', error.message);
        }
        return [];
    };

    const markCSMessageAsRead = async (messageId) => {
        if (!cstoken) return false;
        try {
            const { data } = await axios.post(`${backendUrl}/api/cs/messages/read`, { messageId }, { headers: { cstoken } });
            if (data.success) {
                await getCSMessages();
                return true;
            }
        } catch (error) {
            console.error('Failed to mark CS notification as read:', error.message);
        }
        return false;
    };
    // ── Screen Recording Helpers ──
    const startScreenRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "monitor"
                },
                audio: false
            });

            // Handle browser stop sharing button click
            stream.getVideoTracks()[0].onended = () => {
                handleScreenShareStopped();
            };

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            
            recordingChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordingChunksRef.current.push(e.data);
                }
            };

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = mediaRecorder;
            recordingStartTimeRef.current = Date.now();
            
            mediaRecorder.start(1000); // chunk every 1s
            setIsRecording(true);
            toast.success('Screen recording started successfully!');
        } catch (err) {
            console.error('Failed to start screen recording:', err);
            toast.error('You must allow screen recording to use the Customer Support Portal.');
            setIsRecording(false);
        }
    };

    const handleScreenShareStopped = () => {
        toast.warn('Screen sharing was stopped. You must restart screen recording to continue.');
        setIsRecording(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (err) {
                console.warn('Error stopping media recorder:', err);
            }
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
    };

    const stopAndUploadScreenRecording = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
            return null;
        }

        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            const stream = mediaStreamRef.current;
            const startTime = recordingStartTimeRef.current;

            recorder.onstop = async () => {
                setIsRecording(false);
                const chunks = recordingChunksRef.current;
                if (chunks.length === 0) {
                    resolve(null);
                    return;
                }

                const blob = new Blob(chunks, { type: 'video/webm' });
                const duration = Math.round((Date.now() - startTime) / 1000);

                setIsUploadingRecording(true);
                try {
                    const formData = new FormData();
                    formData.append('recording', blob, `recording_${employee?._id || 'unknown'}_${Date.now()}.webm`);
                    formData.append('durationSeconds', duration);

                    const { data } = await axios.post(`${backendUrl}/api/cs/upload-recording`, formData, {
                        headers: {
                            cstoken,
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (data.success) {
                        toast.success('Screen recording saved to Firebase!');
                        resolve(data.url);
                    } else {
                        toast.error(`Failed to save recording: ${data.message}`);
                        resolve(null);
                    }
                } catch (err) {
                    console.error('Error uploading recording:', err);
                    toast.error('Network error uploading screen recording.');
                    resolve(null);
                } finally {
                    setIsUploadingRecording(false);
                }
            };

            try {
                recorder.stop();
            } catch (err) {
                console.warn('Error stopping media recorder in stopAndUpload:', err);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        });
    };

    // Pause/Resume recording during break or verification
    useEffect(() => {
        if (mediaRecorderRef.current) {
            if (isBreakActive || isPostBreakVerification) {
                if (mediaRecorderRef.current.state === 'recording') {
                    try {
                        mediaRecorderRef.current.pause();
                        toast.info('Screen recording paused during break/verification.');
                    } catch (err) {
                        console.warn('Error pausing recorder:', err);
                    }
                }
            } else {
                if (mediaRecorderRef.current.state === 'paused') {
                    try {
                        mediaRecorderRef.current.resume();
                        toast.info('Screen recording resumed.');
                    } catch (err) {
                        console.warn('Error resuming recorder:', err);
                    }
                }
            }
        }
    }, [isBreakActive, isPostBreakVerification]);

    // ── Regular logout (no reason required — shift is done OR fallback) ──
    const logout = async () => {
        try {
            await stopAndUploadScreenRecording();
            await axios.post(backendUrl + '/api/cs/logout', { employeeId: employee?._id }, { headers: { cstoken } });
        } catch (error) {
            console.log(error.message);
        } finally {
            clearShiftState();
            localStorage.removeItem('cstoken');
            setCSToken('');
            setEmployee(false);
            toast.success('Logged out successfully');
        }
    };

    // ── Early logout: requires reason, cannot logout during break ──
    const requestEarlyLogout = () => {
        if (isBreakActive) {
            toast.error('You cannot logout while on a break. Please resume your session first.');
            return;
        }
        setShowEarlyLogoutModal(true);
    };

    const submitEarlyLogout = async (reason) => {
        if (!reason || !reason.trim()) {
            toast.error('Please provide a reason for early logout.');
            return;
        }
        try {
            const workSecs = parseInt(localStorage.getItem('shiftWorkSeconds')) || 0;
            const breakSecs = parseInt(localStorage.getItem('shiftBreakSeconds')) || 0;

            await stopAndUploadScreenRecording();

            await axios.post(`${backendUrl}/api/cs/shift/early-logout`, {
                reason: reason.trim(),
                workSeconds: workSecs,
                breakSeconds: breakSecs
            }, { headers: { cstoken } });

            setShowEarlyLogoutModal(false);
            clearShiftState();
            localStorage.removeItem('cstoken');
            setCSToken('');
            setEmployee(false);
            toast.success('Logged out. Your early exit has been recorded for admin review.');
        } catch (error) {
            toast.error(error.message);
        }
    };

    const clearShiftState = () => {
        setShiftWorkSeconds(0);
        setShiftBreakSeconds(0);
        setShiftStarted(false);
        setShiftCompleted(false);
        setShiftBreakCount(0);
        localStorage.removeItem('shiftWorkSeconds');
        localStorage.removeItem('shiftBreakSeconds');
        localStorage.removeItem('shiftStarted');
        localStorage.removeItem('shiftCompleted');
        localStorage.removeItem('shiftBreakCount');
        localStorage.removeItem('cs_isBypassed');
        // Clear break state too
        setIsBreakActive(false);
        setBreakTimeRemaining(0);
        setHasReachedMax(false);
        setBreakStartTime(null);
        localStorage.setItem('isBreakActive', 'false');
        localStorage.setItem('breakTimeRemaining', 0);
        localStorage.setItem('hasReachedMax', 'false');
        localStorage.removeItem('breakStartTime');
        setPostBreakVerification(false);
        localStorage.setItem('isPostBreakVerification', 'false');
    };

    useEffect(() => {
        if (cstoken) {
            getEmployeeProfile();
        } else {
            setLoading(false);
        }
    }, [cstoken]);

    // Start shift timer once employee is loaded and authenticated
    useEffect(() => {
        if (cstoken && employee && !shiftStarted && !shiftCompleted) {
            const isBypassed = localStorage.getItem('cs_isBypassed') === 'true';
            if (!isBypassed) {
                setShiftStarted(true);
                localStorage.setItem('shiftStarted', 'true');
            }
        }
    }, [cstoken, employee, shiftStarted, shiftCompleted]);

    useEffect(() => {
        if (cstoken && employee) {
            fetchIncomingRequests();
            const interval = setInterval(fetchIncomingRequests, 1500); 
            return () => clearInterval(interval);
        }
    }, [cstoken, employee]);

    useEffect(() => {
        if (cstoken && employee) {
            getCSMessages();
            const interval = setInterval(getCSMessages, 10000); 
            return () => clearInterval(interval);
        }
    }, [cstoken, employee]);

    // Break Timer Effect
    useEffect(() => {
        let timer;
        if (isBreakActive && breakTimeRemaining > 0) {
            timer = setInterval(() => {
                setBreakTimeRemaining(prev => {
                    const next = prev - 1;
                    localStorage.setItem('breakTimeRemaining', next);
                    if (next <= 0) {
                        stopBreak();
                        return 0;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isBreakActive, breakTimeRemaining]);

    const startBreak = async (minutes) => {
        const seconds = minutes * 60;
        setBreakTimeRemaining(seconds);
        setIsBreakActive(true);
        const reachedMax = minutes >= 30;
        setHasReachedMax(reachedMax);
        
        // Increment the break count for this shift
        setShiftBreakCount(prev => {
            const next = prev + 1;
            localStorage.setItem('shiftBreakCount', next);
            return next;
        });

        const now = new Date().toISOString();
        if (!breakStartTime) {
            setBreakStartTime(now);
            localStorage.setItem('breakStartTime', now);
        }

        localStorage.setItem('isBreakActive', 'true');
        localStorage.setItem('breakTimeRemaining', seconds);
        localStorage.setItem('hasReachedMax', reachedMax ? 'true' : 'false');
        
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
        }
        
        toast.info(`Break started for ${minutes} minutes. Shift timer paused.`);
    };

    const stopBreak = async () => {
        if (breakStartTime) {
            const endTime = new Date();
            const start = new Date(breakStartTime);
            const durationSecs = Math.round((endTime - start) / 1000);
            
            try {
                await axios.post(`${backendUrl}/api/cs/log-break`, {
                    duration: durationSecs,
                    startTime: start.toISOString(),
                    endTime: endTime.toISOString()
                }, { headers: { cstoken } });
                getEmployeeProfile();
            } catch (error) {
                console.error('Failed to log break:', error);
            }
        }

        setIsBreakActive(false);
        setBreakTimeRemaining(0);
        setHasReachedMax(false);
        setBreakStartTime(null);
        localStorage.setItem('isBreakActive', 'false');
        localStorage.setItem('breakTimeRemaining', 0);
        localStorage.setItem('hasReachedMax', 'false');
        localStorage.removeItem('breakStartTime');
        
        // Trigger Post-Break Verification
        setPostBreakVerification(true);
        localStorage.setItem('isPostBreakVerification', 'true');
        
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.warn('Exit fullscreen failed:', err);
        }
        
        toast.success('Break ended. Please verify your identity to resume.');
    };

    const increaseBreak = (minutes) => {
        setBreakTimeRemaining(prev => {
            const next = Math.min(prev + minutes * 60, 30 * 60);
            if (next >= 1800) {
                setHasReachedMax(true);
                localStorage.setItem('hasReachedMax', 'true');
            }
            localStorage.setItem('breakTimeRemaining', next);
            return next;
        });
        toast.success(`Break extended by ${minutes} minutes`);
    };

    // Global Socket Connection for CS Portal
    useEffect(() => {
        if (!backendUrl || !cstoken) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        console.log("Initializing Global CS Socket Connection...");
        const newSocket = io(backendUrl, {
            transports: ['polling', 'websocket']
        });

        newSocket.on('connect', () => {
            console.log('Global CS socket connected successfully:', newSocket.id);
            newSocket.emit('join-cs-room');
        });

        newSocket.on('emergency-alert-triggered', (data) => {
            console.log('Global CS emergency-alert-triggered event:', data);
            toast.error(
                `🚨 Emergency Vet Alert: CS Agent "${data.agentName}" has suggested an Emergency Vet Visit for pet "${data.petName}". User has been notified via email.`,
                {
                    position: 'top-center',
                    autoClose: false,
                    closeOnClick: false,
                    draggable: false,
                    theme: 'colored',
                    icon: '🚨'
                }
            );
        });

        setSocket(newSocket);

        return () => {
            console.log("Cleaning up Global CS Socket Connection...");
            newSocket.disconnect();
        };
    }, [backendUrl, cstoken]);

    // Computed shift values
    const shiftSecondsRemaining = Math.max(0, SHIFT_DURATION - shiftWorkSeconds);
    const shiftProgress = Math.min(100, (shiftWorkSeconds / SHIFT_DURATION) * 100);

    return (
        <CSContext.Provider value={{
            cstoken, setCSToken,
            employee, setEmployee, getEmployeeProfile,
            incomingRequests, setIncomingRequests, fetchIncomingRequests,
            loading, backendUrl, logout,
            isBreakActive, setIsBreakActive, breakTimeRemaining, setBreakTimeRemaining,
            hasReachedMax, setHasReachedMax,
            startBreak, stopBreak, increaseBreak,
            isPostBreakVerification, setPostBreakVerification,
            // Shift timer
            shiftWorkSeconds, shiftBreakSeconds,
            shiftStarted, shiftCompleted,
            shiftSecondsRemaining, shiftProgress,
            SHIFT_DURATION, shiftBreakCount,
            showEarlyLogoutModal, setShowEarlyLogoutModal,
            requestEarlyLogout, submitEarlyLogout,
            performanceData, leaderboard, fetchPerformance, fetchLeaderboard,
            csMessages, unreadCsMessagesCount, getCSMessages, markCSMessageAsRead,
            socket,
            // Screen Recording
            isRecording, setIsRecording,
            isUploadingRecording, setIsUploadingRecording,
            startScreenRecording, stopAndUploadScreenRecording
        }}>
            {children}
        </CSContext.Provider>
    );
};
