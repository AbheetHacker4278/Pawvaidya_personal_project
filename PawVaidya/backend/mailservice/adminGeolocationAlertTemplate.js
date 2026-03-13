const ADMIN_GEOLOCATION_ALERT_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
  .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: auto; }
  h2 { color: #FF9800; }
  p { color: #555555; line-height: 1.6; }
  .details { background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF9800; margin-top: 20px; }
  .button-container { margin-top: 30px; text-align: left; }
  .btn { display: inline-block; padding: 12px 24px; margin-right: 10px; margin-bottom: 10px; text-decoration: none; border-radius: 5px; font-weight: bold; color: white; }
  .btn-approve { background-color: #4CAF50; }
  .btn-deny { background-color: #F44336; }
</style>
</head>
<body>
  <div class="container">
    <h2>Action Required: New Login Location Detected</h2>
    <p>Dear Admin,</p>
    <p>A login attempt to the PawVaidya Admin Panel was made from a new or unrecognized location. The login has been paused pending your approval.</p>
    <div class="details">
      <p><strong>Time:</strong> {time}</p>
      <p><strong>IP Address:</strong> {ipAddress}</p>
      <p><strong>Location:</strong> {location}</p>
    </div>
    <p>Please review the details above and choose whether to approve or deny this access request:</p>
    <div class="button-container">
      <a href="{approveLink}" class="btn btn-approve">Approve Login</a>
      <a href="{denyLink}" class="btn btn-deny">Deny Access</a>
    </div>
    <p>If you do not recognize this activity, please deny access and consider updating your password.</p>
  </div>
</body>
</html>
`;
export default ADMIN_GEOLOCATION_ALERT_TEMPLATE;
