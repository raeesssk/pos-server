var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
const cmd = require('node-cmd');
var nodemailer = require('nodemailer');
var http = require('http');

router.post('/', oauth.authorise(), (req, res, next) => {

  	var d = new Date();
  	var yyyy = d.getFullYear().toString();
    var mm = (d.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = d.getDate().toString();

    var filename = yyyy +"-"+ (mm[1]?mm:"0"+mm[0]) +"-"+ (dd[1]?dd:"0"+dd[0]);
    var filenametest = filename+".sql";
    var filepath = "D:/zeartech/backup/"+filename+".sql";
    cmd.get("pg_dump --dbname=postgresql://postgres:zeartech@localhost:5432/pos > ../backup/"+filename+".sql --role postgres --format=c --blobs --encoding SQL_ASCII",
    function(err, data, stderr){
        if (!err) {
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
	            from: '"3 Commas Technologies" <raees.shaikh241@gmail.com>', // sender address
	            to: 'raees.telsource@gmail.com',
	            subject: 'backup database file POS', // Subject line
	            text: 'Hi please find the attachments', // plain text body
	            // html: req.body.message // html body
	            attachments: [
	                {
	                  filename: filenametest,
	                  path: filepath
	                }
	              ]
	        };

	        // send mail with defined transport object
	        transporter.sendMail(mailOptions, (error, info) => {
	            if (error) {
	                console.log(error);
	                return res.end(error);
	            }
	            console.log('Message %s sent: %s', info.messageId, info.response);
	            return res.end("success");

	        });
        } else {
        	// console.log(err);
           return res.status(500).json({success: false, data: err});
        }
    });
});

module.exports = router;
