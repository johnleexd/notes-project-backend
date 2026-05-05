import nodemailer from 'nodemailer';
import { ENV } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: false,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  },
});

export const sendVerificationEmail = async (
  to: string,
  name: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${ENV.BACKEND_URL}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${ENV.APP_NAME}" <${ENV.SMTP_FROM}>`,
    to,
    subject: `Verify your email - ${ENV.APP_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to ${ENV.APP_NAME}, ${name}! 👋</h2>
        <p style="font-size: 16px; color: #555;">
          Thank you for signing up. Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 14px; color: #888;">
          Or copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color: #4F46E5;">${verificationUrl}</a>
        </p>
        <p style="font-size: 14px; color: #888;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #aaa; text-align: center;">
          &copy; ${new Date().getFullYear()} ${ENV.APP_NAME}. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
