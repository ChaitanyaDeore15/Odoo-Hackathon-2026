const transporter = require('./config/mailer');
require('dotenv').config();

console.log('Testing SMTP connection with:');
console.log('Host:', process.env.EMAIL_HOST);
console.log('User:', process.env.EMAIL_USER);
console.log('Pass:', process.env.EMAIL_PASS ? '******** (hidden)' : 'MISSING');

transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Connection Error:');
        console.error(error);
        console.log('\nTIP: For Gmail, ensure you use an "App Password" (16 characters) NOT your regular password.');
        console.log('Generate one at: https://myaccount.google.com/apppasswords');
    } else {
        console.log('✅ SMTP Server is ready to take our messages!');
    }
    process.exit();
});
