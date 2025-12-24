// Test Brevo Email Service
require('dotenv').config();
const { sendOTPEmail, sendWelcomeEmail, initializeEmailService } = require('./services/email.service');

async function testBrevoEmail() {
  console.log('🧪 Testing Brevo Email Service\n');
  
  // Initialize service
  const initialized = initializeEmailService();
  if (!initialized) {
    console.error('❌ Email service initialization failed');
    process.exit(1);
  }
  
  console.log('\n📧 Enter test email details:\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('Enter recipient email: ', async (email) => {
    readline.question('Enter recipient name (optional): ', async (name) => {
      
      console.log('\n1. Send OTP Email');
      console.log('2. Send Welcome Email');
      readline.question('\nChoose test (1 or 2): ', async (choice) => {
        
        try {
          if (choice === '1') {
            console.log('\n📨 Sending OTP email...');
            console.log(`From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`);
            console.log(`To: ${email}\n`);
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const result = await sendOTPEmail(email, otp, name || 'Test User');
            
            if (result.success) {
              console.log('✅ OTP email sent successfully!');
              console.log(`📌 OTP Code: ${otp}`);
              console.log('\n💡 Check your inbox and spam folder');
            } else {
              console.log('❌ Failed to send OTP email');
              console.log('Error:', result.error || result.message);
            }
          } else if (choice === '2') {
            console.log('\n📨 Sending Welcome email...');
            console.log(`From: ${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`);
            console.log(`To: ${email}\n`);
            const result = await sendWelcomeEmail(email, name || 'Test User');
            
            if (result.success) {
              console.log('✅ Welcome email sent successfully!');
              console.log('\n💡 Check your inbox and spam folder');
            } else {
              console.log('❌ Failed to send Welcome email');
              console.log('Error:', result.error);
            }
          } else {
            console.log('❌ Invalid choice');
          }
        } catch (error) {
          console.error('❌ Error:', error.message);
          if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.body || error.response, null, 2));
          }
          console.error('Stack:', error.stack);
        }
        
        readline.close();
        process.exit(0);
      });
    });
  });
}

testBrevoEmail();
