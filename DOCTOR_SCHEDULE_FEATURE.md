# Doctor Schedule Management Feature

## Overview
This feature allows doctors to set their weekly availability schedule, and users can only book appointments during the doctor's available time slots. This provides better control over appointment management and ensures appointments are only booked when doctors are actually available.

## Features Implemented

### 1. Backend Components

#### Database Model
- **File**: `backend/models/doctorScheduleModel.js`
- **Schema**: Stores doctor schedules with the following fields:
  - `doctorId`: Reference to the doctor
  - `dayOfWeek`: Day of the week (Monday-Sunday)
  - `startTime`: Schedule start time (HH:MM format)
  - `endTime`: Schedule end time (HH:MM format)
  - `slotDuration`: Duration of each appointment slot (15, 30, 45, or 60 minutes)
  - `isActive`: Toggle to enable/disable schedule
  - Unique constraint: One schedule per doctor per day

#### Controller Functions
- **File**: `backend/controllers/doctorScheduleController.js`
- **Functions**:
  - `addOrUpdateSchedule`: Add or update a schedule for a specific day
  - `getDoctorSchedules`: Get all schedules for a doctor (protected)
  - `getPublicDoctorSchedules`: Get active schedules for public viewing
  - `deleteSchedule`: Delete a schedule
  - `toggleScheduleStatus`: Enable/disable a schedule
  - `getAvailableSlots`: Get available time slots for a specific date

#### API Routes
- **File**: `backend/routes/doctorScheduleRoute.js`
- **Protected Routes** (require doctor authentication):
  - `POST /api/doctor-schedule/add-update` - Add or update schedule
  - `POST /api/doctor-schedule/get-schedules` - Get doctor's schedules
  - `POST /api/doctor-schedule/delete` - Delete a schedule
  - `POST /api/doctor-schedule/toggle-status` - Toggle schedule status
  
- **Public Routes**:
  - `GET /api/doctor-schedule/public/:docId` - Get doctor's active schedules
  - `GET /api/doctor-schedule/available-slots` - Get available slots for a date

#### Server Configuration
- **File**: `backend/server.js`
- Added route: `/api/doctor-schedule`

### 2. Frontend Components (Admin Panel)

#### Doctor Schedule Management Page
- **File**: `admin/src/pages/Doctor/DoctorSchedule.jsx`
- **Features**:
  - Beautiful, modern UI with animations
  - Add/Edit schedule form with validation
  - List of all schedules with status indicators
  - Edit, activate/deactivate, and delete schedules
  - Visual feedback for active/inactive schedules
  - Responsive design for mobile and desktop

#### Navigation
- **File**: `admin/src/App.jsx`
  - Added route: `/doctor-schedule`
  
- **File**: `admin/src/components/Sidebar.jsx`
  - Added "My Schedule" menu item for doctors

### 3. Frontend Components (User-Facing)

#### Updated Appointment Booking
- **File**: `frontend/src/pages/Appointments.jsx`
- **Changes**:
  - Fetches doctor's schedule from API
  - Generates time slots based on doctor's availability
  - Falls back to default slots (10 AM - 9 PM) if no schedule is set
  - Respects slot duration set by doctor
  - Filters out past time slots for current day
  - Only shows slots during doctor's scheduled hours

## How It Works

### For Doctors:
1. **Login** to the doctor admin panel
2. **Navigate** to "My Schedule" from the sidebar
3. **Add Schedule**:
   - Select day of week
   - Set start and end times
   - Choose slot duration (15, 30, 45, or 60 minutes)
   - Click "Add Schedule"
4. **Manage Schedules**:
   - Edit existing schedules
   - Toggle schedules on/off without deleting
   - Delete schedules permanently
5. **View** all schedules with active/inactive status

### For Users:
1. **Browse** available doctors
2. **Select** a doctor to book appointment
3. **View** only the time slots when the doctor is available
4. **Book** appointment during available slots
5. If doctor hasn't set a schedule, default slots (10 AM - 9 PM) are shown

## Technical Details

### Time Slot Generation Logic
1. System checks if doctor has a schedule for the selected day
2. If schedule exists:
   - Uses doctor's start/end times
   - Uses doctor's slot duration
   - Generates slots within scheduled hours
3. If no schedule:
   - Falls back to default (10 AM - 9 PM, 30-minute slots)
4. Filters out:
   - Already booked slots
   - Past time slots (for current day)
   - Slots outside doctor's availability

### Validation
- Start time must be before end time
- Time format validation (HH:MM)
- One schedule per doctor per day
- Slot duration must be 15, 30, 45, or 60 minutes

### Database Indexing
- Compound index on `doctorId` and `dayOfWeek` for fast queries
- Ensures uniqueness constraint

## API Endpoints Summary

### Doctor Routes (Protected)
```
POST /api/doctor-schedule/add-update
Body: { dayOfWeek, startTime, endTime, slotDuration }
Headers: { dtoken }

POST /api/doctor-schedule/get-schedules
Headers: { dtoken }

POST /api/doctor-schedule/delete
Body: { scheduleId }
Headers: { dtoken }

POST /api/doctor-schedule/toggle-status
Body: { scheduleId }
Headers: { dtoken }
```

### Public Routes
```
GET /api/doctor-schedule/public/:docId
Returns: Active schedules for the doctor

GET /api/doctor-schedule/available-slots?docId=xxx&date=yyyy-mm-dd
Returns: Available time slots for the date
```

## Testing Instructions

### 1. Test Doctor Schedule Management
1. Start backend server: `cd backend && npm start`
2. Start admin panel: `cd admin && npm run dev`
3. Login as a doctor
4. Navigate to "My Schedule"
5. Add schedules for different days
6. Test edit, toggle, and delete functions

### 2. Test User Appointment Booking
1. Start frontend: `cd frontend && npm run dev`
2. Browse doctors
3. Select a doctor with schedules
4. Verify only scheduled slots appear
5. Try booking an appointment
6. Test with a doctor without schedules (should show default slots)

### 3. Edge Cases to Test
- Booking on current day (past slots should be hidden)
- Doctor with no schedule (should show default slots)
- Doctor with inactive schedule (should not show slots for that day)
- Different slot durations (15, 30, 45, 60 minutes)
- Overlapping time validation

## Benefits

1. **Better Time Management**: Doctors control when they're available
2. **Reduced No-Shows**: Appointments only during working hours
3. **Flexibility**: Different schedules for different days
4. **Easy Updates**: Quick enable/disable without deleting
5. **User Experience**: Users see only realistic available slots
6. **Scalability**: Supports multiple doctors with different schedules

## Future Enhancements (Optional)

1. **Holiday Management**: Mark specific dates as unavailable
2. **Break Times**: Add lunch breaks or other breaks within the day
3. **Recurring Patterns**: Copy schedules across multiple weeks
4. **Notifications**: Alert doctors when schedule changes
5. **Analytics**: Track most booked time slots
6. **Bulk Operations**: Set schedules for multiple days at once
7. **Calendar View**: Visual calendar interface for schedule management

## Files Modified/Created

### Backend
- ✅ `backend/models/doctorScheduleModel.js` (NEW)
- ✅ `backend/controllers/doctorScheduleController.js` (NEW)
- ✅ `backend/routes/doctorScheduleRoute.js` (NEW)
- ✅ `backend/server.js` (MODIFIED)

### Admin Panel
- ✅ `admin/src/pages/Doctor/DoctorSchedule.jsx` (NEW)
- ✅ `admin/src/App.jsx` (MODIFIED)
- ✅ `admin/src/components/Sidebar.jsx` (MODIFIED)

### Frontend
- ✅ `frontend/src/pages/Appointments.jsx` (MODIFIED)

## Conclusion

The doctor schedule management feature is now fully implemented and integrated into the PawVaidya platform. Doctors can manage their availability, and users can book appointments only during available slots. The system is flexible, user-friendly, and ready for production use.
