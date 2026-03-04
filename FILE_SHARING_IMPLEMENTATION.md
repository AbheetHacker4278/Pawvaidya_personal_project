# File Sharing Feature - Implementation Guide

## ✅ Completed Changes

### Backend
1. **Chat Message Model** - Updated to support file attachments
2. **File Upload Controller** - Created new controller for handling file uploads
3. **Chat Routes** - Added `/upload-file` endpoint with multer middleware

### Frontend (User Chat)
1. **File Upload UI** - Added paperclip button for file attachment
2. **File Handlers** - Implemented file selection and upload logic
3. **Message Display** - Updated to show images, videos, and files

### Admin (Doctor Chat)
- Same changes need to be applied (in progress)

---

## Remaining Steps for Doctor Chat

Add these functions after `handleTyping()` in `admin/src/components/AppointmentChat.jsx`:

```javascript
// Handle file selection
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    setSelectedFile(file);
    handleFileUpload(file);
  }
};

// Handle file upload
const handleFileUpload = async (file) => {
  if (!profileData?._id) {
    console.error('Profile data not loaded');
    return;
  }

  setUploading(true);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('appointmentId', appointment._id);
  formData.append('senderId', profileData._id);
  formData.append('senderType', 'doctor');
  formData.append('message', `Sent a file: ${file.name}`);

  try {
    const { data } = await axios.post(
      `${backendurl}/api/chat/upload-file`,
      formData,
      {
        headers: {
          dtoken,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('File upload response:', data);

    if (data.success) {
      // Add to local state
      setMessages(prev => [...prev, data.data]);
      
      // Emit via socket
      if (socket) {
        socket.emit('send-chat-message', data.data);
      }
      
      setSelectedFile(null);
    } else {
      alert('Failed to upload file: ' + data.message);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Error uploading file');
  } finally {
    setUploading(false);
  }
};
```

---

## Update Message Display

Replace the message content div in doctor chat with:

```javascript
<div className={`rounded-2xl overflow-hidden ${
  msg.messageType === 'text' ? 'px-4 py-2' : 'p-0'
} ${
  isDoctor 
    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
    : 'bg-white border border-gray-200 text-gray-800'
}`}>
  {/* Text Message */}
  {msg.messageType === 'text' && (
    <p className="text-sm">{msg.message}</p>
  )}
  
  {/* Image Message */}
  {msg.messageType === 'image' && (
    <div>
      <img 
        src={msg.fileUrl} 
        alt={msg.fileName}
        className="max-w-xs max-h-64 object-contain cursor-pointer"
        onClick={() => window.open(msg.fileUrl, '_blank')}
      />
      {msg.message && <p className="text-sm px-4 py-2">{msg.message}</p>}
    </div>
  )}
  
  {/* Video Message */}
  {msg.messageType === 'video' && (
    <div>
      <video 
        src={msg.fileUrl} 
        controls
        className="max-w-xs max-h-64"
      />
      {msg.message && <p className="text-sm px-4 py-2">{msg.message}</p>}
    </div>
  )}
  
  {/* File Message */}
  {msg.messageType === 'file' && (
    <a 
      href={msg.fileUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 hover:opacity-80"
    >
      <File className="w-5 h-5" />
      <div>
        <p className="text-sm font-semibold">{msg.fileName}</p>
        <p className="text-xs opacity-70">
          {(msg.fileSize / 1024).toFixed(2)} KB
        </p>
      </div>
    </a>
  )}
</div>
```

---

## Update Input Area

Replace the input area in doctor chat with:

```javascript
<div className="p-4 bg-white border-t border-gray-200">
  {isTyping && (
    <p className="text-xs text-gray-500 mb-2 ml-2">{appointment.userData.name} is typing...</p>
  )}
  <div className="flex gap-2">
    {/* Hidden file input */}
    <input
      ref={fileInputRef}
      type="file"
      onChange={handleFileSelect}
      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      className="hidden"
    />
    
    {/* File attachment button */}
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => fileInputRef.current?.click()}
      disabled={uploading}
      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
      title="Attach file"
    >
      <Paperclip className="w-5 h-5 text-gray-600" />
    </motion.button>
    
    <input
      type="text"
      value={newMessage}
      onChange={(e) => {
        setNewMessage(e.target.value);
        handleTyping();
      }}
      onKeyPress={handleKeyPress}
      placeholder={uploading ? "Uploading..." : "Type your message..."}
      disabled={uploading}
      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent disabled:opacity-50"
    />
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSendMessage}
      disabled={uploading}
      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50"
    >
      <Send className="w-5 h-5" />
      Send
    </motion.button>
  </div>
</div>
```

---

## Features

✅ **Supported File Types:**
- Images: JPG, PNG, GIF, etc.
- Videos: MP4, WebM, etc.
- Documents: PDF, DOC, DOCX, TXT

✅ **File Size Limit:** 10MB

✅ **File Display:**
- Images: Show inline with click to open in new tab
- Videos: Embedded video player with controls
- Files: Download link with file name and size

✅ **Upload Feedback:**
- Disabled input during upload
- "Uploading..." placeholder text
- Disabled buttons during upload

---

## Testing

1. Click paperclip icon
2. Select a file (image/video/document)
3. File uploads automatically
4. Message appears in chat with file preview
5. Other user receives file in real-time

---

## File Storage

Files are uploaded to Cloudinary in the `chat_files` folder with automatic resource type detection.
