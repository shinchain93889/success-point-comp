import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { spawn } from 'child_process';
import path from 'path';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL || 'successpcinstitute@gmail.com';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('[mailer] SendGrid initialized with API key');
} else {
  console.log('[mailer] No SendGrid API key found in environment');
}

if (!SMTP_USER || !SMTP_PASSWORD) {
  // We don't throw here to avoid crashing builds; runtime will handle and show a friendly error.
  // eslint-disable-next-line no-console
  console.warn('SMTP credentials are not set. Emails will fail to send until SMTP_USER and SMTP_PASSWORD are provided.');
}

const EMAIL_MODE = process.env.EMAIL_MODE; // 'test' to force Ethereal

async function getTransport() {
  const useTest = EMAIL_MODE === 'test' || !SMTP_USER || !SMTP_PASSWORD;
  if (useTest) {
    const testAccount = await nodemailer.createTestAccount();
    // eslint-disable-next-line no-console
    console.info('[mailer] Using Ethereal test SMTP account (no real emails sent)');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.info('[mailer] Using Gmail SMTP for real email delivery');
  
  // Try SMTPS (465) first as it works better with app passwords
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
}

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

async function sendEmailWithPython(data: ContactPayload): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log('[mailer] Using Python SMTP with MIMEText/MIMEMultipart');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'send_email.py');
    const pythonProcess = spawn('python3', [scriptPath], {
      env: {
        ...process.env,
        SMTP_HOST,
        SMTP_PORT: SMTP_PORT.toString(),
        SMTP_USER,
        SMTP_PASSWORD,
        BUSINESS_EMAIL,
      },
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const lines = output.trim().split('\n');
          const jsonLine = lines[lines.length - 1]; // Last line should be JSON result
          const result = JSON.parse(jsonLine);
          
          if (result.success) {
            console.log('[mailer] Python email service completed successfully');
            resolve(true);
          } else {
            console.error('[mailer] Python email service failed:', result.error);
            reject(new Error(result.error));
          }
        } catch (e) {
          console.error('[mailer] Failed to parse Python output:', output);
          reject(new Error('Failed to parse email service response'));
        }
      } else {
        console.error('[mailer] Python email service error:', errorOutput);
        reject(new Error(`Email service exited with code ${code}: ${errorOutput}`));
      }
    });
    
    // Send the contact data to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
  });
}

export async function sendContactEmails(data: ContactPayload) {
  // Try Python SMTP first (most reliable with your setup)
  try {
    await sendEmailWithPython(data);
    return; // Success with Python
  } catch (error: any) {
    console.error('[mailer] Python SMTP failed, trying SendGrid fallback:', error.message);
  }

  // Try SendGrid as fallback if Python fails
  if (SENDGRID_API_KEY) {
    try {
      console.log('[mailer] Using SendGrid API for email delivery');
      console.log('[mailer] SendGrid API key exists:', SENDGRID_API_KEY ? 'YES' : 'NO');
      console.log('[mailer] Business email:', BUSINESS_EMAIL);
      
      // Send business email
      const businessResult = await sgMail.send({
        to: BUSINESS_EMAIL,
        from: 'contact@example.com', // SendGrid sandbox domain (works without verification)
        replyTo: data.email || undefined,
        subject: `New contact from ${data.name}`,
        html: `<p>You received a new contact submission:</p>
               <ul>
                 <li><strong>Name:</strong> ${data.name}</li>
                 <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
               </ul>
               <p><strong>Message:</strong></p>
               <p style="white-space: pre-line;">${data.message}</p>`,
      });
      console.log('[mailer] SendGrid business email sent successfully!');

      // Send user acknowledgment
      if (data.email) {
        const userResult = await sgMail.send({
          to: data.email,
          from: 'contact@example.com', // SendGrid sandbox domain (works without verification)
          replyTo: BUSINESS_EMAIL,
          subject: 'We received your message – Success Point Computer',
          html: `<p>Hi ${data.name},</p>
                 <p>Thanks for reaching out to <strong>Success Point Computer</strong>. We received your message and will get back to you soon.</p>
                 <p><strong>Your message:</strong></p>
                 <p style="white-space: pre-line;">${data.message}</p>
                 <p>Regards,<br/>Success Point Computer</p>`,
        });
        console.log('[mailer] SendGrid user email sent successfully!');
      }
      console.log('[mailer] All SendGrid emails sent successfully, not falling back to SMTP');
      return; // Success with SendGrid
    } catch (error: any) {
      console.error('[mailer] SendGrid failed with detailed error:');
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Full error:', error);
      if (error.response?.body) {
        console.error('SendGrid response body:', JSON.stringify(error.response.body, null, 2));
      }
      console.log('[mailer] Falling back to Gmail SMTP due to SendGrid failure');
    }
  }

  // Final fallback to Node.js SMTP (least reliable but last resort)
  const transporter = await getTransport();

  const fromAddress = SMTP_USER ? `Success Point Website <${SMTP_USER}>` : 'Success Point Website <no-reply@example.com>';

  const toBusiness = {
    from: fromAddress,
    to: BUSINESS_EMAIL,
    subject: `New contact from ${data.name}`,
    replyTo: data.email || undefined,
    text: `You received a new contact submission:\n\nName: ${data.name}\nEmail: ${data.email || 'N/A'}\n\nMessage:\n${data.message}`,
    html: `<p>You received a new contact submission:</p>
           <ul>
             <li><strong>Name:</strong> ${data.name}</li>
             <li><strong>Email:</strong> ${data.email || 'N/A'}</li>
           </ul>
           <p><strong>Message:</strong></p>
           <p style="white-space: pre-line;">${data.message}</p>`,
  } as const;

  const infoBusiness = await transporter.sendMail(toBusiness);
  console.log('[mailer] Business email sent successfully to:', BUSINESS_EMAIL);

  // In test mode, log the preview URL
  const testUrlBusiness = nodemailer.getTestMessageUrl(infoBusiness);
  if (testUrlBusiness) {
    // eslint-disable-next-line no-console
    console.info(`[mailer] Preview business email: ${testUrlBusiness}`);
  }

  // Optional copy to user
  if (data.email) {
    const infoUser = await transporter.sendMail({
      from: fromAddress,
      to: data.email,
      subject: 'We received your message – Success Point Computer',
      replyTo: BUSINESS_EMAIL,
      text: `Hi ${data.name},\n\nThanks for reaching out to Success Point Computer. We received your message and will get back to you soon.\n\nYour message:\n${data.message}\n\nRegards,\nSuccess Point Computer`,
      html: `<p>Hi ${data.name},</p>
             <p>Thanks for reaching out to <strong>Success Point Computer</strong>. We received your message and will get back to you soon.</p>
             <p><strong>Your message:</strong></p>
             <p style="white-space: pre-line;">${data.message}</p>
             <p>Regards,<br/>Success Point Computer</p>`,
    });
    console.log('[mailer] User acknowledgment sent successfully to:', data.email);
    const testUrlUser = nodemailer.getTestMessageUrl(infoUser);
    if (testUrlUser) {
      // eslint-disable-next-line no-console
      console.info(`[mailer] Preview user email: ${testUrlUser}`);
    }
  }

  // All sending done via `transporter` above.
}
