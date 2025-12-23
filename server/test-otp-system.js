// Test Script for OTP Email System
// Run with: node test-otp-system.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_BASE = 'http://localhost:5000/api';

// Helper function to make API calls
async function apiCall(endpoint, method, data) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { error: error.message };
  }
}

// Test functions
async function testRegistration() {
  console.log('\n📝 Testing User Registration...\n');
  
  return new Promise((resolve) => {
    rl.question('Enter test email: ', async (email) => {
      rl.question('Enter username: ', async (username) => {
        rl.question('Enter password: ', async (password) => {
          rl.question('Enter phone (optional): ', async (phone) => {
            
            const result = await apiCall('/users/register', 'POST', {
              username,
              email,
              password,
              phone
            });
            
            if (result.error) {
              console.log('❌ Error:', result.error);
            } else {
              console.log(`\n${result.status === 201 ? '✅' : '❌'} Status: ${result.status}`);
              console.log('Response:', JSON.stringify(result.data, null, 2));
              
              if (result.data.success) {
                console.log('\n📧 Check your email for the OTP code!');
              }
            }
            
            resolve(result.data);
          });
        });
      });
    });
  });
}

async function testVerifyOTP() {
  console.log('\n🔐 Testing OTP Verification...\n');
  
  return new Promise((resolve) => {
    rl.question('Enter email: ', async (email) => {
      rl.question('Enter OTP code: ', async (otp) => {
        
        const result = await apiCall('/users/verify-otp', 'POST', {
          email,
          otp
        });
        
        if (result.error) {
          console.log('❌ Error:', result.error);
        } else {
          console.log(`\n${result.status === 200 ? '✅' : '❌'} Status: ${result.status}`);
          console.log('Response:', JSON.stringify(result.data, null, 2));
          
          if (result.data.success && result.data.token) {
            console.log('\n🎉 Email verified! Token received.');
            console.log('Token:', result.data.token.substring(0, 30) + '...');
          }
        }
        
        resolve(result.data);
      });
    });
  });
}

async function testResendOTP() {
  console.log('\n🔄 Testing Resend OTP...\n');
  
  return new Promise((resolve) => {
    rl.question('Enter email: ', async (email) => {
      
      const result = await apiCall('/users/resend-otp', 'POST', { email });
      
      if (result.error) {
        console.log('❌ Error:', result.error);
      } else {
        console.log(`\n${result.status === 200 ? '✅' : '❌'} Status: ${result.status}`);
        console.log('Response:', JSON.stringify(result.data, null, 2));
        
        if (result.data.success) {
          console.log('\n📧 New OTP sent! Check your email.');
        }
      }
      
      resolve(result.data);
    });
  });
}

async function testLogin() {
  console.log('\n🔑 Testing Login...\n');
  
  return new Promise((resolve) => {
    rl.question('Enter email/username: ', async (identifier) => {
      rl.question('Enter password: ', async (password) => {
        
        const result = await apiCall('/users/login', 'POST', {
          identifier,
          password
        });
        
        if (result.error) {
          console.log('❌ Error:', result.error);
        } else {
          console.log(`\n${result.status === 200 ? '✅' : '❌'} Status: ${result.status}`);
          console.log('Response:', JSON.stringify(result.data, null, 2));
          
          if (result.data.success && result.data.token) {
            console.log('\n🎉 Login successful! Token received.');
          }
        }
        
        resolve(result.data);
      });
    });
  });
}

// Main menu
async function showMenu() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   OTP Email System - Test Suite       ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log('1. Register New User (sends OTP)');
  console.log('2. Verify OTP');
  console.log('3. Resend OTP');
  console.log('4. Login');
  console.log('5. Exit\n');
  
  return new Promise((resolve) => {
    rl.question('Select option (1-5): ', (answer) => {
      resolve(answer);
    });
  });
}

// Main loop
async function main() {
  console.clear();
  console.log('🚀 OTP Email System Test Tool\n');
  console.log('⚠️  Make sure your server is running on http://localhost:5000\n');
  console.log('Press Ctrl+C to exit anytime.\n');
  
  let continueLoop = true;
  
  while (continueLoop) {
    const choice = await showMenu();
    
    switch (choice) {
      case '1':
        await testRegistration();
        break;
      case '2':
        await testVerifyOTP();
        break;
      case '3':
        await testResendOTP();
        break;
      case '4':
        await testLogin();
        break;
      case '5':
        console.log('\n👋 Goodbye!\n');
        continueLoop = false;
        break;
      default:
        console.log('\n❌ Invalid option. Please try again.\n');
    }
    
    if (continueLoop) {
      await new Promise((resolve) => {
        rl.question('\nPress Enter to continue...', () => resolve());
      });
    }
  }
  
  rl.close();
  process.exit(0);
}

// Run the test tool
main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
