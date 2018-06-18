var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);


router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data=[];
  // Get a Postgres client from the connection pool
  pool.connect(function(err, client, done){
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM order_master order by om_id desc limit 1');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      var no=1;
      if(results.length>0){
        no=results[0].om_no + 1;
      }
      var singleInsert = 'INSERT INTO order_master(om_no,om_tm_id,om_amount,om_net_amount,om_cgst_amount,om_sgst_amount,om_igst_amount,om_cgst_per,om_sgst_per,om_igst_per,om_status) values($1,$2,0,0,0,0,0,0,0,0,0) RETURNING *',
        params = [no,req.body.tm_id]
        client.query(singleInsert, params, function (error, result) {
        data.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(data);
      });
    });
    done(err);
  });
});



router.post('/product/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  // Grab data from http request
  
  // Get a Postgres client from the connection pool
  pool.connect(function(err, client, done){
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
        var singleInsert = 'INSERT INTO order_product_master(opm_om_id,opm_pm_id,opm_quantity,opm_rate) values($1,$2,$3,$4) RETURNING *',
        params = [req.body.opm_om_id.om_id,req.body.opm_pm_id.pm_id,req.body.opm_quantity,req.body.opm_rate]
        client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
      });
    done(err);
    });
  });
  
  router.post('/product/remove/', oauth.authorise(), (req, res, next) => {
  const results = [];

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master where opm_om_id =$1",[req.body.om_id]);
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

router.post('/check', oauth.authorise(), (req, res, next) => {
  const results = [];

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_master where om_tm_id =$1",[req.body.tm_id]);
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

router.post('/edit/:omId', oauth.authorise(), (req, res, next) => {
  const results = [];
  id=req.params.omId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

   client.query('BEGIN;');
    // SQL Query > Insert Data
    // client.query('UPDATE employee_master SET cm_code=$1, cm_name=$2, cm_mobile=$3, cm_email=$4, cm_address=$5, cm_city=$6, cm_state=$7, cm_pin_code=$8, cm_car_name=$9, cm_car_model=$10, cm_car_number=$11 where cm_id=$12',[req.body.cm_code,req.body.cm_name,req.body.cm_mobile,req.body.cm_email,req.body.cm_address,req.body.cm_city,req.body.cm_state,req.body.cm_pin_code,req.body.cm_car_name,req.body.cm_car_model,req.body.cm_car_number,id]);
    // SQL Query > Select Data
    var singleInsert = 'UPDATE order_master SET om_tm_id=$1 WHERE om_id=($2) RETURNING *',
        params = [req.body.tm_id,id];
        console.log(params);
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});

module.exports = router;
