import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const verifyEmailTemplatePath = join(
  __dirname,
  'emailTemplates',
  'verifyEmail.html'
);

const verifyEmailTemplate = readFileSync(verifyEmailTemplatePath, 'utf-8');

const verifyEmail = async (link, email) => {
  const emailDocument = verifyEmailTemplate.replace('{{link}}', link);
  try {
    const transporter = await nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.SECURE,
      service: process.env.SERVICE,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      text: 'Welcome',
      subject: 'Please verify your email address',
      html: emailDocument,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const changePasswordTemplatePath = join(
  __dirname,
  'emailTemplates',
  'changePassword.html'
);
const changePasswordTemplate = readFileSync(
  changePasswordTemplatePath,
  'utf-8'
);

const changePassword = async (link, email, username) => {
  try {
    const passwordChangeDocument = changePasswordTemplate
      .replace('{{link}}', link)
      .replace('{{username}}', username);
    const transporter = await nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.SECURE,
      service: process.env.SERVICE,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    const info = await transporter.sendMail({
      from: process.env.USER,
      to: email,
      text: 'Welcome',
      subject: 'Change your password with this link',
      html: passwordChangeDocument,
    });
  } catch (error) {
    console.log(error);
  }
};

export { verifyEmail, changePassword };
