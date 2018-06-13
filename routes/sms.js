var express = require('express');
// var Nexmo = require('nexmo');
var router = express.Router();
var oauth = require('../oauth/index');
var http = require('http');
// var nexmo = new Nexmo({
//   apiKey: 'aee6bf09',
//   apiSecret: '3ab707e4f0d04f82',
//   // applicationId: APP_ID,
//   // privateKey: PRIVATE_KEY_PATH,
// }, {debug: true});

router.post('/', oauth.authorise(), (req, res, next) => {

  const toNumber = req.body.recipient;
  const text = req.body.message;
  // var options = 'http://smshorizon.co.in/api/sendsms.php?user=raees&apikey=oe0F1BRCS4ApvT7F4htF&mobile=8668420527&message=hi this is a test message from orient furniture&type=txt';
  // var options = 'http://bhashsms.com/api/sendmsg.php?user=9860048761&pass=8a94cb5&sender=TESTTO&phone=9860048761&text=hi this is a test message from orient furniture&priority=ndnd&stype=normal';
  
  var options = 'http://login.bulksmsgateway.in/sendmessage.php?user=raees&password=9860048761&mobile='+toNumber+'&message='+text+'&sender=ORIENT&type=3'
  http.get(options, function(response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      return res.end(chunk);
    });
  }).on('error', function(e) {
    return res.end();
  });
  
  // nexmo.message.sendSms(
  //   'NEXMO', toNumber, text, {type: 'unicode'},
  //   (err, responseData) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.send(responseData);
  //       // Optional: add socket.io -- will explain later
  //     }
  //   }
  // );


  // nexmo.message.sendSms(req.body.sender, req.body.recipient, req.body.message);

});

router.get('/balance', oauth.authorise(), (req, res, next) => {

  const toNumber = req.body.recipient;
  const text = req.body.message;
  // var options = 'http://smshorizon.co.in/api/sendsms.php?user=raees&apikey=oe0F1BRCS4ApvT7F4htF&mobile=8668420527&message=hi this is a test message from orient furniture&type=txt';
  // var options = 'http://bhashsms.com/api/sendmsg.php?user=9860048761&pass=8a94cb5&sender=TESTTO&phone=9860048761&text=hi this is a test message from orient furniture&priority=ndnd&stype=normal';
  
  var options = 'http://login.bulksmsgateway.in/userbalance.php?user=raees&password=9860048761&type=3';
  http.get(options, function(response) {
    // console.log(response);

    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      return res.end(chunk);
    });
    // return response.end();
  }).on('error', function(e) {
    return res.end();
  });
  
  // nexmo.message.sendSms(
  //   'NEXMO', toNumber, text, {type: 'unicode'},
  //   (err, responseData) => {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.send(responseData);
  //       // Optional: add socket.io -- will explain later
  //     }
  //   }
  // );


  // nexmo.message.sendSms(req.body.sender, req.body.recipient, req.body.message);

});

module.exports = router;
