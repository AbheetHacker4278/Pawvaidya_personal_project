const ADMIN_LOGIN_FAILED_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
  .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
  h2 { color: #D32F2F; }
  p { color: #555555; line-height: 1.6; }
  .details { background-color: #fce4e4; padding: 15px; border-left: 4px solid #D32F2F; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <h2>Security Alert: Failed Login Attempts</h2>
    <p>Dear Admin,</p>
    <p>We detected multiple failed login attempts to the PawVaidya Admin Panel.</p>
    <div class="details">
      <p><strong>Time:</strong> {time}</p>
      <p><strong>IP Address:</strong> {ipAddress}</p>
      <p><strong>Location:</strong> {location}</p>
      <p><strong>Attempts:</strong> {attempts}</p>
    </div>
    <p>If you forgot your password, please reset it. If you did not attempt to log in, someone might be trying to access your account.</p>
  </div>
</body>
</html>
`;
export default ADMIN_LOGIN_FAILED_ALERT_TEMPLATE;
