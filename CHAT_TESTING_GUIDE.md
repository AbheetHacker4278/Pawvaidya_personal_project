# Chat Feature Testing Guide

## Issues Fixed

1. **Fixed Context Variable Names**
   - Frontend: Changed `userData` to `userdata` (matches AppContext)
   - Admin: Changed `docData` to `profileData` (matches DoctorContext)

2. **Added Safety Checks**
   - Both components now check if user/doctor data is loaded before sending messages
   - Added loading states when data is not available

3. **Fixed Socket Initialization**
   - Socket now waits for user/doctor data to load before connecting
   - Prevents errors when trying to join rooms without proper data

## How to Test

### Prerequisites
1. Start the backend server:
   ```bash
   cd PawVaidya/backend
   npm start
   ```

2. Start the frontend (user side):
   ```bash
   cd PawVaidya/frontend
   npm run dev
   ```

3. Start the admin panel (doctor side):
   ```bash
   cd PawVaidya/admin
   npm run dev
   ```

### Testing Steps

#### User Side Testing
1. Login as a user on the frontend
2. Navigate to "My Appointments" page
3. Find an active appointment (not cancelled/completed)
4. Click the "Chat with Doctor" button (blue button)
5. Type a message and press Enter or click Send
6. Message should appear on the right side (user messages)

#### Doctor Side Testing
1. Login as a doctor on the admin panel
2. Navigate to "Appointments" page
3. Find an active appointment
4. Click the "Chat" button (green button)
5. Type a message and press Enter or click Send
6. Message should appear on the right side (doctor messages)

#### Real-time Testing
1. Open both user and doctor chat windows for the same appointment
2. Send a message from the user side
3. The message should appear instantly on the doctor's chat
4. Send a message from the doctor side
5. The message should appear instantly on the user's chat

## Expected Behavior

✅ **User Chat**
- User messages appear on the right (brown/amber gradient)
- Doctor messages appear on the left (white with border)
- User icon shows for user messages
- Stethoscope icon shows for doctor messages

✅ **Doctor Chat**
- Doctor messages appear on the right (green gradient)
- User messages appear on the left (white with border)
- Stethoscope icon shows for doctor messages
- User icon shows for user messages

✅ **Real-time Updates**
- Messages appear instantly without page refresh
- Auto-scroll to latest message
- Enter key sends message
- Empty messages are not sent

## Troubleshooting

### If chat doesn't open:
- Check browser console for errors
- Ensure user/doctor is logged in
- Verify appointment data is loaded

### If messages don't send:
- Check browser console for errors
- Verify backend server is running on port 4000
- Check network tab for failed API calls
- Ensure Socket.IO connection is established

### If messages don't appear in real-time:
- Check if Socket.IO is connected (look for "User connected" in backend logs)
- Verify both users are in the same appointment room
- Check backend console for socket events

## API Endpoints

- `GET /api/chat/messages/:appointmentId` - Get all messages for an appointment
- `POST /api/chat/send` - Send a new message
- `POST /api/chat/mark-read` - Mark messages as read
- `GET /api/chat/unread/:appointmentId/:userId` - Get unread count

## Socket Events

- `join-room` - Join appointment chat room
- `leave-room` - Leave appointment chat room
- `send-chat-message` - Send message to room
- `receive-chat-message` - Receive message from room
