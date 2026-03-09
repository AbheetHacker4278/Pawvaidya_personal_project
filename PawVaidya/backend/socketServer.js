import { Server } from 'socket.io';
import http from 'http';

let io;

export const initializeSocket = (server) => {
  const allowedorigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'https://pawvaidya-79qq.onrender.com', 'https://pawvaidya-admin-uy9o.onrender.com'];

  io = new Server(server, {
    cors: {
      origin: allowedorigins,
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  const activeLiveStreams = new Set();
  const activeAdminStreams = new Set();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Live Stream Events
    socket.on('start-stream', (docId) => {
      console.log(`Doctor ${docId} started streaming`);
      activeLiveStreams.add(docId);
      socket.data = { ...socket.data, streamDocId: docId }; // Track docId on socket
      io.emit('active-live-streams', Array.from(activeLiveStreams));
    });

    socket.on('end-stream', (docId) => {
      console.log(`Doctor ${docId} ended streaming`);
      activeLiveStreams.delete(docId);
      if (socket.data.streamDocId === docId) delete socket.data.streamDocId;
      io.emit('active-live-streams', Array.from(activeLiveStreams));
    });

    socket.on('request-active-streams', () => {
      socket.emit('active-live-streams', Array.from(activeLiveStreams));
    });

    // Admin Live Stream Events
    socket.on('start-admin-stream', (adminId) => {
      console.log(`Admin ${adminId} started streaming`);
      activeAdminStreams.add(adminId);
      socket.data = { ...socket.data, streamAdminId: adminId }; // Track adminId on socket
      io.emit('active-admin-streams', Array.from(activeAdminStreams));
    });

    socket.on('end-admin-stream', (adminId) => {
      console.log(`Admin ${adminId} ended streaming`);
      activeAdminStreams.delete(adminId);
      if (socket.data.streamAdminId === adminId) delete socket.data.streamAdminId;
      io.emit('active-admin-streams', Array.from(activeAdminStreams));
    });

    socket.on('request-active-admin-streams', () => {
      socket.emit('active-admin-streams', Array.from(activeAdminStreams));
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', (data) => {
      socket.to(data.appointmentId).emit('offer', {
        offer: data.offer,
        from: socket.id,
      });
    });

    socket.on('answer', (data) => {
      socket.to(data.appointmentId).emit('answer', {
        answer: data.answer,
        from: socket.id,
      });
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.appointmentId).emit('ice-candidate', {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', socket.id);
      console.log(`User ${socket.id} left room: ${roomId}`);
    });

    socket.on('chat-message', (data) => {
      console.log(`Chat message in room ${data.appointmentId}:`, data.message);
      // Broadcast message to all other users in the room
      socket.to(data.appointmentId).emit('chat-message', {
        message: data.message,
        sender: data.sender,
        senderType: data.senderType,
        timestamp: data.timestamp,
        isEmoji: data.isEmoji,
      });
    });

    // New chat message event for appointment chat
    socket.on('send-chat-message', (data) => {
      console.log(`New chat message in appointment ${data.appointmentId}`, data);
      // Broadcast to OTHER users in the appointment room (not sender)
      socket.to(data.appointmentId).emit('receive-chat-message', {
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        messageType: data.messageType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        timestamp: data.timestamp,
      });
    });

    socket.on('typing-start', (data) => {
      console.log(`User typing in room ${data.appointmentId}`);
      socket.to(data.appointmentId).emit('typing-start');
    });

    socket.on('typing-stop', (data) => {
      console.log(`User stopped typing in room ${data.appointmentId}`);
      socket.to(data.appointmentId).emit('typing-stop');
    });

    socket.on('screen-share-start', (data) => {
      console.log(`Screen sharing started in room ${data.appointmentId}`);
      socket.to(data.appointmentId).emit('screen-share-start');
    });

    socket.on('screen-share-stop', (data) => {
      console.log(`Screen sharing stopped in room ${data.appointmentId}`);
      socket.to(data.appointmentId).emit('screen-share-stop');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      // Cleanup Admin Stream if exists for this socket
      if (socket.data && socket.data.streamAdminId) {
        const adminId = socket.data.streamAdminId;
        console.log(`Cleaning up Admin Stream for disconnected socket: ${adminId}`);
        activeAdminStreams.delete(adminId);
        io.emit('active-admin-streams', Array.from(activeAdminStreams));
      }

      // Cleanup Doctor Stream if exists for this socket
      if (socket.data && socket.data.streamDocId) {
        const docId = socket.data.streamDocId;
        console.log(`Cleaning up Doctor Stream for disconnected socket: ${docId}`);
        activeLiveStreams.delete(docId);
        io.emit('active-live-streams', Array.from(activeLiveStreams));
      }
    });

    // Direct Chat Events
    socket.on('join-direct-chat', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined direct chat room`);
    });

    socket.on('send-direct-message', (data) => {
      // This event is for client-to-server, but we handle message saving in controller
      // and server-to-client emission there. 
      // This listener might be redundant if we only use API for sending, 
      // but useful if we want pure socket communication later.
      console.log('Direct message received via socket:', data);
    });

    socket.on('direct-typing-start', (data) => {
      socket.to(`user-${data.receiverId}`).emit('direct-typing-start', { senderId: data.senderId });
    });

    socket.on('direct-typing-stop', (data) => {
      socket.to(`user-${data.receiverId}`).emit('direct-typing-stop', { senderId: data.senderId });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
