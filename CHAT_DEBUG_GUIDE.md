# Chat Debugging Guide

## Recent Fixes Applied

1. ✅ **Added `getProfileData()` call in DoctorAppointments page**
   - Doctor profile data now loads when the appointments page loads
   - This fixes the infinite loading issue on doctor's chat

2. ✅ **Added comprehensive console logging**
   - Both user and doctor chat components now log detailed information
   - Helps identify exactly where the issue occurs

3. ✅ **Improved error handling**
   - Better error messages for debugging
   - Checks for socket connection before emitting

## How to Debug

### Step 1: Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+K`
- Go to the "Console" tab

### Step 2: Test Doctor Side

1. Login as a doctor on admin panel
2. Go to Appointments page
3. Open browser console
4. Click the "Chat" button on any active appointment

**Expected Console Logs:**
```
Waiting for profileData to load... null
Waiting for profileData to load... {_id: '...', name: '...', ...}
Initializing socket connection for doctor: <doctor_id>
Socket connected: <socket_id>
Joining room: <appointment_id>
```

**If you see "Waiting for profileData to load... null" continuously:**
- The profile data is not loading
- Check if `getProfileData()` is being called
- Check network tab for `/api/doctor/profile` request
- Verify doctor token (dtoken) is valid

### Step 3: Send a Message (Doctor Side)

1. Type a message in the chat input
2. Press Enter or click Send

**Expected Console Logs:**
```
Sending message: {appointmentId: '...', senderId: '...', senderType: 'doctor', message: '...', timestamp: ...}
Server response: {success: true, message: 'Message sent successfully', data: {...}}
Emitting via socket
```

**If you see "Profile data not loaded":**
- ProfileData is still null/undefined
- Wait for profile to load or refresh the page

**If you see "Socket not connected":**
- Socket initialization failed
- Check if backend server is running
- Verify Socket.IO is working on backend

### Step 4: Test User Side

1. Login as a user on frontend
2. Go to "My Appointments" page
3. Open browser console
4. Click "Chat with Doctor" button

**Expected Console Logs:**
```
Waiting for userdata to load...
Initializing socket connection for user: <user_id>
Socket connected: <socket_id>
Joining room: <appointment_id>
```

### Step 5: Send a Message (User Side)

1. Type a message
2. Press Enter or click Send

**Expected Console Logs:**
```
Sending message: {appointmentId: '...', senderId: '...', senderType: 'user', message: '...', timestamp: ...}
Server response: {success: true, message: 'Message sent successfully', data: {...}}
Emitting via socket
```

### Step 6: Test Real-time Communication

1. Open both user and doctor chat for the SAME appointment
2. Send a message from user side
3. Check doctor's console for:
```
Received message via socket: {senderId: '...', senderType: 'user', message: '...', timestamp: ...}
```

4. Send a message from doctor side
5. Check user's console for:
```
Received message via socket: {senderId: '...', senderType: 'doctor', message: '...', timestamp: ...}
```

## Common Issues and Solutions

### Issue 1: Doctor Chat Shows Loading Forever

**Symptoms:**
- Loading spinner never disappears
- Console shows: `Waiting for profileData to load... null`

**Solution:**
1. Check if `getProfileData()` is called in DoctorAppointments useEffect
2. Verify backend endpoint `/api/doctor/profile` is working
3. Check if doctor token (dtoken) is valid
4. Try logging out and logging back in

### Issue 2: Messages Not Sending

**Symptoms:**
- Click send but nothing happens
- Console shows error

**Check Console For:**
- "Message is empty" → Type a message first
- "User data not loaded" or "Profile data not loaded" → Wait for data to load
- "Socket not connected" → Backend server issue
- "Failed to send message" → Check server response

**Solution:**
1. Ensure backend server is running on port 4000
2. Check network tab for failed requests
3. Verify MongoDB is connected
4. Check backend console for errors

### Issue 3: Messages Not Appearing in Real-time

**Symptoms:**
- Message sends successfully
- Other user doesn't see it until refresh

**Check Console For:**
- "Socket connected" on both sides
- "Joining room" with same appointment ID
- "Emitting via socket" when sending
- "Received message via socket" on other side

**Solution:**
1. Verify both users are in the same appointment room
2. Check if Socket.IO server is running (backend)
3. Look for socket errors in backend console
4. Ensure both users have stable connection

### Issue 4: Backend Errors

**Check Backend Console For:**
```
User connected: <socket_id>
User <socket_id> joined room: <appointment_id>
New chat message in appointment <appointment_id>
```

**If not seeing these:**
- Socket.IO server not initialized
- Check if `initializeSocket(server)` is called in server.js
- Verify port 4000 is not blocked

## Network Tab Debugging

### Check These Requests:

1. **GET /api/doctor/profile** (Doctor side)
   - Status: 200 OK
   - Response should contain doctor data with `_id`

2. **GET /api/user/get-profile** (User side)
   - Status: 200 OK
   - Response should contain user data with `_id`

3. **POST /api/chat/send**
   - Status: 200 OK
   - Request body should have: appointmentId, senderId, senderType, message
   - Response: `{success: true, message: 'Message sent successfully', data: {...}}`

4. **GET /api/chat/messages/:appointmentId**
   - Status: 200 OK
   - Response: `{success: true, messages: [...]}`

### WebSocket Connection

Look for:
- **WS** or **WebSocket** connection in Network tab
- Should connect to: `ws://localhost:4000`
- Status: 101 Switching Protocols (successful)

## Quick Checklist

Before testing, ensure:
- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] Admin panel is running (`npm run dev` in admin folder)
- [ ] MongoDB is connected
- [ ] User is logged in (has valid token)
- [ ] Doctor is logged in (has valid dtoken)
- [ ] Appointment exists and is not cancelled/completed
- [ ] Browser console is open to see logs

## Still Not Working?

If you've tried everything above and it still doesn't work:

1. **Clear browser cache and localStorage**
2. **Restart all servers** (backend, frontend, admin)
3. **Check MongoDB connection** - ensure database is accessible
4. **Verify environment variables** in backend `.env` file
5. **Check for CORS errors** in browser console
6. **Share the console logs** - Copy all console messages and check for specific errors

## Contact Information

If you need further help, provide:
1. Complete browser console logs (both user and doctor side)
2. Backend console logs
3. Network tab screenshots showing failed requests
4. Description of exact steps taken before error occurred
