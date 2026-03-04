# Doctor Schedule Feature - Quick Start Guide

## 🚀 Quick Setup

### Step 1: Start the Backend Server
```bash
cd PawVaidya/backend
npm start
```
The backend should be running on `http://localhost:4000`

### Step 2: Start the Admin Panel (For Doctors)
```bash
cd PawVaidya/admin
npm run dev
```
The admin panel should be running on `http://localhost:5173` or `http://localhost:5174`

### Step 3: Start the Frontend (For Users)
```bash
cd PawVaidya/frontend
npm run dev
```
The frontend should be running on `http://localhost:5173`

---

## 👨‍⚕️ For Doctors: Setting Up Your Schedule

### 1. Login to Admin Panel
- Open the admin panel in your browser
- Login with your doctor credentials

### 2. Navigate to Schedule Management
- Click on **"My Schedule"** in the sidebar (calendar icon)

### 3. Add Your Availability
Fill in the form:
- **Day of Week**: Select the day (e.g., Monday)
- **Start Time**: When you start seeing patients (e.g., 09:00)
- **End Time**: When you finish (e.g., 17:00)
- **Slot Duration**: How long each appointment takes (15, 30, 45, or 60 minutes)

Click **"Add Schedule"**

### 4. Repeat for All Working Days
Add schedules for each day you work. For example:
- Monday: 09:00 - 17:00 (30 min slots)
- Tuesday: 09:00 - 17:00 (30 min slots)
- Wednesday: OFF (no schedule)
- Thursday: 09:00 - 17:00 (30 min slots)
- Friday: 09:00 - 13:00 (30 min slots)
- Saturday: 10:00 - 14:00 (45 min slots)
- Sunday: OFF (no schedule)

### 5. Manage Your Schedules
- **Edit**: Click the blue edit icon to modify a schedule
- **Toggle**: Click the power icon to temporarily disable/enable
- **Delete**: Click the red trash icon to permanently remove

---

## 👥 For Users: Booking Appointments

### 1. Browse Doctors
- Open the frontend application
- Navigate to the doctors page
- Select a doctor

### 2. View Available Slots
- You'll see a calendar with the next 7 days
- Only slots during the doctor's scheduled hours will appear
- Already booked slots won't be shown
- Past time slots (for today) are automatically hidden

### 3. Book an Appointment
- Select a date from the calendar
- Choose an available time slot
- Click "Book Appointment"
- Confirm your booking

---

## 📋 Example Scenarios

### Scenario 1: Doctor with Full Schedule
**Doctor Setup:**
- Monday-Friday: 09:00-17:00 (30 min slots)
- Saturday: 10:00-14:00 (30 min slots)

**User Experience:**
- Sees slots from 09:00-17:00 on weekdays
- Sees slots from 10:00-14:00 on Saturday
- No slots shown for Sunday

### Scenario 2: Doctor with No Schedule
**Doctor Setup:**
- No schedules added yet

**User Experience:**
- Sees default slots: 10:00-21:00 (30 min slots) every day
- This is the fallback behavior

### Scenario 3: Doctor with Different Slot Durations
**Doctor Setup:**
- Monday-Wednesday: 09:00-17:00 (30 min slots)
- Thursday-Friday: 09:00-17:00 (60 min slots)

**User Experience:**
- Sees 30-minute intervals on Mon-Wed
- Sees 60-minute intervals on Thu-Fri

---

## 🔧 Troubleshooting

### No Slots Appearing?
1. Check if doctor has added a schedule for that day
2. Verify the schedule is **Active** (green badge)
3. Check if the time hasn't passed (for current day)
4. Ensure doctor's account is not banned

### Can't Add Schedule?
1. Make sure you're logged in as a doctor
2. Check if a schedule already exists for that day (edit instead)
3. Verify start time is before end time
4. Use correct time format (HH:MM)

### Slots Not Updating?
1. Refresh the appointment booking page
2. Check browser console for errors
3. Verify backend server is running
4. Check network tab for API responses

---

## 🎯 Best Practices

### For Doctors:
1. **Set realistic schedules** - Don't overbook yourself
2. **Use appropriate slot durations** - Consider consultation complexity
3. **Update regularly** - Keep your schedule current
4. **Use toggle feature** - Temporarily disable instead of deleting
5. **Plan ahead** - Set schedules for the entire week

### For Administrators:
1. **Monitor schedules** - Ensure doctors maintain their availability
2. **Encourage adoption** - Help doctors set up their schedules
3. **Gather feedback** - Improve based on doctor/user experience

---

## 📊 Key Features

✅ **Flexible Scheduling** - Different times for different days  
✅ **Multiple Slot Durations** - 15, 30, 45, or 60 minutes  
✅ **Easy Management** - Edit, toggle, or delete schedules  
✅ **Smart Filtering** - Hides past slots and booked times  
✅ **Fallback System** - Default slots if no schedule set  
✅ **Real-time Updates** - Changes reflect immediately  
✅ **User-Friendly UI** - Beautiful, intuitive interface  
✅ **Mobile Responsive** - Works on all devices  

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the main documentation: `DOCTOR_SCHEDULE_FEATURE.md`
2. Review the console logs in your browser
3. Check the backend server logs
4. Verify all dependencies are installed
5. Ensure MongoDB is running

---

## 🎉 You're All Set!

The doctor schedule feature is now ready to use. Doctors can manage their availability, and users can book appointments during available slots. Enjoy the improved appointment management system!
