import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DoctorContext } from '../context/DoctorContext';
import io from 'socket.io-client';

const useDoctorBanListener = () => {
  const navigate = useNavigate();
  const { dtoken, setDtoken, docData, setDocData, backendurl } = useContext(DoctorContext);

  useEffect(() => {
    if (!dtoken || !docData) return;

    // Connect to socket server
    const socket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    // Listen for doctor ban event
    socket.on('doctor-banned', (data) => {
      console.log('Doctor banned event received:', data);

      // Check if this doctor is the one being banned
      if (docData._id === data.doctorId || docData.id === data.doctorId) {
        // Clear token and doctor data
        setDtoken('');
        setDocData(null);
        localStorage.removeItem('dtoken');
        localStorage.removeItem('docData');

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
      socket.off('doctor-banned');
      socket.disconnect();
    };
  }, [dtoken, docData, navigate, setDtoken, setDocData, backendurl]);
};

export default useDoctorBanListener;
