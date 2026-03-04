# Automatic File Cleanup Feature

## ✅ Feature Implemented

Automatically deletes all chat files (images, videos, documents) from Cloudinary when an appointment is marked as completed.

---

## How It Works

### **Automatic Cleanup Trigger**

When a doctor marks an appointment as **completed**:
1. Appointment status updated to `isCompleted: true`
2. **Auto-cleanup triggered immediately**
3. All chat files for that appointment deleted from Cloudinary
4. Message records updated to remove file references
5. Completion email sent to user

### **What Gets Deleted**

- ✅ **Images** - All images shared in chat
- ✅ **Videos** - All videos shared in chat
- ✅ **Files** - All documents (PDF, DOC, etc.)
- ✅ **From Cloudinary** - Permanent deletion from cloud storage
- ✅ **Database Updated** - File URLs removed from messages

---

## Implementation Details

### **1. Cleanup Controller** (`cleanupController.js`)

**Main Functions:**

#### `autoDeleteFilesOnCompletion(appointmentId)`
- Automatically called when appointment completes
- Finds all messages with files
- Deletes each file from Cloudinary
- Updates database records
- Runs asynchronously (non-blocking)

#### `deleteAppointmentChatFiles(appointmentId)`
- Manual cleanup endpoint (admin only)
- Same functionality as auto-cleanup
- Returns deletion statistics
- Can be used for maintenance

**Process Flow:**
```javascript
1. Find all messages with fileUrl for appointmentId
2. For each message:
   - Extract Cloudinary public_id from URL
   - Delete from Cloudinary (image or video resource type)
   - Log success/failure
3. Update all messages:
   - Set fileUrl = null
   - Set fileName = null
   - Set fileSize = null
   - Set message = "[File deleted - appointment completed]"
4. Return statistics
```

### **2. Doctor Controller Integration** (`doctorContorller.js`)

**Appointment Completion:**
```javascript
// Update appointment status
await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

// Auto-delete chat files from Cloudinary
autoDeleteFilesOnCompletion(appointmentId).catch(err => {
    console.error('Error auto-deleting files:', err);
});

// Continue with email notification...
```

**Key Points:**
- Cleanup runs **asynchronously** (doesn't block response)
- Errors caught and logged (doesn't fail appointment completion)
- Happens **before** email is sent

### **3. Cleanup Route** (`cleanupRoute.js`)

**Manual Cleanup Endpoint:**
```
DELETE /api/cleanup/chat-files/:appointmentId
```

**Authentication:** Admin only (`authAdmin` middleware)

**Response:**
```json
{
  "success": true,
  "message": "Chat files deleted successfully",
  "deletedCount": 5,
  "failedCount": 0,
  "totalFiles": 5
}
```

---

## File Deletion Process

### **Cloudinary Public ID Extraction**

**Example URL:**
```
https://res.cloudinary.com/dwf0ydfwg/image/upload/v1762007854/chat_files/abc123.png
```

**Extracted Public ID:**
```
chat_files/abc123
```

**Deletion:**
```javascript
await cloudinary.uploader.destroy('chat_files/abc123', {
    resource_type: 'image' // or 'video'
});
```

### **Resource Type Detection**

- **Images:** `messageType === 'image'` → `resource_type: 'image'`
- **Videos:** `messageType === 'video'` → `resource_type: 'video'`
- **Files:** Treated as `resource_type: 'image'` (Cloudinary default)

---

## Database Updates

### **Before Cleanup:**
```javascript
{
  appointmentId: "123",
  message: "Sent a file: report.pdf",
  messageType: "file",
  fileUrl: "https://cloudinary.com/.../report.pdf",
  fileName: "report.pdf",
  fileSize: 245678
}
```

### **After Cleanup:**
```javascript
{
  appointmentId: "123",
  message: "[File deleted - appointment completed]",
  messageType: "file",
  fileUrl: null,
  fileName: null,
  fileSize: null
}
```

---

## Usage

### **Automatic Cleanup**

No action needed! Files are automatically deleted when:
1. Doctor clicks "Complete Appointment"
2. Appointment status changes to completed
3. Cleanup runs in background

### **Manual Cleanup (Admin)**

If needed, admin can manually trigger cleanup:

```bash
DELETE http://localhost:4000/api/cleanup/chat-files/APPOINTMENT_ID
Headers: {
  "atoken": "ADMIN_TOKEN"
}
```

**Use Cases:**
- Cleanup failed during auto-process
- Old appointments need cleanup
- Maintenance/testing

---

## Error Handling

### **Graceful Failures**

1. **Cloudinary Deletion Fails:**
   - Error logged to console
   - Continues with next file
   - Tracks failed count
   - Doesn't stop appointment completion

2. **Database Update Fails:**
   - Error logged
   - Doesn't affect appointment status
   - Can retry with manual cleanup

3. **Network Issues:**
   - Caught and logged
   - Appointment still completes
   - Files can be cleaned up later

### **Logging**

```javascript
console.log('Auto-deleting files for completed appointment:', appointmentId)
console.log(`Auto-cleanup: Found ${messagesWithFiles.length} files to delete`)
console.log('Auto-deleted file:', publicId)
console.error('Error auto-deleting file:', error)
console.log('Auto-cleanup completed for appointment:', appointmentId)
```

---

## Benefits

### ✅ **Privacy & Security**
- Sensitive medical images deleted
- Patient privacy protected
- Compliance with data retention policies

### ✅ **Storage Management**
- Reduces Cloudinary storage usage
- Prevents accumulation of old files
- Cost savings on cloud storage

### ✅ **Automatic Process**
- No manual intervention needed
- Happens immediately on completion
- Consistent and reliable

### ✅ **User Experience**
- Transparent to users
- Files available during active appointment
- Cleaned up after consultation ends

---

## Files Created/Modified

### **New Files:**
1. ✅ `backend/controllers/cleanupController.js` - Cleanup logic
2. ✅ `backend/routes/cleanupRoute.js` - Manual cleanup endpoint

### **Modified Files:**
1. ✅ `backend/controllers/doctorContorller.js` - Added auto-cleanup call
2. ✅ `backend/server.js` - Registered cleanup router

---

## Testing

### **Test Automatic Cleanup:**

1. **Create appointment and chat:**
   - Book appointment
   - Open chat
   - Share images/videos/files

2. **Complete appointment:**
   - Doctor marks as completed
   - Check console logs for cleanup messages

3. **Verify deletion:**
   - Try to access file URLs (should fail)
   - Check Cloudinary dashboard (files gone)
   - Check database (fileUrl = null)

### **Test Manual Cleanup:**

```bash
# As admin
DELETE http://localhost:4000/api/cleanup/chat-files/APPOINTMENT_ID
Headers: { "atoken": "YOUR_ADMIN_TOKEN" }

# Expected response
{
  "success": true,
  "deletedCount": 3,
  "failedCount": 0,
  "totalFiles": 3
}
```

---

## Configuration

### **Cloudinary Settings**

Ensure Cloudinary is configured in `.env`:
```env
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET_KEY=your_secret_key
```

### **Folder Structure**

All chat files stored in:
```
cloudinary://chat_files/
```

This makes cleanup easier and organized.

---

## Future Enhancements (Optional)

### **Possible Improvements:**

1. **Scheduled Cleanup**
   - Cron job to cleanup old completed appointments
   - Batch processing for efficiency

2. **Retention Period**
   - Keep files for X days after completion
   - Allow users to download before deletion

3. **Selective Deletion**
   - Option to keep certain file types
   - User preference for file retention

4. **Backup Before Delete**
   - Archive files before deletion
   - Compliance with regulations

5. **Notification**
   - Email users before file deletion
   - Warning in chat UI

---

## Summary

✅ **Automatic file cleanup implemented**
✅ **Triggered on appointment completion**
✅ **Deletes from Cloudinary permanently**
✅ **Updates database records**
✅ **Non-blocking async process**
✅ **Error handling and logging**
✅ **Manual cleanup endpoint available**
✅ **Privacy and storage benefits**

Files are now automatically cleaned up when appointments end, ensuring privacy and efficient storage management! 🗑️✨🔒
