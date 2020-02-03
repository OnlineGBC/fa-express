config = {
    host: "smtp.sendgrid.net",
    port: 465,
    secure: true,
    auth: {
        user: 'apikey',
        pass: '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'
    }
}

// Email where logs will be sent
// email = 'raja@onlinegbc.com';
email = "null"

module.exports.config = config;
module.exports.email = email;

