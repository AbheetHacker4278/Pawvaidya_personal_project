export const BETA_APPLICATION_RECEIVED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 20px auto; padding: 0; background: #f8fafc; }
        .wrapper { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%); color: white; padding: 36px 30px; text-align: center; position: relative; overflow: hidden; }
        .header::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; }
        .header::after { content: ''; position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.06); border-radius: 50%; }
        .header .icon { font-size: 44px; margin-bottom: 8px; }
        .header h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
        .content { padding: 32px 30px; }
        .badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); color: #166534; border: 1px solid #bbf7d0; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 700; margin-bottom: 20px; }
        .feature-card { background: linear-gradient(135deg, #faf5ff, #ede9fe); border: 1.5px solid #c4b5fd; border-radius: 14px; padding: 20px; margin: 20px 0; }
        .feature-card .label { font-size: 10px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .feature-card .name { font-size: 22px; font-weight: 900; color: #4f46e5; margin: 0; }
        .feature-card .category { font-size: 12px; color: #6d28d9; font-weight: 600; margin-top: 4px; }
        .timeline { background: #f8fafc; border-radius: 12px; padding: 18px; margin: 20px 0; border-left: 4px solid #7c3aed; }
        .timeline p { margin: 0; font-size: 13px; color: #475569; }
        .timeline strong { color: #1e293b; }
        .status-chip { display: inline-block; padding: 4px 12px; background: #fef9c3; color: #854d0e; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid #fde047; }
        .footer-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        .signature { text-align: center; color: #4f46e5; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="icon">🚀</div>
            <h2>Beta Application Received!</h2>
            <p>You're in the queue for early access</p>
        </div>
        <div class="content">
            <p>Dear <strong>{userName}</strong>,</p>
            <div class="badge">✅ Application Submitted Successfully</div>
            <p>Your application for early beta access has been received and is currently under review by our admin team. We appreciate your enthusiasm in helping shape PawVaidya's future!</p>

            <div class="feature-card">
                <p class="label">Applied Feature</p>
                <p class="name">{featureName}</p>
                <p class="category">Category: {featureCategory}</p>
            </div>

            <div class="timeline">
                <p><strong>What Happens Next?</strong></p>
                <p style="margin-top:8px;">📋 Our admin team will review your application within <strong>2–5 business days</strong>.</p>
                <p style="margin-top:6px;">📧 You will receive an <strong>approval or rejection email</strong> once the decision is made.</p>
                <p style="margin-top:6px;">🎯 If approved, the beta feature will be <strong>immediately unlocked</strong> in your account.</p>
            </div>

            <p>Application Status: <span class="status-chip">⏳ Under Review</span></p>

            <p style="font-size:13px; color:#64748b;">Your motivation helps us prioritize the right testers. Thank you for sharing your thoughts!</p>

            <div class="signature">
                <p>Excited to build with you,<br/><strong>PawVaidya Beta Team</strong> 🐾</p>
            </div>
        </div>
        <div class="footer-note">
            This is an automated confirmation. Please do not reply to this email.<br/>
            PawVaidya — Pioneering Pet Healthcare
        </div>
    </div>
</body>
</html>`;

export const BETA_APPROVED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 20px auto; padding: 0; background: #f8fafc; }
        .wrapper { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 60%, #34d399 100%); color: white; padding: 36px 30px; text-align: center; }
        .header .icon { font-size: 52px; margin-bottom: 8px; }
        .header h2 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
        .header p { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 32px 30px; }
        .approved-badge { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 2px solid #22c55e; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
        .approved-badge .icon { font-size: 32px; }
        .approved-badge h3 { margin: 8px 0 4px; color: #166534; font-size: 20px; font-weight: 900; }
        .approved-badge p { margin: 0; color: #15803d; font-size: 13px; }
        .feature-card { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1.5px solid #93c5fd; border-radius: 14px; padding: 20px; margin: 20px 0; }
        .feature-card .label { font-size: 10px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 1px; }
        .feature-card .name { font-size: 22px; font-weight: 900; color: #1e40af; margin: 4px 0; }
        .access-note { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 16px 18px; margin: 20px 0; }
        .access-note p { margin: 0; font-size: 13px; color: #166534; }
        .access-note strong { font-size: 14px; display: block; margin-bottom: 6px; color: #14532d; }
        .cta-button { display: block; width: fit-content; margin: 20px auto; padding: 14px 32px; background: linear-gradient(135deg, #059669, #10b981); color: white; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 15px; text-align: center; box-shadow: 0 4px 14px rgba(16,185,129,0.4); }
        .admin-note { background: #f8fafc; border-radius: 10px; padding: 14px 16px; margin: 16px 0; border-left: 3px solid #94a3b8; font-size: 13px; color: #475569; font-style: italic; }
        .signature { text-align: center; color: #059669; font-size: 14px; margin-top: 24px; }
        .footer-note { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 0; padding: 16px 20px; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="icon">🎉</div>
            <h2>You're In! Beta Access Approved</h2>
            <p>Welcome to the exclusive early tester program</p>
        </div>
        <div class="content">
            <p>Dear <strong>{userName}</strong>,</p>
            <p>Fantastic news — your application for early beta access has been <strong>approved</strong>! You are now part of an exclusive group of testers helping shape the future of PawVaidya.</p>

            <div class="approved-badge">
                <div class="icon">✅</div>
                <h3>Access Granted!</h3>
                <p>Your beta seat is now active</p>
            </div>

            <div class="feature-card">
                <p class="label">🔓 Unlocked Feature</p>
                <p class="name">{featureName}</p>
                <p style="color:#3b82f6; font-size:12px; font-weight:600;">Category: {featureCategory}</p>
            </div>

            {adminNoteHtml}

            <div class="access-note">
                <strong>🚀 How to Access Your Beta Feature:</strong>
                <p>Log in to your PawVaidya account and navigate to the <strong>Beta Access</strong> section in your profile. Your approved feature is now unlocked and ready to use!</p>
            </div>

            <a href="{appUrl}/beta-access" class="cta-button">🔬 Open Beta Features Dashboard</a>

            <p style="font-size:13px; color:#64748b; text-align:center;">As a beta tester, your feedback is invaluable. Please share any bugs or suggestions through the in-app feedback form.</p>

            <div class="signature">
                <p>Welcome to the inner circle,<br/><strong>PawVaidya Beta Team</strong> 🐾</p>
            </div>
        </div>
        <div class="footer-note">
            PawVaidya — Pioneering Pet Healthcare · Beta Program
        </div>
    </div>
</body>
</html>`;

export const BETA_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 20px auto; padding: 0; background: #f8fafc; }
        .wrapper { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #475569 0%, #64748b 100%); color: white; padding: 36px 30px; text-align: center; }
        .header .icon { font-size: 44px; margin-bottom: 8px; }
        .header h2 { margin: 0; font-size: 24px; font-weight: 800; }
        .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
        .content { padding: 32px 30px; }
        .status-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0; }
        .status-box h3 { color: #334155; margin: 0 0 4px; font-size: 18px; }
        .status-box p { color: #64748b; font-size: 13px; margin: 0; }
        .feature-card { background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin: 16px 0; border-left: 4px solid #94a3b8; }
        .feature-card .label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .feature-card .name { font-size: 18px; font-weight: 800; color: #334155; margin: 4px 0 0; }
        .admin-note { background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin: 16px 0; font-size: 13px; color: #78350f; }
        .encourage { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .encourage p { margin: 0; font-size: 13px; color: #166534; }
        .cta-button { display: block; width: fit-content; margin: 20px auto; padding: 12px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; }
        .signature { text-align: center; color: #475569; font-size: 14px; margin-top: 24px; }
        .footer-note { font-size: 12px; color: #94a3b8; text-align: center; padding: 16px 20px; border-top: 1px solid #f1f5f9; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="icon">📋</div>
            <h2>Beta Application Update</h2>
            <p>Thank you for your interest in early access</p>
        </div>
        <div class="content">
            <p>Dear <strong>{userName}</strong>,</p>
            <p>Thank you for applying to PawVaidya's early beta tester program. After careful review, we were unable to approve your application for this feature at this time.</p>

            <div class="status-box">
                <h3>Application Status: Not Approved</h3>
                <p>This cycle's beta seats have been filled or criteria were not met</p>
            </div>

            <div class="feature-card">
                <p class="label">Applied Feature</p>
                <p class="name">{featureName}</p>
            </div>

            {adminNoteHtml}

            <div class="encourage">
                <p><strong>🌟 Don't give up!</strong> Beta access opens periodically as new features are developed. Keep an eye on the <strong>Beta Access</strong> page in your PawVaidya profile — new opportunities appear regularly.</p>
            </div>

            <a href="{appUrl}/beta-access" class="cta-button">🔬 Browse Other Beta Features</a>

            <p style="font-size:13px; color:#64748b; text-align:center;">Your enthusiasm means a lot to us. We hope to include you in future beta rounds!</p>

            <div class="signature">
                <p>Warm regards,<br/><strong>PawVaidya Beta Team</strong> 🐾</p>
            </div>
        </div>
        <div class="footer-note">
            PawVaidya — Pioneering Pet Healthcare · Beta Program
        </div>
    </div>
</body>
</html>`;
