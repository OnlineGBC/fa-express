const nodemailer = require('nodemailer');
const Entities = require('html-entities').AllHtmlEntities;
const config = require('../config/config');

const entities = new Entities();
class Mailer {
  async sendMail(data, emailAddress) {

    const encodedData = entities.encode(data);
    const transporter = nodemailer.createTransport(config.smtp);
    const info = await transporter.sendMail({
      from: config.emailFrom, // sender address
      to: emailAddress, // list of receivers
      subject: 'Logs for recent actions performed', // Subject line
      html: `<pre>${encodedData}</pre>`, // html body
    });
    console.log('Message sent: %s', info.messageId);
  }
}

module.exports = Mailer;
