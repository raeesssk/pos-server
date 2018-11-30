var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var encryption = require('../commons/encryption.js');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.post('/', (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO employee_master(emp_email) values($1) RETURNING *',
        params = [req.body.email]
    client.query(singleInsert, params, function (error, result) {
        // results.push(result.rows[0]); // Will contain your inserted rows
        var singleInsert = 'INSERT INTO users(username,password,user_emp_id,user_rm_id) values($1,$2,$3,$4) RETURNING *',
            params = [req.body.email,encryption.encrypt(req.body.conpassword),result.rows[0].emp_id,3]
          
        client.query(singleInsert, params, function (error, result1) {
            results.push(result1.rows[0]); // Will contain your inserted rows

            done();
            return res.json(results);
        });
    });
    

    done(err);
  });
});

module.exports = router;
