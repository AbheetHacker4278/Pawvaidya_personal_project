export const USER_FACE_LOGIN_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Face Login Successful</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e1e4e8; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 30px; }
        .user-greeting { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 20px; }
        .alert-box { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .login-details { background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #f3f4f6; margin-top: 25px; }
        .login-details p { margin: 8px 0; font-size: 14px; color: #4b5563; }
        .login-details b { color: #1f2937; margin-right: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #f3f4f6; }
        .logo { display: block; width: 150px; margin: 0 auto 20px; }
        .security-tip { font-size: 13px; color: #6b7280; font-style: italic; margin-top: 20px; border-top: 1px dashed #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Face Login Confirmation</h1>
        </div>
        <div class="content">
            <p class="user-greeting">Hi {name},</p>
            <div class="alert-box">
                <p><strong>Success!</strong> Your account was just accessed using <b>Face Authentication</b>. If this was you, you can safely ignore this email.</p>
            </div>
            
            <div class="login-details">
                <p><b>Time:</b> {time}</p>
                <p><b>IP Address:</b> {ip}</p>
                <p><b>Status:</b> Success (Face Verified)</p>
            </div>

            <p class="security-tip">
                Security Tip: If you did not log in just now, someone else may have access to your account. Please change your password immediately or contact our support team.
            </p>
        </div>
        <div class="footer">
            <p>&copy; 2026 PawVaidya - Secure Pet Care Services</p>
            <p>This is an automated security notification.</p>
        </div>
    </div>
</body>
</html>
`;
