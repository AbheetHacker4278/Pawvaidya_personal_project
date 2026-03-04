# Reports Not Showing - Troubleshooting Guide

## Issue: "No reports found" message displayed

### Most Likely Cause:
**There are no reports in the database yet.** This is normal if no one has submitted a report.

---

## How to Test the Report System:

### **Step 1: Submit a Test Report**

**Option A: User Reports Doctor**
1. Login as a user
2. Go to "My Appointments"
3. Find a completed appointment
4. Click "Report Doctor" button (orange/red button)
5. Fill out the form:
   - Select a reason (e.g., "Unprofessional Conduct")
   - Write description (minimum 20 characters)
   - Optionally upload evidence
6. Click "Submit Report"

**Option B: Doctor Reports User**
1. Login as a doctor
2. Go to "Appointments"
3. Find an appointment
4. Click "Report User" button
5. Fill out the form
6. Submit

### **Step 2: Check Admin Panel**
1. Login as admin
2. Click "All Reports" in sidebar
3. You should now see the report

---

## Troubleshooting Steps:

### **1. Check Browser Console**

Open browser console (F12) and look for:
- ✅ "Fetching reports from: http://localhost:4000/api/report/all"
- ✅ "Using token: Token exists"
- ✅ "Reports response: { success: true, reports: [...] }"
- ✅ "Reports loaded: X"

**If you see errors:**
- ❌ "No token" → Admin not logged in properly
- ❌ "401 Unauthorized" → Token expired, re-login
- ❌ "404 Not Found" → Backend route not registered
- ❌ "500 Server Error" → Backend error, check server logs

### **2. Check Backend Server**

**Verify server is running:**
```bash
# Should show: Server is Listening on port 4000
```

**Check server logs for:**
- Route registration: "Using reportRouter"
- Database connection: "MongoDB connected"
- Any error messages

### **3. Test API Directly**

**Using Postman or curl:**

```bash
# Get all reports (Admin only)
GET http://localhost:4000/api/report/all
Headers: {
  "atoken": "YOUR_ADMIN_TOKEN"
}

# Get statistics
GET http://localhost:4000/api/report/statistics/overview
Headers: {
  "atoken": "YOUR_ADMIN_TOKEN"
}
```

**Expected Response:**
```json
{
  "success": true,
  "reports": []  // Empty array if no reports
}
```

### **4. Verify Database**

**Check MongoDB:**
```javascript
// In MongoDB Compass or shell
db.reportmodels.find()
```

If empty, no reports have been submitted yet.

---

## Common Issues & Solutions:

### **Issue 1: "Failed to load reports" error**

**Cause:** Backend not running or route not registered

**Solution:**
1. Check if backend server is running
2. Verify `reportRouter` is imported in `server.js`
3. Verify route is registered: `app.use('/api/report', reportRouter)`
4. Restart backend server

### **Issue 2: Statistics showing but no reports**

**Cause:** Reports exist but not being fetched

**Solution:**
1. Check filter dropdown - change from "Pending" to "All Status"
2. Check console for API errors
3. Verify admin token is valid

### **Issue 3: "Unauthorized" error**

**Cause:** Admin token missing or expired

**Solution:**
1. Logout and login again as admin
2. Check if `atoken` exists in AdminContext
3. Verify `authAdmin` middleware is working

### **Issue 4: Reports submitted but not appearing**

**Cause:** Report submission might have failed

**Solution:**
1. Check browser console when submitting report
2. Check backend logs for errors
3. Verify report model is correct
4. Check if report was saved to database

---

## Expected Behavior:

### **When No Reports Exist:**
- ✅ Statistics cards show: 0, 0, 0, 0
- ✅ Table shows: "No reports found" message
- ✅ No errors in console

### **When Reports Exist:**
- ✅ Statistics cards show actual numbers
- ✅ Table displays all reports
- ✅ Filter dropdown works
- ✅ View button clickable

---

## Quick Test Script:

**To quickly test if everything works:**

1. **Create a test report via API:**

```bash
POST http://localhost:4000/api/report/submit
Body: {
  "reporterType": "user",
  "reporterId": "USER_ID",
  "reportedType": "doctor",
  "reportedId": "DOCTOR_ID",
  "appointmentId": "APPOINTMENT_ID",
  "reason": "unprofessional_conduct",
  "description": "This is a test report to verify the system works correctly."
}
```

2. **Refresh admin panel**
3. **Go to "All Reports"**
4. **Should see 1 report**

---

## Current Status:

Based on the screenshot:
- ✅ Page loads correctly
- ✅ Statistics show: 1 Pending, 0 Under Review, 0 Banned, 1 Total
- ✅ Filter dropdown works
- ❌ No reports in table

**This suggests:**
- Statistics API is working (shows 1 total report)
- Reports list API might have an issue OR
- The 1 report has a status that doesn't match the filter

**Solution:**
Try changing the filter from "Pending" to "All Status" to see if reports appear.

---

## Files to Check:

1. ✅ `backend/routes/reportRoute.js` - Routes registered
2. ✅ `backend/controllers/reportController.js` - Logic correct
3. ✅ `backend/models/reportModel.js` - Schema correct
4. ✅ `backend/server.js` - Router registered
5. ✅ `admin/src/pages/Admin/AllReports.jsx` - Frontend component
6. ✅ `admin/src/App.jsx` - Route added

---

## Next Steps:

1. **Open browser console (F12)**
2. **Refresh the All Reports page**
3. **Look for console logs:**
   - "Fetching reports from..."
   - "Reports response..."
   - "Reports loaded: X"
4. **Share any error messages you see**

If you see "Reports loaded: 0" but statistics show "1 Total", then the issue is with the filter or the report status doesn't match.

**Try:** Change filter dropdown from "Pending" to "" (All Status)
