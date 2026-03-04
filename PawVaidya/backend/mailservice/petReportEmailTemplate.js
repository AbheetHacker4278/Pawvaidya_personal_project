export const VISIT_NOTE_EMAIL = (userData, doctorData, appointmentData, notes) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #442e24;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fdf8f0;
            border-radius: 15px;
        }
        .header {
            background-color: #5A4035;
            color: #ffffff;
            padding: 30px;
            border-radius: 15px 15px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }
        .header h2 { margin: 0; font-size: 24px; font-weight: 800; }
        .content {
            padding: 25px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(90,64,53,0.08);
            border: 1px solid #e8d5b0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f9f4ec;
            border-radius: 10px;
        }
        .info-item { margin-bottom: 10px; }
        .info-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #a08060; }
        .info-value { font-size: 14px; font-weight: 600; color: #5A4035; }
        .notes-section {
            margin-top: 25px;
            padding: 20px;
            background-color: #fffbf0;
            border-left: 5px solid #c8860a;
            border-radius: 8px;
        }
        .notes-title { font-weight: 800; color: #c8860a; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .signature {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e8d5b0;
        }
        .signature strong { color: #5A4035; }
        .footer-note { font-size: 12px; color: #a08060; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🐾 Pet Visit Summary</h2>
    </div>

    <div class="content">
        <p>Hi <strong>${userData.name}</strong>,</p>
        <p>A new visit note has been added for your pet following your consultation with <strong>Dr. ${doctorData.name}</strong>.</p>

        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Appointment Date</div>
                <div class="info-value">${appointmentData.slotDate}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Doctor</div>
                <div class="info-value">Dr. ${doctorData.name}</div>
            </div>
        </div>

        <div class="notes-section">
            <div class="notes-title">📋 Doctor's Observations & Notes</div>
            <div style="white-space: pre-wrap;">${notes}</div>
        </div>

        <p style="margin-top: 25px;">You can view the full medical history and reports in your PawVaidya profile.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Healthcare Team</strong></p>
        </div>
    </div>
    <p class="footer-note">This is an automated message. Please do not reply directly to this email.</p>
</body>
</html>
`;

export const PET_REPORT_EMAIL = (userData, doctorData, reportData) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #442e24;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fdf8f0;
            border-radius: 15px;
        }
        .header {
            background-color: #5A4035;
            color: #ffffff;
            padding: 30px;
            border-radius: 15px 15px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }
        .header h2 { margin: 0; font-size: 24px; font-weight: 800; }
        .content {
            padding: 25px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(90,64,53,0.08);
            border: 1px solid #e8d5b0;
        }
        .pet-card {
            background: linear-gradient(135deg, #5A4035, #7a5a4a);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
        }
        .pet-name { font-size: 22px; font-weight: 900; margin: 0; }
        .pet-info { font-size: 14px; opacity: 0.9; }
        .section { margin-bottom: 25px; }
        .section-title { font-weight: 800; color: #5A4035; border-bottom: 2px solid #e8d5b0; padding-bottom: 5px; margin-bottom: 12px; }
        .data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f9f4ec; font-size: 14px; }
        .data-label { font-weight: 700; color: #a08060; }
        .data-value { font-weight: 600; color: #5A4035; }
        .signature {
            margin-top: 30px;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #e8d5b0;
        }
        .footer-note { font-size: 12px; color: #a08060; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🛡️ Pet Health Report</h2>
    </div>

    <div class="content">
        <p>Hi <strong>${userData.name}</strong>,</p>
        <p>A detailed health report has been generated for your pet by <strong>Dr. ${doctorData.name}</strong>.</p>

        <div class="pet-card">
            <p class="pet-name">${reportData.petName} 🐾</p>
            <p class="pet-info">${reportData.species} | ${reportData.breed} | ${reportData.age}</p>
        </div>

        <div class="section">
            <div class="section-title">Health Overview</div>
            <div class="data-row">
                <span class="data-label">Gender</span>
                <span class="data-value">${reportData.gender || 'N/A'}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Weight</span>
                <span class="data-value">${reportData.weight || 'N/A'}</span>
            </div>
            <div class="data-row">
                <span class="data-label">Color</span>
                <span class="data-value">${reportData.color || 'N/A'}</span>
            </div>
        </div>

        ${reportData.allergies ? `
        <div class="section">
            <div class="section-title">Allergies</div>
            <p style="font-size: 14px; color: #dc2626; font-weight: 600;">${reportData.allergies}</p>
        </div>
        ` : ''}

        ${reportData.existingConditions ? `
        <div class="section">
            <div class="section-title">Existing Conditions</div>
            <p style="font-size: 14px;">${reportData.existingConditions}</p>
        </div>
        ` : ''}

        <p style="margin-top: 25px;">Please check the PawVaidya app for the complete report history and any attached documents.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Healthcare Team</strong></p>
        </div>
    </div>
    <p class="footer-note">This is an automated message. Please do not reply directly to this email.</p>
</body>
</html>
`;
