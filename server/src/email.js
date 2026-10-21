import { Resend } from 'resend';

const FROM = 'GURL <accounts@gurl.michaelcosand.com>';

export async function sendGurlEmail({ to, subject, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    text,
  });

  if (error) {
    console.error('GURL email delivery failed:', error.name);
    throw new Error('Email delivery failed');
  }

  console.log('GURL email accepted by Resend:', data?.id);
  return data;
}
