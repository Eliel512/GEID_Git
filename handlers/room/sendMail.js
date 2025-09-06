const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

module.exports = (targets, message, from, subject, alternatives) => {
  const smtpOptions = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GEID_EMAIL,
      pass: process.env.GEID_PASS,
    },
  };
  const transporter = nodemailer.createTransport(smtpTransport(smtpOptions));

  for (let target of targets) {
    const mailOptions = {
      from: from,
      to: target.email,
      subject: subject,
      html: message,
      alternatives: alternatives,
    };

    // Envoyer le mail avec le transporteur défini
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Invitation sent to ${target.email}: ${info.response}`);
      }
    });
  }
};
