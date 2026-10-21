import { betterAuth } from 'better-auth';
import { captcha } from 'better-auth/plugins';
import { pool } from './db.js';
import { sendGurlEmail } from './email.js';

export const auth = betterAuth({
  database: pool,
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for'],
      trustedProxies: ['127.0.0.1', '::1'],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  plugins: [
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey: process.env.TURNSTILE_SECRET_KEY,
      endpoints: ['/sign-up/email'],
      allowedHostnames: ['gurl.michaelcosand.com'],
    }),
  ],

  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    'https://gurl.michaelcosand.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      await sendGurlEmail({
        to: user.email,
        subject: 'Verify your GURL email',
        text: 'Welcome to GURL! Verify your email here:\n\n'
          + url + '\n\nThis link expires in one hour.',
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      await sendGurlEmail({
        to: user.email,
        subject: 'Reset your GURL password',
        text: 'Reset your GURL password here:\n\n'
          + url + '\n\nThis link expires in one hour.'
          + '\nIf you did not request this, ignore this email.',
      });
    },
  },
});
