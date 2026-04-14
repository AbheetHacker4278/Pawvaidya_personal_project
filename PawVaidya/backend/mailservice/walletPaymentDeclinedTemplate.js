const WALLET_PAYMENT_DECLINED_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fdf8f0;
            border-radius: 10px;
        }
        .header {
            background: linear-gradient(135deg, #991b1b, #dc2626);
            color: white;
            padding: 25px;
            border-radius: 12px 12px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }
        .header h2 { margin: 0; font-size: 22px; }
        .header p { margin: 5px 0 0; opacity: 0.8; font-size: 13px; }
        .content {
            padding: 25px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .declined-box {
            background: linear-gradient(135deg, #fef2f2, #fee2e2);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #fecaca;
        }
        .declined-box .amount {
            font-size: 28px;
            font-weight: 900;
            color: #dc2626;
        }
        .balance-box {
            background: linear-gradient(135deg, #fffdf7, #fff8e6);
            padding: 18px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 1.5px solid #f0d080;
        }
        .balance-box .balance {
            font-size: 28px;
            font-weight: 900;
            color: #c8860a;
        }
        .details {
            list-style: none;
            padding: 0;
        }
        .details li {
            padding: 10px 12px;
            margin: 6px 0;
            background: #fdf8f0;
            border-radius: 8px;
            font-size: 14px;
        }
        .action-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .signature {
            margin-top: 25px;
            text-align: center;
            color: #5A4035;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>⚠️ Paw Wallet Payment Declined</h2>
        <p>Insufficient wallet balance for this payment</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>A wallet payment was attempted via QR scan during your appointment, but it was <strong>declined due to insufficient funds</strong>.</p>

        <div class="declined-box">
            <p style="margin:0 0 4px; font-size:12px; color:#dc2626; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Amount Required</p>
            <p class="amount" style="margin:0;">₹{amountRequired}</p>
        </div>

        <div class="balance-box">
            <p style="margin:0 0 4px; font-size:12px; color:#c8860a; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Your Current Wallet Balance</p>
            <p class="balance" style="margin:0;">₹{currentBalance}</p>
        </div>

        <p><strong>Appointment Details:</strong></p>
        <ul class="details">
            <li><strong>Pet:</strong> {petName}</li>
            <li><strong>Doctor:</strong> Dr. {doctorName}</li>
            <li><strong>Appointment Date:</strong> {appointmentDate}</li>
        </ul>

        <div class="action-box">
            <p style="margin:0; font-weight:700; color:#0369a1;">💳 Please pay via Cash or Card</p>
            <p style="margin:6px 0 0; font-size:13px; color:#4b5563;">You can complete this payment in person using Cash or Card at the clinic.</p>
        </div>

        <p style="font-size:13px; color:#6b7280; margin-top:15px;">If you believe this is an error, please contact our support team.</p>

        <div class="signature">
            <p>Best regards,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

export default WALLET_PAYMENT_DECLINED_TEMPLATE;
