import ejs from 'ejs';
import status from 'http-status';
import nodemailer from 'nodemailer';
import path from 'path';
import { envVars } from '../config/env.utils';
import AppError from '../errorHelpers/AppError';

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER_.SMTP_HOST,
  port: envVars.EMAIL_SENDER_.SMTP_PORT,
  secure: envVars.EMAIL_SENDER_.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: envVars.EMAIL_SENDER_.SMTP_USER,
    pass: envVars.EMAIL_SENDER_.SMTP_PASS,
  },
});

interface ISendEmailOptions {
  to: string;
  subject: string;
  template: string;
  templateData: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  to,
  subject,
  template,
  templateData,
  attachments,
}: ISendEmailOptions) => {
  try {
    const templatePath = path.resolve(process.cwd(), `src/app/templates/${template}.ejs`);

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: envVars.EMAIL_SENDER_.FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });
    return info;
  } catch (error: any) {
    throw new AppError(status.BAD_REQUEST, `Failed to send email: ${error.message}`);
  }
};
