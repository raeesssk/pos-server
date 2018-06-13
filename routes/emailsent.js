var express = require('express');
var nodemailer = require('nodemailer');
var router = express.Router();
var oauth = require('../oauth/index');
var http = require('http');

router.post('/', oauth.authorise(), (req, res, next) => {

  let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // secure:true for port 465, secure:false for port 587
      auth: {
          user: 'raees.shaikh241@gmail.com',
          pass: 'a1b2c3d4$'
      }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"Green Air" <raees.shaikh241@gmail.com>', // sender address
      to: req.body.recipient, // list of receivers
      subject: req.body.subj, // Subject line
      // text: 'Hello world ?', // plain text body
      html: req.body.message // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log(error);
          return res.end(error);
      }
      console.log('Message %s sent: %s', info.messageId, info.response);
      return res.end();

  });

});

module.exports = router;
