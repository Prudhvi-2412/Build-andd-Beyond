const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} = process.env;

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS.');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
};

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const mailer = getTransporter();
  const appName = 'Build & Beyond';
  const subject =
    purpose === 'signup'
      ? `${appName} email verification OTP`
      : purpose === 'login-2fa'
      ? `${appName} login verification OTP`
      : `${appName} password reset OTP`;

  await mailer.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text: `Your OTP is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
        <h2 style="margin:0 0 12px;">${appName}</h2>
        <p>Your one-time password is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px;margin:8px 0 16px;">${otp}</p>
        <p>This code is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
