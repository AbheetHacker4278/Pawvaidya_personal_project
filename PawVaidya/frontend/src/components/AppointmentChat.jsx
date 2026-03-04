import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircle, User, Stethoscope, Paperclip, Image, Video, File } from 'lucide-react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import io from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { translateSpeciality } from '../utils/translateSpeciality';
import RunningDogLoader from './RunningDogLoader';

const AppointmentChat = ({ appointment, onClose }) => {
  const { backendurl, token, userdata } = useContext(AppContext);
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [loadedMedia, setLoadedMedia] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!userdata) {
      console.log('Waiting for userdata to load...');
      return; // Wait for user data to load
    }

    const userId = userdata._id || userdata.id;
    console.log('Initializing socket connection for user:', userId);
    const newSocket = io(backendurl, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    setSocket(newSocket);

    // Join the appointment room
    console.log('Joining room:', appointment._id);
    newSocket.emit('join-room', appointment._id);

    // Listen for incoming messages
    newSocket.on('receive-chat-message', (data) => {
      console.log('Received message via socket:', data);
      setMessages(prev => [...(Array.isArray(prev) ? prev : []), {
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        timestamp: data.timestamp
      }]);
    });

    // Listen for typing events
    newSocket.on('typing-start', () => {
      console.log('Other user is typing');
      setIsTyping(true);
    });

    newSocket.on('typing-stop', () => {
      console.log('Other user stopped typing');
      setIsTyping(false);
    });

    return () => {
      console.log('Leaving room and disconnecting socket');
      newSocket.emit('leave-room', appointment._id);
      newSocket.disconnect();
    };
  }, [appointment._id, backendurl, userdata]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data } = await axios.get(
          `${backendurl}/api/chat/messages/${appointment._id}`,
          { headers: { token } }
        );

        console.log('Loaded messages:', data);

        if (data.success) {
          setMessages(data.messages || []);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // Auto-refresh messages every 5 seconds
    const refreshInterval = setInterval(() => {
      loadMessages();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [appointment._id, backendurl, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('Message is empty');
      return;
    }

    // Check for both _id and id (different data structures)
    const userId = userdata?._id || userdata?.id;
    if (!userId) {
      console.error('User data not loaded:', userdata);
      return;
    }

    const messageData = {
      appointmentId: appointment._id,
      senderId: userId,
      senderType: 'user',
      message: newMessage,
      timestamp: new Date()
    };

    console.log('User ID:', userId);

    console.log('Sending message:', messageData);

    try {
      // Save to database
      const { data } = await axios.post(
        `${backendurl}/api/chat/send`,
        messageData,
        { headers: { token } }
      );

      console.log('Server response:', data);

      if (data.success) {
        // Don't add to local state - it will come back via socket
        // This prevents duplicate messages

        // Emit via socket to notify other users
        if (socket) {
          console.log('Emitting via socket');
          socket.emit('send-chat-message', messageData);
        } else {
          console.error('Socket not connected');
        }

        // Add to local state immediately for instant feedback
        setMessages(prev => [...(Array.isArray(prev) ? prev : []), messageData]);

        setNewMessage('');
      } else {
        console.error('Failed to send message:', data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket) return;

    // Emit typing start
    socket.emit('typing-start', { appointmentId: appointment._id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit typing stop after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', { appointmentId: appointment._id });
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    const userId = userdata._id || userdata.id;
    if (!userId) {
      console.error('User data not loaded');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', appointment._id);
    formData.append('senderId', userId);
    formData.append('senderType', 'user');
    formData.append('message', `Sent a file: ${file.name}`);

    try {
      const { data } = await axios.post(
        `${backendurl}/api/chat/upload-file`,
        formData,
        {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('File upload response:', data);

      if (data.success) {
        // Add to local state
        setMessages(prev => [...(Array.isArray(prev) ? prev : []), data.data]);

        // Emit via socket
        if (socket) {
          socket.emit('send-chat-message', data.data);
        }

        setSelectedFile(null);
      } else {
        alert('Failed to upload file: ' + data.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Show loading if userdata is not available
  if (!userdata || (!userdata._id && !userdata.id)) {
    console.log('User data check:', { userdata, token });
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="bg-white rounded-3xl p-8 text-center max-w-md">
          <div className="flex justify-center">
            <RunningDogLoader />
          </div>
          <p className="mt-4 text-gray-600 font-semibold">Loading your profile...</p>
          <p className="mt-2 text-sm text-gray-500">If this takes too long, please refresh the page</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5A4035] to-[#7a5a48] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={appointment.docData.image}
                  alt={appointment.docData.name}
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">Dr. {appointment.docData.name}</h3>
                <p className="text-sm text-amber-100">{translateSpeciality(appointment.docData.speciality, t)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-amber-50/30 to-white"
        >
          <AnimatePresence>
            {messages && messages.length > 0 ? messages.map((msg, index) => {
              const isUser = msg.senderType === 'user';
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-[#5A4035]' : 'bg-green-500'
                      }`}>
                      {isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Stethoscope className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className={`rounded-2xl overflow-hidden ${(!msg.messageType || msg.messageType === 'text') && !msg.fileUrl ? 'px-4 py-2' : 'p-0'
                        } ${isUser
                          ? 'bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                        {/* Text Message */}
                        {(!msg.messageType || msg.messageType === 'text') && !msg.fileUrl && (
                          <p className="text-sm">{msg.message}</p>
                        )}

                        {/* Image Message */}
                        {msg.messageType === 'image' && (
                          <div className="relative">
                            {!loadedMedia[msg.fileUrl] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 min-h-[100px]">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
                              </div>
                            )}
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName}
                              className={`max-w-xs max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity ${!loadedMedia[msg.fileUrl] ? 'opacity-0' : 'opacity-100'}`}
                              onClick={() => setPreviewMedia({ type: 'image', url: msg.fileUrl, name: msg.fileName })}
                              onLoad={() => setLoadedMedia(prev => ({ ...prev, [msg.fileUrl]: true }))}
                              onError={() => setLoadedMedia(prev => ({ ...prev, [msg.fileUrl]: true }))}
                            />
                            {msg.message && <p className="text-sm px-4 py-2">{msg.message}</p>}
                          </div>
                        )}

                        {/* Video Message */}
                        {msg.messageType === 'video' && (
                          <div>
                            <div className="relative group">
                              {!loadedMedia[msg.fileUrl] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 min-h-[100px] pointer-events-none z-10">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
                                </div>
                              )}
                              <video
                                src={msg.fileUrl}
                                controls
                                className={`max-w-xs max-h-64 cursor-pointer ${!loadedMedia[msg.fileUrl] ? 'opacity-0' : 'opacity-100'}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPreviewMedia({ type: 'video', url: msg.fileUrl, name: msg.fileName });
                                }}
                                onLoadedData={() => setLoadedMedia(prev => ({ ...prev, [msg.fileUrl]: true }))}
                                onError={() => setLoadedMedia(prev => ({ ...prev, [msg.fileUrl]: true }))}
                              />
                              <div
                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all cursor-pointer flex items-center justify-center"
                                onClick={() => setPreviewMedia({ type: 'video', url: msg.fileUrl, name: msg.fileName })}
                              >
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3">
                                  <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                            {msg.message && <p className="text-sm px-4 py-2">{msg.message}</p>}
                          </div>
                        )}

                        {/* File Message */}
                        {msg.messageType === 'file' && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 hover:opacity-80"
                          >
                            <File className="w-5 h-5" />
                            <div>
                              <p className="text-sm font-semibold">{msg.fileName}</p>
                              <p className="text-xs opacity-70">
                                {(msg.fileSize / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </a>
                        )}
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className="flex gap-2 items-center">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                    <Stethoscope className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {isTyping && (
            <p className="text-xs text-gray-500 mb-2 ml-2">Dr. {appointment.docData.name} is typing...</p>
          )}
          <div className="flex gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {/* File attachment button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </motion.button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder={uploading ? "Uploading..." : "Type your message..."}
              disabled={uploading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A4035] focus:border-transparent disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={uploading}
              className="px-6 py-3 bg-gradient-to-r from-[#5A4035] to-[#7a5a48] text-white rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              Send
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
            onClick={() => setPreviewMedia(null)}
          >
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[90vh] overflow-auto"
            >
              {previewMedia.type === 'image' && (
                <div className="text-center">
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.name}
                    className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg shadow-2xl"
                  />
                  <p className="text-white mt-4 text-sm">{previewMedia.name}</p>
                  <a
                    href={previewMedia.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              )}

              {previewMedia.type === 'video' && (
                <div className="text-center">
                  <video
                    src={previewMedia.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] mx-auto rounded-lg shadow-2xl"
                  />
                  <p className="text-white mt-4 text-sm">{previewMedia.name}</p>
                  <a
                    href={previewMedia.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Download Video
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AppointmentChat;
