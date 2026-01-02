/**
 * Test Script for Forgot Password Feature with OTP
 * 
 * This script demonstrates how to test the forgot password functionality
 * Run: node test-forgot-password.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com'; // Change this to a valid email in your database
const NEW_PASSWORD = 'newSecurePassword123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testForgotPassword() {
  log('\n========================================', 'cyan');
  log('Testing Forgot Password Feature', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // Step 1: Request password reset OTP
    log('Step 1: Requesting password reset OTP...', 'blue');
    const forgotResponse = await axios.post(`${BASE_URL}/api/users/forgot-password`, {
      email: TEST_EMAIL
    });
    log(`✓ Response: ${forgotResponse.data.message}`, 'green');
    log(`Status: ${forgotResponse.status}\n`, 'green');

    // Step 2: Try requesting OTP again immediately (should fail due to 10-minute wait)
    log('Step 2: Testing rate limiting - trying to request OTP again immediately...', 'blue');
    try {
      await axios.post(`${BASE_URL}/api/users/forgot-password`, {
        email: TEST_EMAIL
      });
      log('✗ Rate limiting failed - request should have been blocked', 'red');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`✓ Rate limiting working: ${error.response.data.message}`, 'green');
      } else {
        log(`✗ Unexpected error: ${error.message}`, 'red');
      }
    }

    // Step 3: Prompt for OTP
    log('\n========================================', 'yellow');
    log('Please check your email for the OTP code', 'yellow');
    log('========================================\n', 'yellow');
    log('Manual Testing Steps:', 'cyan');
    log('1. Check the email inbox for ' + TEST_EMAIL, 'cyan');
    log('2. Copy the 6-digit OTP from the email', 'cyan');
    log('3. Use the following API endpoint to reset password:\n', 'cyan');
    
    log('POST ' + BASE_URL + '/api/users/reset-password', 'green');
    log('Body:', 'green');
    log(JSON.stringify({
      email: TEST_EMAIL,
      otp: '123456', // Replace with actual OTP
      newPassword: NEW_PASSWORD
    }, null, 2), 'green');

    log('\n========================================', 'cyan');
    log('Test Case Examples:', 'cyan');
    log('========================================\n', 'cyan');

    log('Test Case 1: Invalid OTP', 'yellow');
    log('Expected: Error message "Invalid OTP"\n', 'yellow');
    try {
      await axios.post(`${BASE_URL}/api/users/reset-password`, {
        email: TEST_EMAIL,
        otp: '000000',
        newPassword: NEW_PASSWORD
      });
      log('✗ Should have failed with invalid OTP', 'red');
    } catch (error) {
      if (error.response) {
        log(`✓ ${error.response.data.message}`, 'green');
      }
    }

    log('\nTest Case 2: Missing required fields', 'yellow');
    log('Expected: Error message about missing fields\n', 'yellow');
    try {
      await axios.post(`${BASE_URL}/api/users/reset-password`, {
        email: TEST_EMAIL
      });
      log('✗ Should have failed with missing fields', 'red');
    } catch (error) {
      if (error.response) {
        log(`✓ ${error.response.data.message}`, 'green');
      }
    }

    log('\nTest Case 3: Password too short', 'yellow');
    log('Expected: Error message about password length\n', 'yellow');
    try {
      await axios.post(`${BASE_URL}/api/users/reset-password`, {
        email: TEST_EMAIL,
        otp: '123456',
        newPassword: '12345'
      });
      log('✗ Should have failed with short password', 'red');
    } catch (error) {
      if (error.response) {
        log(`✓ ${error.response.data.message}`, 'green');
      }
    }

    log('\n========================================', 'cyan');
    log('OTP Expiration Test', 'cyan');
    log('========================================', 'cyan');
    log('The OTP will expire in 10 minutes from when it was sent.', 'yellow');
    log('After 10 minutes, attempting to reset password will fail.', 'yellow');
    log('You can request a new OTP after the 10-minute cooldown period.\n', 'yellow');

    log('========================================', 'cyan');
    log('Testing completed!', 'cyan');
    log('========================================\n', 'cyan');

  } catch (error) {
    log('✗ Test failed:', 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data.message || error.response.data}`, 'red');
    } else {
      log(error.message, 'red');
    }
    log('\nMake sure:', 'yellow');
    log('1. The server is running on ' + BASE_URL, 'yellow');
    log('2. The email exists in the database', 'yellow');
    log('3. Email service (Brevo) is configured correctly', 'yellow');
  }
}

// Run the test
testForgotPassword();
