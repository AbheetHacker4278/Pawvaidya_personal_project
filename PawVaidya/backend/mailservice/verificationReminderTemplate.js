export const VERIFICATION_REMINDER_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Verification - PawVaidya</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #59ff00ff, #45f500ff); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: white; margin: 0;">Don't Lose Your Account!</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; border-top: none;">
    <p>Hello {name},</p>
    <p>We noticed that you haven't verified your account yet. To ensure the security of our community and keep your account active, please complete the verification process.</p>
    
    <div style="background-color: #fff3e0; border-left: 4px solid #00ff37ff; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #e65100;">⚠️ Important Note:</p>
      <p style="margin: 5px 0 0;">Unverified accounts are automatically deleted after 10 days of registration. You have approximately <strong>{daysLeft} days</strong> remaining.</p>
    </div>

    <p>Please log in to your account and complete the verification process to ensure uninterrupted access to our expert veterinarians and all features of the PawVaidya platform.</p>
    
    <p>If you have already verified your account, please ignore this email.</p>
    <p>Best regards,<br>The PawVaidya Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em; border-top: 1px solid #eee; padding-top: 15px;">
    <p><strong>Disclaimer:</strong> This is a mandatory administrative notification related to your PawVaidya account status. Your account is currently in a temporary state awaiting identity verification. Failure to verify within the allocated 10-day window will result in permanent account deactivation and data removal for system security and compliance.</p>
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export default VERIFICATION_REMINDER_TEMPLATE;
