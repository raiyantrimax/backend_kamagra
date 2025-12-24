const brevo = require('@getbrevo/brevo');

// Configure Brevo API
let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

// Initialize email service (call this after MongoDB connection)
function initializeEmailService() {
  if (process.env.BREVO_API_KEY) {
    console.log('✓ Brevo email service is ready to send messages');
    return true;
  } else {
    console.error('Email configuration error: BREVO_API_KEY is not set');
    console.error('Please set your BREVO_API_KEY environment variable');
    return false;
  }
}

// Generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp, name) {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = 'Verify Your Email - OTP Code';
  sendSmtpEmail.to = [{ email: email, name: name || 'User' }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; text-align: center; padding: 20px; background-color: white; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'User'}!</h2>
          <p>Thank you for registering with us. To complete your registration, please verify your email address using the OTP code below:</p>
          <div class="otp-code">${otp}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { 
    name: process.env.EMAIL_FROM_NAME || 'Car Rental App', 
    email: process.env.EMAIL_FROM || 'noreply@yourdomain.com' 
  };

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✓ OTP email sent successfully to ${email}`);
    console.log(`Message ID: ${result.messageId}`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Email sending error:', error.message);
    if (error.response && error.response.body) {
      console.error('Brevo API Error:', JSON.stringify(error.response.body, null, 2));
    }
    console.error('Sender:', process.env.EMAIL_FROM);
    console.error('Brevo API Key configured:', !!process.env.BREVO_API_KEY);
    return { success: false, message: 'Failed to send OTP email', error: error.message };
  }
}

// Send welcome email after verification
async function sendWelcomeEmail(email, name) {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = 'Welcome to Our Platform!';
  sendSmtpEmail.to = [{ email: email, name: name || 'User' }];
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Your email has been successfully verified. Welcome to our platform!</p>
          <p>You can now enjoy all the features and benefits of your account.</p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = { 
    name: process.env.EMAIL_FROM_NAME || 'Car Rental App', 
    email: process.env.EMAIL_FROM || 'noreply@yourdomain.com' 
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✓ Welcome email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeEmailService,
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail
};
