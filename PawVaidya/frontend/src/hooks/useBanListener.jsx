import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import io from 'socket.io-client';

const useBanListener = () => {
  const navigate = useNavigate();
  const { token, setToken, userData, setUserData, backendurl } = useContext(AppContext);

  useEffect(() => {
    if (!token || !userData) return;

    // Connect to socket server
    const socket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    // Listen for user ban event
    socket.on('user-banned', (data) => {
      console.log('User banned event received:', data);

      // Check if this user is the one being banned
      if (userData._id === data.userId || userData.id === data.userId) {
        // Clear token and user data
        setToken('');
        setUserData(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');

        // Show ban message
        toast.error(data.message, {
          position: 'top-center',
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: false,
        });

        // Redirect to login
        navigate('/login');
      }
    });

    // Cleanup on unmount
    return () => {
      socket.off('user-banned');
      socket.disconnect();
    };
  }, [token, userData, navigate, setToken, setUserData, backendurl]);
};

export default useBanListener;
