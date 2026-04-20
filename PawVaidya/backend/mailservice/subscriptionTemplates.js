export const SUBSCRIPTION_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fdf8f0; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .plan-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #bfdbfe; }
        .plan-box .plan-name { font-size: 28px; font-weight: 900; color: #1e40af; }
        .plan-box .price { font-size: 20px; color: #1e3a8a; opacity: 0.8; }
        .details { list-style: none; padding: 0; }
        .details li { padding: 10px 12px; margin: 6px 0; background: #f8fafc; border-radius: 8px; font-size: 14px; border-left: 4px solid #3b82f6; }
        .signature { margin-top: 25px; text-align: center; color: #1e3a8a; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎉 Welcome to PawPlan {planName}!</h2>
        <p>Your premium pet wellness membership is now active</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>Thank you for choosing PawVaidya Premium! Your subscription has been successfully processed, and your pet care benefits are now active.</p>

        <div class="plan-box">
            <p style="margin:0 0 4px; font-size:12px; color:#1e40af; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Active Plan</p>
            <p class="plan-name" style="margin:0;">{planName} Tier</p>
            <p class="price" style="margin:4px 0 0;">₹{amount} / Month</p>
        </div>

        <p><strong>Membership Details:</strong></p>
        <ul class="details">
            <li><strong>Start Date:</strong> {startDate}</li>
            <li><strong>Next Billing Date:</strong> {expiryDate}</li>
            <li><strong>Payment Method:</strong> {paymentMethod}</li>
            <li><strong>Status:</strong> Active</li>
        </ul>

        <p style="font-size:13px; color:#64748b; margin-top:15px;">You can manage your subscription and view your benefits anytime from your profile dashboard.</p>

        <div class="signature">
            <p>Happy Pet Parentage,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

export const SUBSCRIPTION_REVOCATION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #fffafb; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #7f1d1d, #ef4444); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .status-box { background: #fef2f2; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #fecaca; }
        .status-box .status-text { font-size: 24px; font-weight: 900; color: #991b1b; }
        .refund-box { background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center; margin: 15px 0; border: 1px solid #bbf7d0; color: #166534; }
        .reason-box { background: #f8fafc; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #94a3b8; font-style: italic; color: #475569; font-size: 14px; }
        .signature { margin-top: 25px; text-align: center; color: #991b1b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚠️ Subscription Revoked</h2>
        <p>Account Status Update: Premium Access Terminated</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>This is to inform you that your PawPlan <strong>{planName}</strong> subscription has been revoked by the administrator.</p>

        <div class="status-box">
            <p style="margin:0 0 4px; font-size:12px; color:#991b1b; text-transform:uppercase; font-weight:700; letter-spacing:1px;">New Status</p>
            <p class="status-text" style="margin:0;">Subscription Ended</p>
        </div>

        <p><strong>Reason for Revocation:</strong></p>
        <div class="reason-box">
            "{reason}"
        </div>

        {refundHtml}

        <p style="font-size:13px; color:#64748b; margin-top:15px;">Your account has reverted to the Free Tier. Any appointments booked exceeding the free quota may need to be rescheduled. If you believe this is an error, please contact our support team.</p>

        <div class="signature">
            <p>Regards,<br/><strong>PawVaidya Support</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

export const SUBSCRIPTION_EXPIRY_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f8fafc; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #475569, #64748b); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .alert-box { background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0; }
        .alert-box .alert-text { font-size: 20px; font-weight: 800; color: #334155; }
        .action-button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 800; margin: 15px 0; }
        .signature { margin-top: 25px; text-align: center; color: #475569; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>⏱️ PawPlan Expired</h2>
        <p>Your premium pet wellness membership has ended.</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>Your PawPlan <strong>{planName}</strong> subscription reached its expiration date on <strong>{expiryDate}</strong> and is no longer active.</p>

        <div class="alert-box">
            <p class="alert-text" style="margin:0;">You are now on the Free Tier</p>
        </div>

        <p>Without an active subscription, you are subject to the standard limit of 2 appointments per month, and you no longer have access to premium discounts or priority support.</p>
        
        <div style="text-align: center;">
            <a href="{appUrl}/subscription" class="action-button">Renew Subscription Now</a>
        </div>

        <div class="signature">
            <p>Best regards,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;


export const GIFT_SUBSCRIPTION_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f0fdf4; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #166534, #22c55e); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .gift-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #bbf7d0; position: relative; overflow: hidden; }
        .gift-box .plan-name { font-size: 28px; font-weight: 900; color: #166534; }
        .gift-box .duration { font-size: 18px; color: #15803d; font-weight: 700; }
        .badge { display: inline-block; padding: 4px 12px; background: #22c55e; color: white; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; }
        .details { list-style: none; padding: 0; }
        .details li { padding: 10px 12px; margin: 6px 0; background: #f8fafc; border-radius: 8px; font-size: 14px; border-left: 4px solid #22c55e; }
        .signature { margin-top: 25px; text-align: center; color: #166534; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎁 Surprise! A Gift for You & Your Pet</h2>
        <p>Premium Access Granted by PawVaidya Admin</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>We have some exciting news! The PawVaidya Administration has gifted you a premium subscription to enhance your pet care journey.</p>
        
        <div class="gift-box">
            <span class="badge">Special Gift</span>
            <p class="plan-name" style="margin:0;">{planName} Membership</p>
            <p class="duration" style="margin:5px 0 0;">Duration: {duration} Months</p>
        </div>

        <p><strong>Gift Details:</strong></p>
        <ul class="details">
            <li><strong>Status:</strong> Active (Complimentary)</li>
            <li><strong>Expiry Date:</strong> {expiryDate}</li>
            <li><strong>Value:</strong> 100% Discounted</li>
        </ul>

        <p style="font-size:13px; color:#64748b; margin-top:15px;">Enjoy unlimited access to premium features, priority bookings, and exclusive discounts. Your pet deserves the best!</p>

        <div class="signature">
            <p>Warmly,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

export const GIFT_SUBSCRIPTION_EXPIRY_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f8fafc; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; margin: -20px -20px 20px -20px; }
        .header h2 { margin: 0; font-size: 22px; }
        .content { padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .info-box { background: #f1f5f9; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px solid #e2e8f0; }
        .info-box .info-text { font-size: 20px; font-weight: 800; color: #334155; }
        .action-button { display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 800; margin: 15px 0; }
        .signature { margin-top: 25px; text-align: center; color: #475569; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>✨ Gifted Access Ended</h2>
        <p>Your complimentary premium period has concluded.</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>We hope you enjoyed your gifted <strong>{planName}</strong> subscription! This is to inform you that your complimentary access period ended today.</p>

        <div class="info-box">
            <p class="info-text" style="margin:0;">Your session has expired</p>
        </div>

        <p>Your account has been moved to the Free Tier. To continue enjoying premium benefits like priority booking and exclusive discounts, you can choose a plan that fits your needs.</p>
        
        <div style="text-align: center;">
            <a href="{appUrl}/subscription" class="action-button">Continue with Premium</a>
        </div>

        <div class="signature">
            <p>Best regards,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;
