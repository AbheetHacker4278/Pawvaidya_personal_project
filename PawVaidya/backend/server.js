import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config'
import connectdb from './config/mongodb.js';
import connectCloudnairy from './config/cloudinary.js';
import adminRouter from './routes/adminroute.js';
import { doctorrouter } from './routes/doctorroute.js';
import userRouter from './routes/userroute.js';
import chatRouter from './routes/chatRoute.js';
import cleanupRouter from './routes/cleanupRoute.js';
import reportRouter from './routes/reportRoute.js';
import unbanRequestRouter from './routes/unbanRequestRoute.js';
import doctorScheduleRouter from './routes/doctorScheduleRoute.js';
import banRouter from './routes/banRoute.js';
import petReportRouter from './routes/petReportRoute.js';
import appIssueReportRouter from './routes/appIssueReportRoute.js';

import cookieParser from 'cookie-parser';
import { initializeSocket } from './socketServer.js';
import initScheduler from './utils/scheduler.js';
import telemetryMiddleware from './middleware/telemetryMiddleware.js';
import maintenanceMiddleware from './middleware/maintenanceMiddleware.js';
import securityMonitor from './middleware/securityMonitor.js';

// app config
const app = express();
const port = process.env.PORT || 4000;
const server = http.createServer(app);

connectdb()
connectCloudnairy()

// Initialize Scheduler
initScheduler();

// Initialize Socket.io
initializeSocket(server);

//middleware
const allowedorigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175' , 'https://pawvaidya-79qq.onrender.com'];

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({ origin: allowedorigins, credentials: true }));
app.use(cookieParser())
app.use(telemetryMiddleware)
app.use(maintenanceMiddleware)
app.use(securityMonitor)

//api endpoint
try {
  app.use('/api/admin', adminRouter);
} catch (error) {
  console.error("failed to use adminRouter:", error.message);
}
try {
  app.use('/api/doctor', doctorrouter);
} catch (error) {
  console.error("Failed to use adminRouter:", error.message);
}
try {
  app.use('/api/user', userRouter);
} catch (error) {
  console.error("Failed to use adminRouter:", error.message);
}
try {
  app.use('/api/chat', chatRouter);
} catch (error) {
  console.error("Failed to use chatRouter:", error.message);
}
try {
  app.use('/api/cleanup', cleanupRouter);
} catch (error) {
  console.error("Failed to use cleanupRouter:", error.message);
}
try {
  app.use('/api/report', reportRouter);
} catch (error) {
  console.error("Failed to use reportRouter:", error.message);
}
try {
  app.use('/api/unban-request', unbanRequestRouter);
} catch (error) {
  console.error("Failed to use unbanRequestRouter:", error.message);
}
try {
  app.use('/api/doctor-schedule', doctorScheduleRouter);
} catch (error) {
  console.error("Failed to use doctorScheduleRouter:", error.message);
}
try {
  app.use('/api/ban', banRouter);
} catch (error) {
  console.error("Failed to use banRouter:", error.message);
}
try {
  app.use('/api/doctor/pet-report', petReportRouter);
} catch (error) {
  console.error("Failed to use petReportRouter:", error.message);
}
try {
  app.use('/api/app-issue', appIssueReportRouter);
} catch (error) {
  console.error("Failed to use appIssueReportRouter:", error.message);
}

// Pet report feature disabled
//localhost:4000/api/admin
app.get('/', (req, res) => {
  res.send("Badhia Chall raha hai Guru")
})

server.listen(port, () => {
  console.log(`Server is Listining on port ${port}`)
})
