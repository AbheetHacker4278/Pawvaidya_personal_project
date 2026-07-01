import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

export const CSContext = createContext();

const SHIFT_DURATION = 10 * 60 * 60; // 10 hours in seconds
const SYNC_INTERVAL = 60; // sync to backend every 60 seconds

const DB_NAME = 'CS_ScreenRecording_DB';
const STORE_NAME = 'chunks';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { autoIncrement: true });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const saveChunkToDB = async (chunk) => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(chunk);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Failed to save chunk to IndexedDB', err);
    }
};

const getChunksFromDB = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Failed to get chunks from IndexedDB', err);
        return [];
    }
};

const clearChunksFromDB = async () => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.error('Failed to clear chunks in IndexedDB', err);
    }
};

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
    const isBypassed = localStorage.getItem('cs_isBypassed') === 'true';
    const [shiftStarted, setShiftStarted] = useState(localStorage.getItem('shiftStarted') === 'true' && !isBypassed);
    const [shiftCompleted, setShiftCompleted] = useState(localStorage.getItem('shiftCompleted') === 'true' && !isBypassed);
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
            
            // Do NOT clear chunks if we already have chunks from the current active shift
            const existingChunks = await getChunksFromDB();
            if (!existingChunks || existingChunks.length === 0) {
                recordingChunksRef.current = [];
                await clearChunksFromDB();
                recordingStartTimeRef.current = Date.now();
                localStorage.setItem('cs_recordingStartTime', recordingStartTimeRef.current);
            } else {
                recordingChunksRef.current = existingChunks;
                if (!localStorage.getItem('cs_recordingStartTime')) {
                    recordingStartTimeRef.current = Date.now() - (existingChunks.length * 1000);
                    localStorage.setItem('cs_recordingStartTime', recordingStartTimeRef.current);
                } else {
                    recordingStartTimeRef.current = parseInt(localStorage.getItem('cs_recordingStartTime'));
                }
                console.log(`Resuming screen recording with ${existingChunks.length} existing chunks.`);
            }

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data && e.data.size > 0) {
                    recordingChunksRef.current.push(e.data);
                    await saveChunkToDB(e.data);
                }
            };

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = mediaRecorder;
            
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
            // Even if media recorder is not running, we might still have chunks in IndexedDB to upload!
            const chunks = await getChunksFromDB();
            if (chunks && chunks.length > 0) {
                setIsRecording(false);
                const blob = new Blob(chunks, { type: 'video/webm' });
                const startTime = parseInt(localStorage.getItem('cs_recordingStartTime')) || (Date.now() - chunks.length * 1000);
                const duration = Math.round((Date.now() - startTime) / 1000);
                await clearChunksFromDB();
                localStorage.removeItem('cs_recordingStartTime');

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
                        return data.url;
                    } else {
                        toast.error(`Failed to save recording: ${data.message}`);
                        return null;
                    }
                } catch (err) {
                    console.error('Error uploading recording:', err);
                    toast.error('Network error uploading screen recording.');
                    return null;
                } finally {
                    setIsUploadingRecording(false);
                }
            }
            return null;
        }

        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;
            const stream = mediaStreamRef.current;

            recorder.onstop = async () => {
                setIsRecording(false);
                const chunks = await getChunksFromDB();
                if (!chunks || chunks.length === 0) {
                    await clearChunksFromDB();
                    localStorage.removeItem('cs_recordingStartTime');
                    resolve(null);
                    return;
                }

                const blob = new Blob(chunks, { type: 'video/webm' });
                const startTime = parseInt(localStorage.getItem('cs_recordingStartTime')) || recordingStartTimeRef.current || Date.now();
                const duration = Math.round((Date.now() - startTime) / 1000);
                await clearChunksFromDB();
                localStorage.removeItem('cs_recordingStartTime');

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
        localStorage.removeItem('cs_recordingStartTime');
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

    // Auto-restore cached chunks to memory if shift is active
    useEffect(() => {
        const restoreChunks = async () => {
            if (!cstoken || !employee) return;
            if (shiftStarted && !shiftCompleted) {
                try {
                    const existingChunks = await getChunksFromDB();
                    if (existingChunks && existingChunks.length > 0) {
                        console.log(`Restored ${existingChunks.length} chunks from IndexedDB to local ref.`);
                        recordingChunksRef.current = existingChunks;
                        const savedStartTime = localStorage.getItem('cs_recordingStartTime');
                        if (savedStartTime) {
                            recordingStartTimeRef.current = parseInt(savedStartTime);
                        } else {
                            recordingStartTimeRef.current = Date.now() - (existingChunks.length * 1000);
                            localStorage.setItem('cs_recordingStartTime', recordingStartTimeRef.current);
                        }
                    }
                } catch (err) {
                    console.warn('Failed to restore chunks:', err);
                }
            }
        };
        restoreChunks();
    }, [cstoken, employee, shiftStarted, shiftCompleted]);

    // Auto-upload cached chunks from previous page-load/refresh (only if shift is not active)
    useEffect(() => {
        const checkAndUploadCachedRecording = async () => {
            if (!cstoken || !employee) return;
            // Only upload/recover if the shift is not currently active (meaning leftover from a previous day/session)
            if (shiftStarted && !shiftCompleted) {
                return;
            }
            
            try {
                const cachedChunks = await getChunksFromDB();
                if (cachedChunks && cachedChunks.length > 0) {
                    console.log(`Found ${cachedChunks.length} cached screen recording chunks from a completed/stale session. Uploading...`);
                    
                    const blob = new Blob(cachedChunks, { type: 'video/webm' });
                    const duration = cachedChunks.length; 
                    
                    const formData = new FormData();
                    formData.append('recording', blob, `recording_recovered_${employee?._id || 'unknown'}_${Date.now()}.webm`);
                    formData.append('durationSeconds', duration);

                    axios.post(`${backendUrl}/api/cs/upload-recording`, formData, {
                        headers: {
                            cstoken,
                            'Content-Type': 'multipart/form-data'
                        }
                    }).then(({ data }) => {
                        if (data.success) {
                            console.log('Recovered screen recording uploaded and saved successfully.');
                            toast.info('Your prior screen recording session was recovered and uploaded.');
                        } else {
                            console.warn('Failed to upload recovered screen recording:', data.message);
                        }
                    }).catch(err => {
                        console.error('Error uploading recovered recording:', err);
                    }).finally(async () => {
                        await clearChunksFromDB();
                        localStorage.removeItem('cs_recordingStartTime');
                    });
                }
            } catch (err) {
                console.error('Failed to process cached recording chunks:', err);
            }
        };

        if (cstoken && employee) {
            checkAndUploadCachedRecording();
        }
    }, [cstoken, employee, shiftStarted, shiftCompleted]);

    // Prevent accidental page refreshes when recording
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isRecording) {
                e.preventDefault();
                e.returnValue = 'Screen recording is active. Refreshing the page will stop the current recording session. Are you sure you want to leave?';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isRecording]);

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
        if (socket && employee && employee._id) {
            socket.emit('cs-mirror-start', employee._id);
            return () => {
                socket.emit('cs-mirror-stop', employee._id);
            };
        }
    }, [socket, employee]);

    const cursorPositionRef = useRef({ x: 0, y: 0 });
    const lastActivityTimeRef = useRef(Date.now());
    const idleLoggedRef = useRef(false);

    useEffect(() => {
        if (!cstoken || !employee || !socket) return;

        const handleMouseMove = (e) => {
            cursorPositionRef.current = {
                x: Math.round((e.clientX / window.innerWidth) * 100),
                y: Math.round((e.clientY / window.innerHeight) * 100)
            };
            lastActivityTimeRef.current = Date.now();
            idleLoggedRef.current = false;
        };

        const handleActivity = () => {
            lastActivityTimeRef.current = Date.now();
            idleLoggedRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);

        const frameInterval = setInterval(() => {
            let lastAction = "Active on portal";
            let ticketId = "";
            const path = window.location.pathname;
            if (path.startsWith('/ticket/')) {
                ticketId = path.split('/ticket/')[1] || "";
                lastAction = `Viewing Ticket #${ticketId}`;
            } else if (path === '/queue') {
                lastAction = "Browsing Complaint Queue";
            } else if (path === '/customer-360') {
                lastAction = "Viewing Customer 360";
            } else if (path === '/chat') {
                lastAction = "In Admin Comms Chat";
            } else if (path === '/profile') {
                lastAction = "Reviewing Performance";
            }

            const secondsIdle = Math.floor((Date.now() - lastActivityTimeRef.current) / 1000);
            if (secondsIdle >= 5) {
                lastAction = `Idle for ${Math.floor(secondsIdle)}s`;
            }

            socket.emit('cs-mirror-frame', {
                employeeId: employee._id,
                routeName: path,
                ticketId: ticketId,
                cursorX: cursorPositionRef.current.x,
                cursorY: cursorPositionRef.current.y,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                scrollX: Math.round((window.scrollX / (document.documentElement.scrollWidth - window.innerWidth || 1)) * 100),
                scrollY: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1)) * 100),
                lastAction,
                isOnline: true,
                timestamp: Date.now()
            });

            if (secondsIdle >= 300 && !idleLoggedRef.current) {
                idleLoggedRef.current = true;
                axios.post(`${backendUrl}/api/cs/log-idle`, {
                    durationSeconds: secondsIdle,
                    ticketId: ticketId
                }, { headers: { cstoken } }).then(({ data }) => {
                    if (data.success) {
                        toast.warn('⚠️ Idle alert logged: you have been idle on this ticket for more than 5 minutes.');
                        getEmployeeProfile();
                    }
                }).catch(err => console.warn('Failed to log idle time:', err));
            }
        }, 1500);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            clearInterval(frameInterval);
        };
    }, [cstoken, employee, socket, backendUrl]);
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

        newSocket.on('gamification-update', (data) => {
            console.log('Global CS gamification-update event:', data);
            // Refresh performance and leaderboard on update
            fetchPerformance();
            fetchLeaderboard();
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
            isBypassed,
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
