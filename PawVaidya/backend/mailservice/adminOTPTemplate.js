export const ADMIN_OTP_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login OTP</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #1e293b, #334155); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Admin Security Verification</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <p style="font-size: 16px;">Hello Admin,</p>
    <p style="font-size: 16px;">A login attempt was made to the PawVaidya Admin Panel. Please use the following One-Time Password (OTP) to complete your login:</p>
    <div style="text-align: center; margin: 40px 0;">
      <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #0f172a; background: #f1f5f9; padding: 15px 30px; border-radius: 8px; border: 2px dashed #cbd5e1;">{otp}</span>
    </div>
    <p style="color: #ef4444; font-weight: bold; font-size: 14px; text-align: center;">This code will expire in 90 seconds.</p>
    <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If you did not attempt to login, please change your password immediately and contact the system administrator.</p>
    <p style="font-size: 14px; color: #64748b;">Best regards,<br>PawVaidya Security Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 0.8em;">
    <p>This is an automated security message. Please do not reply.</p>
  </div>
</body>
</html>
`;
export default ADMIN_OTP_TEMPLATE;
