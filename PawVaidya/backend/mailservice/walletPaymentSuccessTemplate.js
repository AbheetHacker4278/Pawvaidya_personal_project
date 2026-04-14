const WALLET_PAYMENT_SUCCESS_TEMPLATE = `
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
            background: linear-gradient(135deg, #3d2b1f, #5A4035);
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
        .amount-box {
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            margin: 20px 0;
            border: 1px solid #bbf7d0;
        }
        .amount-box .amount {
            font-size: 32px;
            font-weight: 900;
            color: #16a34a;
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
        <h2>🐾 Paw Wallet Payment Successful</h2>
        <p>Your payment has been processed via QR scan</p>
    </div>
    <div class="content">
        <p>Dear <strong>{userName}</strong>,</p>
        <p>Your Paw Wallet payment has been successfully processed during your appointment.</p>

        <div class="amount-box">
            <p style="margin:0 0 4px; font-size:12px; color:#16a34a; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Amount Deducted</p>
            <p class="amount" style="margin:0;">₹{amount}</p>
        </div>

        <div class="balance-box">
            <p style="margin:0 0 4px; font-size:12px; color:#c8860a; text-transform:uppercase; font-weight:700; letter-spacing:1px;">Remaining Wallet Balance</p>
            <p class="balance" style="margin:0;">₹{remainingBalance}</p>
        </div>

        <p><strong>Payment Details:</strong></p>
        <ul class="details">
            <li><strong>Pet:</strong> {petName}</li>
            <li><strong>Doctor:</strong> Dr. {doctorName}</li>
            <li><strong>Appointment Date:</strong> {appointmentDate}</li>
            <li><strong>Transaction ID:</strong> QR-{transactionId}</li>
        </ul>

        <p style="font-size:13px; color:#6b7280; margin-top:15px;">This payment was processed by scanning the QR code on your pet's ID card. If you did not authorize this transaction, please contact support immediately.</p>

        <div class="signature">
            <p>Best regards,<br/><strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

export default WALLET_PAYMENT_SUCCESS_TEMPLATE;
