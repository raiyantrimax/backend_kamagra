# Email Setup Guide for Render Hosting

## Problem
Emails not working on production on Render hosting.

## Solutions

### Option 1: Use SendGrid (Recommended for Production) ✅

SendGrid is free for up to 100 emails/day and works reliably on Render.

1. **Sign up for SendGrid**
   - Go to https://sendgrid.com/
   - Sign up for free account
   - Verify your email

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Select "Full Access" or "Mail Send" only
   - Copy the API key (save it securely!)

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=<your-sendgrid-api-key>
   ```

4. **Verify Sender Identity** (Required by SendGrid)
   - Go to Settings → Sender Authentication
   - Verify a Single Sender (use your email)
   - Use this verified email as `EMAIL_USER` in production

### Option 2: Use Gmail (Simple but may have issues)

Gmail works but can be blocked on some hosting platforms.

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Render App" as name
   - Copy the 16-character password

3. **Set Environment Variables in Render**
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=<16-character-app-password>
   ```

### Option 3: Use Brevo (formerly Sendinblue) - Free 300 emails/day

1. **Sign up for Brevo**
   - Go to https://www.brevo.com/
   - Sign up for free account

2. **Get SMTP Credentials**
   - Go to Settings → SMTP & API
   - Copy SMTP Server, Port, Login, and Key

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp-relay.brevo.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=<your-brevo-login>
   EMAIL_PASSWORD=<your-brevo-smtp-key>
   ```

### Option 4: Use Mailgun - Free 1000 emails/month

1. **Sign up for Mailgun**
   - Go to https://www.mailgun.com/
   - Sign up for free account

2. **Get SMTP Credentials**
   - Go to Sending → Domain Settings → SMTP
   - Copy credentials

3. **Set Environment Variables in Render**
   ```
   EMAIL_HOST=smtp.mailgun.org
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=<your-mailgun-username>
   EMAIL_PASSWORD=<your-mailgun-password>
   ```

## Setting Environment Variables in Render

1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable from your chosen option above
6. Click "Save Changes"
7. Render will automatically redeploy

## Testing Email Configuration

After deploying, check your Render logs:
- Look for: `✓ Email service is ready to send messages` (success)
- Or: `Email transporter configuration error` (check your settings)

When registering a user, you should see:
- `✓ OTP email sent successfully to user@example.com`

## Troubleshooting

### Email not sending
1. **Check Render logs** for error messages
2. **Verify environment variables** are set correctly
3. **Check email service credentials** are valid
4. **Verify sender email** is authorized (SendGrid/Mailgun)

### Emails going to spam
- Use a professional SMTP service (SendGrid, Mailgun)
- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified sender domain

### Timeout errors
- Make sure `EMAIL_PORT` is correct (usually 587 or 465)
- Set `EMAIL_SECURE=false` for port 587
- Set `EMAIL_SECURE=true` for port 465

## Recommended Solution

**For Production: Use SendGrid or Brevo**
- ✅ Free tier available
- ✅ Reliable delivery
- ✅ Works on all hosting platforms
- ✅ Better deliverability than Gmail
- ✅ Analytics and tracking

**For Development: Use Gmail**
- ✅ Quick to set up
- ✅ No verification needed
- ⚠️ May be blocked on some hosts
