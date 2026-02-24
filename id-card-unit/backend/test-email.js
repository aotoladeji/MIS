const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('================================');
  console.log('Testing Email Configuration');
  console.log('================================');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Pass:', process.env.SMTP_PASS ? '***' : 'NOT SET!');
  console.log('================================\n');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false // For testing only
    }
  });

  try {
    // Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Server connection successful!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'aot.oladeji@gmail.com', // PUT YOUR EMAIL HERE
      subject: 'Test Email - ID Card System',
      html: `
        <h1>Email Test Successful! ✅</h1>
        <p>If you received this email, the system is configured correctly.</p>
        <p><strong>Sent from:</strong> ${process.env.SMTP_USER}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n================================');
    console.log('SUCCESS! Email system is working.');
    console.log('================================');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Wrong SMTP host/port');
    console.error('2. Incorrect password');
    console.error('3. Account needs to enable SMTP access');
    console.error('4. Firewall blocking connection');
    console.error('\nContact UI IT department for help.');
  }
}

testEmail();