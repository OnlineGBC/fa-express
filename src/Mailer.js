const nodemailer = require('nodemailer');
const config = require('../config/config');

class Mailer {
  async sendMail(data, emailAddress) {
    const transporter = nodemailer.createTransport(config.smtp);
    const info = await transporter.sendMail({
      from: config.emailFrom, // sender address
      to: emailAddress, // list of receivers
      subject: 'Logs for recent actions performed', // Subject line
      html: `<pre>${data}</pre>`, // html body
    });
    console.log('Message sent: %s', info.messageId);
  }
}

module.exports = Mailer;
