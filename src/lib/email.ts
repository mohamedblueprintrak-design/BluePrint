// Email service using nodemailer
// For development, log emails to console
// For production, configure SMTP

import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter based on environment
function createTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      // Do not fail on invalid certs (useful for some SMTP servers)
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send an email
 * In development mode (no SMTP configured), logs the email to console
 * In production mode, sends the email via SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;
  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || 'noreply@blueprint.ae';

  // Check if SMTP is configured
  const transporter = createTransporter();

  if (!transporter) {
    // Development mode - log to console
    console.log('📧 Email (dev mode):');
    console.log('='.repeat(50));
    console.log(`From: ${emailFrom}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('-'.repeat(50));
    console.log('HTML Body:');
    console.log(html);
    if (text) {
      console.log('-'.repeat(50));
      console.log('Text Body:');
      console.log(text);
    }
    console.log('='.repeat(50));
    return true;
  }

  // Production mode - send via SMTP
  try {
    const info = await transporter.sendMail({
      from: `"BluePrint" <${emailFrom}>`,
      to,
      subject,
      html,
      text: text || undefined,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to send email:', message);
    return false;
  }
}

/**
 * Send multiple emails (batch)
 */
export async function sendBatchEmails(emails: EmailOptions[]): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    const result = await sendEmail(email);
    if (result) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Test SMTP connection
 */
export async function testEmailConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      success: false,
      message: 'SMTP is not configured. Running in development mode.',
    };
  }

  try {
    await transporter.verify();
    return {
      success: true,
      message: 'SMTP connection successful.',
    };
  } catch (error) {
    return {
      success: false,
      message: `SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

const emailService = {
  sendEmail,
  sendBatchEmails,
  testEmailConnection,
};

export default emailService;
