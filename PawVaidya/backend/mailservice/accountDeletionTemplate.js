export const ACCOUNT_DELETION_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted</title>
</head>
<body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f7;">
  <div style="background: linear-gradient(135deg, #ff4b2b, #ff416c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Account Terminated</h1>
  </div>
  
  <div style="background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e1e1; border-top: none;">
    <p style="font-size: 16px; color: #555;">Hello <strong>{name}</strong>,</p>
    
    <p style="font-size: 16px; color: #555;">This is to inform you that your PawVaidya account associated with the email <strong>{email}</strong> has been deleted by an administrator AI.</p>
    
    <div style="background-color: #fff4f4; border-left: 4px solid #ff416c; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #d32f2f; font-weight: 500;">
        <strong>Important Information:</strong>
      </p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #d32f2f;">
        <li>All your personal data has been permanently removed.</li>
        <li>Your appointments and medical records are no longer accessible.</li>
        <li>You will no longer receive communications from our platform.</li>
      </ul>
    </div>
    
    <p style="font-size: 16px; color: #555;">If you believe this action was taken in error or if you have any questions, please contact our support team immediately.</p>
    
    <p style="font-size: 16px; color: #555; margin-top: 30px;">Best regards,<br><span style="color: #ff416c; font-weight: 600;">The PawVaidya Team</span></p>
  </div>
  
  <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
    <p>This is an automated message, please do not reply to this email.</p>
    <p>&copy; 2026 PawVaidya. All rights reserved.</p>
    <p>This App is Powered by Gemini AI.</p>
  </div>
</body>
</html>
`;

export default ACCOUNT_DELETION_TEMPLATE;
