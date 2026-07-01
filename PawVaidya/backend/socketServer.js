import { Server } from 'socket.io';
import http from 'http';

let io;

export const initializeSocket = (server) => {
  // Hardcoded production origins — always trusted regardless of env var
  const ALWAYS_ALLOWED = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://pawvaidya-79qq.onrender.com',
    'https://pawvaidya-admin-uy9o.onrender.com',
    'https://customer-service-kx9x.onrender.com',
  ];
  const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
  const allowedorigins = [...new Set([...ALWAYS_ALLOWED, ...extraOrigins])];
  console.log('[Socket.io CORS] Allowed origins:', allowedorigins);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedorigins.includes(origin)) return callback(null, true);
        console.warn(`[Socket.io CORS] Blocked origin: ${origin}`);
        return callback(new Error(`Socket.io CORS: origin '${origin}' not allowed`));
      },
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

    // Ticket Calling events
    socket.on('ticket-call-initiate', (data) => {
      console.log(`Calling user in ticket room ticket-${data.ticketId} from ${data.callerName}`);
      socket.to(`ticket-${data.ticketId}`).emit('incoming-ticket-call', {
        ticketId: data.ticketId,
        callerName: data.callerName,
        fromSocketId: socket.id
      });
    });

    socket.on('ticket-call-accept', (data) => {
      console.log(`Call accepted in room ticket-${data.ticketId}`);
      socket.to(data.toSocketId).emit('ticket-call-accepted', {
        fromSocketId: socket.id
      });
    });

    socket.on('ticket-call-decline', (data) => {
      console.log(`Call declined in room ticket-${data.ticketId}`);
      socket.to(data.toSocketId).emit('ticket-call-declined');
    });

    socket.on('ticket-call-end', (data) => {
      console.log(`Call ended in room ticket-${data.ticketId}`);
      socket.to(`ticket-${data.ticketId}`).emit('ticket-call-ended');
    });

    socket.on('ticket-offer', (data) => {
      socket.to(data.toSocketId).emit('ticket-offer', {
        offer: data.offer,
        fromSocketId: socket.id
      });
    });

    socket.on('ticket-answer', (data) => {
      socket.to(data.toSocketId).emit('ticket-answer', {
        answer: data.answer
      });
    });

    socket.on('ticket-ice-candidate', (data) => {
      socket.to(data.toSocketId).emit('ticket-ice-candidate', {
        candidate: data.candidate
      });
    });

    socket.on('ticket-typing-start', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('ticket-typing-start');
    });

    socket.on('ticket-typing-stop', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('ticket-typing-stop');
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

    // CS Support Events
    socket.on('join-cs-room', () => {
      socket.join('cs-agents');
      console.log(`Socket ${socket.id} joined cs-agents room`);
    });

    // CS Screen Mirroring / Shadowing
    socket.on('cs-mirror-start', (employeeId) => {
      socket.join(`cs-mirror-${employeeId}`);
      console.log(`CS Agent ${employeeId} started screen mirroring`);
    });

    socket.on('cs-mirror-frame', (data) => {
      // Broadcast screen frame and activity telemetry to anyone monitoring this agent
      io.to(`cs-mirror-${data.employeeId}`).emit('cs-mirror-frame', data);
    });

    socket.on('cs-mirror-stop', (employeeId) => {
      io.to(`cs-mirror-${employeeId}`).emit('cs-mirror-stop');
      console.log(`CS Agent ${employeeId} stopped screen mirroring`);
    });

    socket.on('admin-mirror-join', (employeeId) => {
      socket.join(`cs-mirror-${employeeId}`);
      console.log(`Admin joined screen mirroring for agent: ${employeeId}`);
    });

    // Co-Browsing Events
    socket.on('co-browse-request', (data) => {
      console.log(`Co-browse request from agent for ticket ${data.ticketId} targeting user ${data.userId}`);
      io.to(`user-${String(data.userId)}`).emit('co-browse-request', data);
    });

    socket.on('co-browse-accept', (data) => {
      console.log(`Co-browse accepted for ticket ${data.ticketId}`);
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-accept', data);
    });

    socket.on('co-browse-decline', (data) => {
      console.log(`Co-browse declined for ticket ${data.ticketId}`);
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-decline', data);
    });

    socket.on('co-browse-stop', (data) => {
      console.log(`Co-browse stopped for ticket ${data.ticketId}`);
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-stop', data);
    });

    socket.on('co-browse-sync', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-sync', data);
    });

    socket.on('co-browse-highlight', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-highlight', data);
    });

    socket.on('co-browse-mouse-move', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-mouse-move', data);
    });

    socket.on('co-browse-draw-line', (data) => {
      socket.to(`ticket-${data.ticketId}`).emit('co-browse-draw-line', data);
    });

    // ── CS Agent Behavioral Monitoring Events ──────────────────────────────

    // Tab-switch / Focus-loss detection
    // Emitted by CS agent when their tab loses focus during an active ticket session
    socket.on('cs-agent-focus-loss', (data) => {
      const { employeeId, employeeName, ticketId, lostAt } = data;
      console.log(`[MONITOR] Focus loss: Agent ${employeeName} (${employeeId}) on ticket ${ticketId}`);
      // Notify all admin watchers monitoring this agent
      io.to(`cs-monitor-admin`).emit('cs-agent-alert', {
        type: 'focus_loss',
        employeeId,
        employeeName,
        ticketId,
        message: `Agent ${employeeName} switched away from CS portal while handling ticket.`,
        severity: 'medium',
        timestamp: lostAt || new Date().toISOString()
      });
    });

    // Copy-paste anomaly detection
    // Emitted by CS agent when a suspiciously large paste is detected in the chat input
    socket.on('cs-agent-paste-anomaly', (data) => {
      const { employeeId, employeeName, ticketId, pastedLength, preview, pastedAt } = data;
      console.log(`[MONITOR] Paste anomaly: Agent ${employeeName} pasted ${pastedLength} chars in ticket ${ticketId}`);
      io.to(`cs-monitor-admin`).emit('cs-agent-alert', {
        type: 'paste_anomaly',
        employeeId,
        employeeName,
        ticketId,
        message: `Agent ${employeeName} pasted ${pastedLength} characters — possible script/data exfiltration.`,
        preview: preview || '',
        severity: pastedLength > 2000 ? 'high' : 'medium',
        timestamp: pastedAt || new Date().toISOString()
      });
    });

    // Admin subscribes to real-time agent alerts feed
    socket.on('admin-join-monitor', () => {
      socket.join('cs-monitor-admin');
      console.log(`Admin socket ${socket.id} joined cs-monitor-admin room`);
    });

    // Concurrent Ticket Overload Warning
    // Emitted by CS agent whenever their active ticket count changes (from TicketDetail mount/unmount)
    socket.on('cs-agent-ticket-count-update', async (data) => {
      const { employeeId, employeeName, activeCount } = data;
      const OVERLOAD_THRESHOLD = 3;
      if (activeCount > OVERLOAD_THRESHOLD) {
        io.to('cs-monitor-admin').emit('cs-agent-alert', {
          type: 'ticket_overload',
          employeeId,
          employeeName,
          message: `⚠️ Agent ${employeeName} has ${activeCount} open tickets simultaneously — burnout & quality risk!`,
          severity: 'high',
          activeCount,
          timestamp: new Date().toISOString()
        });
        // Persist to DB
        try {
          const CSEmployee = (await import('./models/csEmployeeModel.js')).default;
          await CSEmployee.findByIdAndUpdate(employeeId, {
            activeTicketsCount: activeCount,
            $push: {
              monitoringAlerts: {
                alertType: 'idle_alert',
                message: `Concurrent ticket overload: ${activeCount} tickets open simultaneously.`,
                severity: 'high',
                timestamp: new Date(),
                metadata: { subType: 'ticket_overload', activeCount }
              }
            }
          });
        } catch (e) { console.warn('[Monitor] Overload DB persist failed:', e.message); }
      }
    });

    // CS Agent supervisor escalation alert
    socket.on('cs-agent-supervisor-escalation', (data) => {
      const { employeeId, employeeName, ticketId, message, severity, sentimentScore, label } = data;
      console.log(`[MONITOR] Supervisor escalation request: Agent ${employeeName} (${employeeId}) on ticket ${ticketId} [Sentiment: ${label} (${sentimentScore})]`);
      
      io.to(`cs-monitor-admin`).emit('cs-agent-alert', {
        type: 'supervisor_escalation',
        employeeId,
        employeeName,
        ticketId,
        message: message || `Agent ${employeeName} requested supervisor assistance on ticket #${ticketId}. Customer Sentiment: ${label.toUpperCase()} (${sentimentScore}).`,
        severity: severity || 'high',
        timestamp: new Date().toISOString()
      });
    });

    // Flagged Language Detection
    // Called from TicketDetail when agent submits a message — checked server-side for toxic words
    socket.on('cs-agent-message-check', (data) => {
      const { employeeId, employeeName, ticketId, message } = data;

      // Tiered keyword lists
      const HIGH_RISK = ['idiot', 'stupid', 'moron', 'shut up', 'bastard', 'hell with you', 'screw you'];
      const MEDIUM_RISK = ['useless', 'pathetic', 'ridiculous', 'nonsense', 'crap', 'dumb'];
      const lc = (message || '').toLowerCase();

      const matchedHigh   = HIGH_RISK.filter(w => lc.includes(w));
      const matchedMedium = MEDIUM_RISK.filter(w => lc.includes(w));

      if (matchedHigh.length > 0 || matchedMedium.length > 0) {
        const severity  = matchedHigh.length > 0 ? 'high' : 'medium';
        const matched   = [...matchedHigh, ...matchedMedium];

        io.to('cs-monitor-admin').emit('cs-agent-alert', {
          type: 'language_violation',
          employeeId,
          employeeName,
          ticketId,
          message: `🚨 Flagged language from ${employeeName} in ticket #${ticketId}: [${matched.join(', ')}]`,
          preview: message.substring(0, 200),
          severity,
          timestamp: new Date().toISOString()
        });

        // Persist to DB
        import('./models/csEmployeeModel.js').then(({ default: CSEmployee }) => {
          CSEmployee.findByIdAndUpdate(employeeId, {
            $push: {
              monitoringAlerts: {
                alertType: 'language_violation',
                message: `Policy-violating language used in ticket #${ticketId}: "${message.substring(0, 120)}"`,
                severity,
                timestamp: new Date(),
                metadata: { ticketId, matchedWords: matched, subType: 'language_flag' }
              }
            }
          }).catch(e => console.warn('[Monitor] Language flag DB persist failed:', e.message));
        });
      }
    });

    // Script Adherence score emission from CS portal
    // CS portal periodically emits the script match score for admin visibility
    socket.on('cs-agent-script-score', (data) => {
      const { employeeId, employeeName, ticketId, score, templateName } = data;
      io.to('cs-monitor-admin').emit('cs-agent-script-update', {
        employeeId,
        employeeName,
        ticketId,
        score,
        templateName,
        timestamp: new Date().toISOString()
      });
    });

    // ──────────────────────────────────────────────────────────────────────


    // Emergency Appointment Events
    socket.on('register-doctor-emergency', (data) => {
      const { docId, district } = data;
      if (docId) {
        socket.join(`doctor-${docId}`);
        console.log(`Doctor ${docId} registered for emergency direct notifications`);
      }
      if (district) {
        const cleanDistrict = district.trim().toUpperCase();
        socket.join(`emergency-district-${cleanDistrict}`);
        console.log(`Doctor socket registered to emergency district room: emergency-district-${cleanDistrict}`);
      }
    });

    socket.on('register-user-emergency', (userId) => {
      if (userId) {
        socket.join(`user-emergency-${userId}`);
        console.log(`User ${userId} registered for emergency status notifications`);
      }
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
