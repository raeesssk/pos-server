var express = require('express');
var nodemailer = require('nodemailer');
var router = express.Router();
var oauth = require('../oauth/index');
var http = require('http');
var async = require('async');
var crypto = require('crypto');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
var encryption = require('../commons/encryption.js');
var pwdExpires = 0;
var pool = new pg.Pool(config);

router.post('/', function(req, res, next) {
  const results = [];
  
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, user, done) {
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // secure:true for port 465, secure:false for port 587
        auth: {
          user: '3commastech@gmail.com',
          pass: 'abcd@1237#'
        }
      });
      let mailOptions = {
        to: "'"+req.body.username+"'",
        from: '3commastech@gmail.com',
        subject: 'Restromaticz User Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + 'pos.restromaticz.com' + '/pos/reset.html?token=' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
       transporter.sendMail(mailOptions, (error, info) => {
        console.log()
        if (error) {
            console.log(error);
            return res.end(error);
        }

        pool.connect(function(err, client, done){
          if(err) {
          done();
          // pg.end();
          console.log("the error is"+err);
          return res.status(500).json({success: false, data: err});
          }

          var singleInsert = "INSERT INTO tokens(email_id,reset_tokens,token_expires) values($1,$2,now() + interval '10 minutes') RETURNING *",
            params = [req.body.username,token]
            client.query(singleInsert, params, function (error, result) {
              results.push(result.rows[0]); // Will contain your inserted rows
              done();
              return res.json(results);
            });
          done(err);
        });
      });
    }
  ], function(err) {
    if (err) return next(err);
  });
});

router.post('/reset/:tokenId',  (req, res, next) => {
  const results = [];

  const id = req.params.tokenId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM tokens where reset_tokens=$1",[id]);
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      // pg.end();
      var d = Date.now();
      if(results.length > 0 && d < results[0].token_expires )
      {
        var singleInsert = "update users set password=$1 where username=$2 RETURNING *",
          params = [encryption.encrypt(req.body.password),results[0].email_id]
          client.query(singleInsert, params, function (error, result) {
           // Will contain your inserted rows
          done();
          return res.json(result);
        });
      }
      else
      {
        return res.send('Token not Found');
      }
    });
    
    done(err);
  });
});

module.exports = router;
