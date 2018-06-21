var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.post('/pending', oauth.authorise(), (req, res, next) => {
  const results = [];

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id INNER JOIN table_master tm on om.om_tm_id=tm.tm_id INNER JOIN area_master am on tm.tm_am_id=am.am_id where opm.opm_status_type='pending'");
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => { 
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

router.post('/order/update', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

   client.query('BEGIN;');
    var singleInsert = "UPDATE order_product_master SET opm_status_type='completed' WHERE opm_id=$1 RETURNING *",
        params = [req.body.opm_id];
       
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});

router.post('/complete', oauth.authorise(), (req, res, next) => {
  const results = [];

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id INNER JOIN table_master tm on om.om_tm_id=tm.tm_id INNER JOIN area_master am on tm.tm_am_id=am.am_id where opm.opm_status_type='completed'");
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => { 
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

module.exports = router;