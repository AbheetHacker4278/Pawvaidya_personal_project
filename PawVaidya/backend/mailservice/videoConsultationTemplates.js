
export const VIDEO_BOOKING_TEMPLATE = (userName, doctorName, slotDate, slotTime) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background-color: #fdf8f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fdf8f0; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #5A4035; border-radius: 24px; overflow: hidden; margin-top: 40px; box-shadow: 0 20px 50px rgba(90,64,53,0.1); }
        .header { background: linear-gradient(135deg, #5A4035, #3d2b1f); padding: 40px 20px; text-align: center; }
        .header h1 { color: #fdf8f0; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .details-card { background: #fdf8f0; border: 1px solid #e8d5b0; border-radius: 16px; padding: 25px; margin: 25px 0; }
        .detail-item { margin-bottom: 12px; font-size: 14px; display: flex; align-items: center; }
        .detail-item strong { width: 100px; color: #a08060; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; }
        .highlight { color: #c8860a; font-weight: 800; }
        .button-container { text-align: center; margin-top: 35px; }
        .button { display: inline-block; background: linear-gradient(135deg, #5A4035, #7a5a48); color: #ffffff !important; padding: 16px 32px; border-radius: 14px; font-weight: 800; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 10px 20px rgba(90,64,53,0.1); }
        .footer { text-align: center; padding: 30px; font-size: 11px; color: #a08060; font-weight: 600; letter-spacing: 0.05em; }
        .footer p { margin: 5px 0; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>RESERVATION RECEIVED 🎥</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <p class="greeting">Hello ${userName},</p>
                    <p>Your request for a premium video consultation session with <span class="highlight">Dr. ${doctorName}</span> has been successfully logged in our system.</p>
                    
                    <div class="details-card">
                        <div class="detail-item">
                            <strong>Expert</strong>
                            <span class="highlight">Dr. ${doctorName}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Date</strong>
                            <span>${slotDate}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Time</strong>
                            <span>${slotTime}</span>
                        </div>
                    </div>

                    <p style="font-size: 14px; color: #a08060; font-weight: 500;">
                        The specialist is currently reviewing your pet's records and will update you shortly. You will receive a confirmation alert once the session is approved.
                    </p>

                    <div class="button-container">
                        <a href="#" class="button">View My Appointments</a>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p>&copy; 2026 PAWVAIDYA PET CARE CONCIERGE</p>
                    <p>PRECISION PET CARE • ANYWHERE • ANYTIME</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;

export const VIDEO_STATUS_UPDATE_TEMPLATE = (userName, doctorName, status, slotDate, slotTime, message, rescheduleSlot = '') => {
    const statusColors = {
        'Approved': { bg: 'linear-gradient(135deg, #059669, #10b981)', text: '#059669', title: 'CONSULTATION CONFIRMED' },
        'Declined': { bg: 'linear-gradient(135deg, #dc2626, #ef4444)', text: '#dc2626', title: 'CONSULTATION DECLINED' },
        'Rescheduled': { bg: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', text: '#1d4ed8', title: 'SCHEDULE UPDATED' },
        'Cancelled': { bg: 'linear-gradient(135deg, #dc2626, #ef4444)', text: '#dc2626', title: 'CONSULTATION CANCELLED' }
    };

    const config = statusColors[status] || statusColors['Rescheduled'];

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { margin: 0; padding: 0; background-color: #fdf8f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #fdf8f0; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #5A4035; border-radius: 24px; overflow: hidden; margin-top: 40px; box-shadow: 0 20px 50px rgba(90,64,53,0.1); }
        .header { background: ${config.bg}; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.02em; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
        .status-pill { display: inline-block; padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; background: ${config.text}15; color: ${config.text}; border: 1px solid ${config.text}30; margin-bottom: 15px; }
        .details-card { background: #fdf8f0; border: 1px solid #e8d5b0; border-radius: 16px; padding: 25px; margin: 25px 0; }
        .detail-item { margin-bottom: 12px; font-size: 14px; display: flex; align-items: center; }
        .detail-item strong { width: 100px; color: #a08060; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; }
        .highlight { font-weight: 800; color: #5A4035; }
        .note-box { border-left: 4px solid #c8860a; padding-left: 15px; margin-top: 20px; font-style: italic; color: #a08060; font-size: 13px; }
        .footer { text-align: center; padding: 30px; font-size: 11px; color: #a08060; font-weight: 600; letter-spacing: 0.05em; }
        .footer p { margin: 5px 0; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="main">
            <tr>
                <td class="header">
                    <h1>${config.title} 🔔</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    <div class="status-pill">${status}</div>
                    <p class="greeting">Hello ${userName},</p>
                    <p>There has been a critical update regarding your video consultation with <span style="color: #c8860a; font-weight: 800;">Dr. ${doctorName}</span>.</p>
                    
                    <div class="details-card">
                        <div class="detail-item">
                            <strong>Status</strong>
                            <span style="font-weight: 900; color: ${config.text}">${status}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Original</strong>
                            <span class="highlight">${slotDate} at ${slotTime}</span>
                        </div>
                        ${rescheduleSlot ? `
                        <div class="detail-item" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e8d5b0;">
                            <strong>New Slot</strong>
                            <span style="font-weight: 900; color: #1d4ed8;">${rescheduleSlot}</span>
                        </div>` : ''}
                    </div>

                    ${message ? `<div class="note-box"><strong>Doctor's Note:</strong> ${message}</div>` : ''}

                    <p style="font-size: 14px; margin-top: 25px; font-weight: 500;">
                        ${status === 'Approved' ? 'Your session is confirmed. Please ensure you have a stable connection and join via the "Join Call" button in your dashboard at the scheduled time.' :
            status === 'Rescheduled' ? 'The expert has suggested a refined schedule to better accommodate your pet. Please visit the app to accept or adjust this slot.' :
                'We apologize for any inconvenience. You can browse other available specialists or reach out to our concierge for assistance.'}
                    </p>
                </td>
            </tr>
            <tr>
                <td class="footer">
                    <p>&copy; 2026 PAWVAIDYA PET CARE CONCIERGE</p>
                    <p>PRECISION PET CARE • ANYWHERE • ANYTIME</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;
};
