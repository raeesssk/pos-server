var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*router.post('/login', oauth.authorise(), (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data = {username: req.body.username, password:  req.body.password};
  // Get a Postgres client from the connection pool
  pool.connect(function(err, client, done){
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO users(username, password) values($1, $2)',
    [data.username, data.password]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});*/

router.post('/login', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO users(username,password) values($1,$2) RETURNING *',
        params = [req.body.username,req.body.password]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});
module.exports = router;
