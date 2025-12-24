// Check Brevo Verified Senders
require('dotenv').config();
const brevo = require('@getbrevo/brevo');

async function checkSenders() {
  console.log('🔍 Checking Brevo Account Configuration\n');
  
  // Check Account
  let accountApi = new brevo.AccountApi();
  let apiKey = accountApi.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  
  try {
    console.log('📊 Fetching account information...');
    const account = await accountApi.getAccount();
    console.log('\n✅ Account Details:');
    console.log('   Email:', account.email);
    console.log('   Company:', account.companyName || 'Not set');
    console.log('\n');
  } catch (error) {
    console.error('❌ Error fetching account:', error.message);
  }
  
  // Check Senders
  let sendersApi = new brevo.SendersApi();
  sendersApi.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;
  
  try {
    console.log('📧 Fetching verified senders...');
    const senders = await sendersApi.getSenders();
    
    if (senders.senders && senders.senders.length > 0) {
      console.log('\n✅ Verified Senders:');
      senders.senders.forEach((sender, index) => {
        console.log(`\n${index + 1}. ${sender.name || 'No name'}`);
        console.log(`   Email: ${sender.email}`);
        console.log(`   Active: ${sender.active ? '✓' : '✗'}`);
      });
      
      console.log('\n\n💡 To fix your issue:');
      console.log('   1. Choose one of the verified emails above');
      console.log('   2. Update your .env file:');
      console.log(`      EMAIL_FROM=${senders.senders[0].email}`);
      console.log(`      EMAIL_FROM_NAME=${senders.senders[0].name || 'Your App'}`);
    } else {
      console.log('\n⚠️  No verified senders found!');
      console.log('\n💡 To fix this:');
      console.log('   1. Go to: https://app.brevo.com/settings/senders');
      console.log('   2. Add and verify a sender email address');
      console.log('   3. Update your .env file with the verified email');
    }
  } catch (error) {
    console.error('\n❌ Error fetching senders:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.text);
    }
  }
}

checkSenders();
