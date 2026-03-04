# Real-Time Ban System with Auto-Logout & Appointment Cancellation

## Overview

When a user or doctor is banned by an admin, the system now:
1. ✅ **Cancels all active appointments** automatically
2. ✅ **Logs out the banned user/doctor in real-time** via Socket.IO
3. ✅ **Shows ban message** with reason
4. ✅ **Redirects to login page**

---

## Backend Changes (Already Implemented)

### **1. Report Controller** (`backend/controllers/reportController.js`)

**When User is Banned:**
```javascript
// Cancel all active appointments
await appointmentModel.updateMany(
    { userId: userId, cancelled: false, isCompleted: false },
    { cancelled: true, cancelReason: 'User account has been banned' }
);

// Emit socket event for real-time logout
io.emit('user-banned', { 
    userId: userId,
    message: `Your account has been banned. Reason: ${reason}`,
    banReason: reason
});
```

**When Doctor is Banned:**
```javascript
// Cancel all active appointments
await appointmentModel.updateMany(
    { docId: doctorId, cancelled: false, isCompleted: false },
    { cancelled: true, cancelReason: 'Doctor account has been banned' }
);

// Emit socket event for real-time logout
io.emit('doctor-banned', { 
    doctorId: doctorId,
    message: `Your account has been banned. Reason: ${reason}`,
    banReason: reason
});
```

---

## Frontend Integration (Required)

### **Step 1: Install Socket.IO Client** (If not already installed)

```bash
cd frontend
npm install socket.io-client
```

```bash
cd admin
npm install socket.io-client
```

### **Step 2: Add Ban Listener to User App**

**File:** `frontend/src/App.jsx`

```javascript
import useBanListener from './hooks/useBanListener';

function App() {
  // Add this hook at the top of your App component
  useBanListener();
  
  // ... rest of your App code
  return (
    // ... your JSX
  );
}
```

### **Step 3: Add Ban Listener to Doctor/Admin App**

**File:** `admin/src/App.jsx`

```javascript
import useDoctorBanListener from './hooks/useDoctorBanListener';

function App() {
  // Add this hook at the top of your App component
  useDoctorBanListener();
  
  // ... rest of your App code
  return (
    // ... your JSX
  );
}
```

---

## How It Works

### **Admin Bans a User:**

```
1. Admin clicks "Ban User" in report detail modal
   ↓
2. Backend receives ban request
   ↓
3. Backend updates user: isBanned = true
   ↓
4. Backend cancels all active appointments
   ↓
5. Backend emits socket event: 'user-banned'
   ↓
6. User's browser receives event (if online)
   ↓
7. Frontend hook clears token & user data
   ↓
8. Shows toast: "Your account has been banned. Reason: ..."
   ↓
9. Redirects to /login
   ↓
10. User is logged out in real-time!
```

### **Admin Bans a Doctor:**

```
1. Admin clicks "Ban Doctor" in report detail modal
   ↓
2. Backend receives ban request
   ↓
3. Backend updates doctor: isBanned = true, available = false
   ↓
4. Backend cancels all active appointments
   ↓
5. Backend emits socket event: 'doctor-banned'
   ↓
6. Doctor's browser receives event (if online)
   ↓
7. Frontend hook clears token & doctor data
   ↓
8. Shows toast: "Your account has been banned. Reason: ..."
   ↓
9. Redirects to /login
   ↓
10. Doctor is logged out in real-time!
```

---

## Features

### **1. Automatic Appointment Cancellation**

**For Users:**
- All pending appointments are cancelled
- Cancel reason: "User account has been banned"
- Doctors are notified

**For Doctors:**
- All pending appointments are cancelled
- Cancel reason: "Doctor account has been banned"
- Users are notified

### **2. Real-Time Logout**

**If User/Doctor is Online:**
- Receives socket event immediately
- Logged out within seconds
- Cannot continue using the platform

**If User/Doctor is Offline:**
- Will be blocked at next login attempt
- Login will fail with ban message

### **3. Ban Message Display**

**Toast Notification:**
```javascript
toast.error("Your account has been banned. Reason: Inappropriate behavior. You cannot book appointments.", {
  position: 'top-center',
  autoClose: false,  // Stays until user closes it
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
});
```

---

## Testing

### **Test User Ban:**

1. Login as a user
2. Open admin panel in another browser/tab
3. Login as admin
4. Go to All Reports
5. Click "View" on a report
6. Click "Ban User" on reporter card
7. Confirm ban
8. **Result:** User should be logged out immediately in the first browser

### **Test Doctor Ban:**

1. Login as a doctor
2. Open admin panel in another browser/tab
3. Login as admin
4. Go to All Reports
5. Click "View" on a report
6. Click "Ban Doctor" on reported card
7. Confirm ban
8. **Result:** Doctor should be logged out immediately in the first browser

### **Test Appointment Cancellation:**

1. User has active appointments
2. Admin bans the user
3. Check database: All user's appointments should be cancelled
4. Check user's "My Appointments": All should show as cancelled

---

## Socket Events

### **Event: `user-banned`**

**Payload:**
```javascript
{
  userId: "6782792b1df811d2f7b9b4fa",
  message: "Your account has been banned. Reason: Inappropriate behavior. You cannot book appointments.",
  banReason: "Inappropriate behavior"
}
```

**Listener:** `frontend/src/hooks/useBanListener.jsx`

### **Event: `doctor-banned`**

**Payload:**
```javascript
{
  doctorId: "67aa04ab2c1841575de5428d",
  message: "Your account has been banned. Reason: Unprofessional conduct.",
  banReason: "Unprofessional conduct"
}
```

**Listener:** `admin/src/hooks/useDoctorBanListener.jsx`

---

## Files Created

1. ✅ `frontend/src/hooks/useBanListener.jsx` - User ban listener
2. ✅ `admin/src/hooks/useDoctorBanListener.jsx` - Doctor ban listener
3. ✅ `REALTIME_BAN_SYSTEM.md` - This documentation

## Files Modified

1. ✅ `backend/controllers/reportController.js` - Added appointment cancellation & socket events
2. ✅ `backend/socketServer.js` - Already had socket setup (no changes needed)

---

## Important Notes

1. **Socket.IO must be running** - Make sure your backend server has Socket.IO initialized
2. **Backend URL must be correct** - Check `backendurl` in context
3. **User must be online** - Real-time logout only works if user is online
4. **Offline users** - Will be blocked at next login attempt

---

## Troubleshooting

### **User not logging out in real-time:**

1. Check if Socket.IO is connected:
   ```javascript
   // In browser console
   socket.connected  // Should be true
   ```

2. Check if event is being emitted:
   ```javascript
   // In backend console
   // Should see: "Emitted user-banned event for user [ID]"
   ```

3. Check if event is being received:
   ```javascript
   // In browser console
   // Should see: "User banned event received: {...}"
   ```

### **Appointments not cancelling:**

1. Check backend logs for:
   ```
   Cancelled X appointments for banned user [Name]
   ```

2. Check database:
   ```javascript
   db.appointmentmodels.find({ 
     userId: "USER_ID", 
     cancelled: true,
     cancelReason: "User account has been banned"
   })
   ```

---

## Summary

The real-time ban system is now complete! When an admin bans a user or doctor:

✅ All active appointments are cancelled automatically
✅ User/Doctor is logged out in real-time (if online)
✅ Ban message is displayed with reason
✅ User/Doctor is redirected to login page
✅ Cannot login again until unbanned

The system provides complete ban enforcement with real-time updates! 🚫⚡✅
