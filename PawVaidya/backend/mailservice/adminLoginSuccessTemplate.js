const ADMIN_LOGIN_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
  .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
  h2 { color: #333333; }
  p { color: #555555; line-height: 1.6; }
  .details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin-top: 20px; }
</style>
</head>
<body>
  <div class="container">
    <h2>Successful Login Alert</h2>
    <p>Dear Admin,</p>
    <p>We are notifying you of a successful login to the PawVaidya Admin Panel.</p>
    <div class="details">
      <p><strong>Time:</strong> {time}</p>
      <p><strong>IP Address:</strong> {ipAddress}</p>
      <p><strong>Location:</strong> {location}</p>
    </div>
    <p>If this was you, no further action is required.</p>
    <p>If you did not authorize this login, please change your password immediately and review the security logs.</p>
  </div>
</body>
</html>
`;
export default ADMIN_LOGIN_SUCCESS_TEMPLATE;
