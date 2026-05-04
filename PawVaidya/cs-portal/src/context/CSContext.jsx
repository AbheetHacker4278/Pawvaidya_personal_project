import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export const CSContext = createContext();

export const CSProvider = ({ children }) => {
    const [cstoken, setCSToken] = useState(localStorage.getItem('cstoken') || '');
    const [employee, setEmployee] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

    const getEmployeeProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/cs/profile', { headers: { cstoken } });
            if (data.success) {
                setEmployee(data.employee);
            }
        } catch (error) {
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    }

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
    }

    const logout = async () => {
        try {
            await axios.post(backendUrl + '/api/cs/logout', { employeeId: employee?._id }, { headers: { cstoken } });
            localStorage.removeItem('cstoken');
            setCSToken('');
            setEmployee(false);
            toast.success("Logged out successfully");
        } catch (error) {
            console.log(error.message);
        }
    };

    useEffect(() => {
        if (cstoken) {
            getEmployeeProfile();
        } else {
            setLoading(false);
        }
    }, [cstoken]);

    useEffect(() => {
        if (cstoken && employee) {
            fetchIncomingRequests();
            // Fast polling (1.5s) to ensure "near real-time" updates 
            // without the overhead/conflicts of external socket libraries
            const interval = setInterval(fetchIncomingRequests, 1500); 
            return () => clearInterval(interval);
        }
    }, [cstoken, employee]);

    return (
        <CSContext.Provider value={{
            cstoken, setCSToken,
            employee, setEmployee, getEmployeeProfile,
            incomingRequests, setIncomingRequests, fetchIncomingRequests,
            loading, backendUrl, logout
        }}>
            {children}
        </CSContext.Provider>
    );
};

