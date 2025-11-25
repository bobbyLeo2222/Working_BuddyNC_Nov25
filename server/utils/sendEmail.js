import nodemailer from 'nodemailer';

let transporter;

function resolveBool(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return String(value).toLowerCase() !== 'false';
}

function createTransporter() {
  if (transporter) return transporter;

  const {
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE
  } = process.env;

  const user = EMAIL_USER || SMTP_USER;
  const pass = EMAIL_PASS || SMTP_PASS;

  if (!user || !pass) {
    throw new Error('Missing email credentials. Set EMAIL_USER/EMAIL_PASS or SMTP_USER/SMTP_PASS.');
  }

  const rawPort = EMAIL_PORT || SMTP_PORT;
  const secure = resolveBool(EMAIL_SECURE ?? SMTP_SECURE, undefined);
  const port = rawPort ? Number(rawPort) : secure === false ? 587 : 465;

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST || SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: secure ?? port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }) {
  const mailer = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER;

  const info = await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return info;
}
