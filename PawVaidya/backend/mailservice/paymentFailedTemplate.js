export const PAYMENT_FAILED_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Appointment Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #ff4b2b, #ff416c); padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
    <h1 style="color: white; margin: 0;">Payment Failed</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); border: 1px solid #ddd; border-top: none;">
    <p>Hello {name},</p>
    <p>We were unable to process the payment for your appointment with <strong>Dr. {docName}</strong> scheduled for <strong>{slotDate}</strong> at <strong>{slotTime}</strong>.</p>
    
    <div style="background-color: #fff5f5; border-left: 4px solid #ff4b2b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold; color: #d32f2f;">Appointment Cancelled</p>
      <p style="margin: 5px 0 0;">Because the payment was not completed, your appointment has been automatically cancelled and the slot has been released for other pet owners.</p>
    </div>

    <p>If you still wish to see the doctor, please visit the PawVaidya app and book a new appointment.</p>
    
    <p>If any amount was deducted from your account, it will be refunded automatically by Razorpay within 5-7 business days.</p>
    
    <p>Best regards,<br>The PawVaidya Team 🐾</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em; border-top: 1px solid #eee; padding-top: 15px;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export default PAYMENT_FAILED_TEMPLATE;
