# Fix Report Model Enum Error

## Problem
```
reportModel validation failed: reporterModel: `userModel` is not a valid enum value for path `reporterModel`., reportedModel: `doctorModel` is not a valid enum value for path `reportedModel`.
```

This error occurs because there are old reports in the database with the old enum values (`'userModel'`, `'doctorModel'`) instead of the new values (`'user'`, `'doctor'`).

---

## Solution Options

### **Option 1: Fix Existing Reports (Recommended if you want to keep old reports)**

This will update all existing reports to use the new enum values.

**Steps:**
1. Stop your backend server (Ctrl+C)
2. Run the migration script:
```bash
cd backend
node migrations/fixReportModels.js
```
3. Wait for completion message
4. Restart your backend server:
```bash
npm start
```

**What it does:**
- Updates `reporterModel: 'userModel'` → `'user'`
- Updates `reporterModel: 'doctorModel'` → `'doctor'`
- Updates `reportedModel: 'userModel'` → `'user'`
- Updates `reportedModel: 'doctorModel'` → `'doctor'`
- Keeps all your existing reports

---

### **Option 2: Delete All Old Reports (Quick & Clean)**

This will delete all existing reports and start fresh.

**Steps:**
1. Stop your backend server (Ctrl+C)
2. Run the delete script:
```bash
cd backend
node migrations/deleteOldReports.js
```
3. Wait for completion message
4. Restart your backend server:
```bash
npm start
```

**What it does:**
- Deletes all existing reports
- Clean slate for new reports
- Faster than migration

---

## After Running Either Script

1. ✅ The error will be gone
2. ✅ New reports will work correctly
3. ✅ Admin panel will load reports without errors
4. ✅ Report detail modal will work

---

## Verification

After running the script and restarting the server:

1. Go to Admin Panel → All Reports
2. Check browser console (F12)
3. Should see no errors
4. Try creating a new report
5. Should work without validation errors

---

## Why This Happened

The report model schema was updated from:
```javascript
// Old
enum: ['userModel', 'doctorModel']

// New
enum: ['user', 'doctor']
```

But existing reports in the database still had the old values, causing validation errors.

---

## Quick Command Reference

**Fix existing reports:**
```bash
node backend/migrations/fixReportModels.js
```

**Delete all reports:**
```bash
node backend/migrations/deleteOldReports.js
```

**Check MongoDB directly (if you have MongoDB Compass):**
```javascript
// In MongoDB Compass
db.reportmodels.find({ reporterModel: "userModel" })
db.reportmodels.find({ reportedModel: "doctorModel" })
```

---

## Recommendation

- **If you have important test reports:** Use Option 1 (Fix)
- **If reports are just test data:** Use Option 2 (Delete) - Faster and cleaner

Both options will solve the error completely! ✅
