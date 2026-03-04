export const BROADCAST_EMAIL_TEMPLATE = (subject, message) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">PawVaidya Announcement</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
    <h2 style="color: #2c3e50; margin-top: 0; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; display: inline-block;">${subject}</h2>
    
    <div style="margin-top: 20px; font-size: 16px; color: #555;">
      ${message.replace(/\n/g, '<br>')}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="margin: 0; color: #888; font-size: 14px;">Best regards,</p>
      <p style="margin: 5px 0 0; color: #4CAF50; font-weight: bold; font-size: 16px;">The PawVaidya Team</p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>You received this email because you are a valued member of the PawVaidya community.</p>
    <p>&copy; ${new Date().getFullYear()} PawVaidya. All rights reserved.</p>
  </div>
</body>
</html>
`;

export default BROADCAST_EMAIL_TEMPLATE;
