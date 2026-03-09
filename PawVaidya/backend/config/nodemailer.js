import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use STARTTLS (standard for port 587)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps avoid SSL/TLS handshake failures in cloud environments
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,   // 15 seconds
    socketTimeout: 30000      // 30 seconds
});