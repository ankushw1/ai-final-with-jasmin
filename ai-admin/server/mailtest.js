const nodemailer = require('nodemailer');

// Step 1: Configure transporter with debug logging
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: 'cpaas.support@aimobile.in',
    pass: 'St5sdHBKXFEU', // use app password if TFA is on
  },
  logger: true,    // enable internal logger
  debug: true      // show detailed SMTP debug info
});

// Step 2: Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP connection failed:', error);
  } else {
    console.log('✅ SMTP connected! Sending test email...');

    // Step 3: Email details
    const mailOptions = {
      from: 'cpaas.support@aimobile.in',
      to: 'ankushwaghmare050@gmail.com',
      subject: '🚀 Zoho SMTP Test Email',
      text: 'Hi Ankush,\n\nThis is a test email sent using Zoho SMTP via Nodemailer.\n\n– AIM SMSC',
    };

    // Step 4: Send the mail
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Email send failed:', err);
      } else {
        console.log('✅ Email sent!');
        console.log('📬 Message ID:', info.messageId);
        console.log('🧾 SMTP Response:', info.response);
      }
    });
  }
});
