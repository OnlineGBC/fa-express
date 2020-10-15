module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: !!process.env.SMTP_SECURE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  },
  emailFrom: 'FUN-SWAlert@onlinegbc.com',
  development: {
    username: 'root',
    password: null,
    database: 'fa_rpa',
    host: '127.0.0.1',
    dialect: 'mysql'
  }
};
