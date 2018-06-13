var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM EXPENSE_TYPE_MASTER where etm_status = 0 order by etm_id desc");
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

router.get('/:etmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.etmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM expense_type_master where etm_id=$1',[id]);
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

/*router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO expense_type_master(etm_type, etm_status) values($1,0)',[req.body.etm_type]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM expense_type_master');
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
});*/

router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO expense_type_master(etm_type, etm_status) values($1,0) RETURNING *',
        params = [req.body.etm_type]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:etmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.etmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('UPDATE expense_type_master SET etm_type=$1 where etm_id=$2',[req.body.etm_type,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM expense_type_master');
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

router.post('/delete/:etmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.etmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('UPDATE expense_type_master SET etm_status=1 WHERE etm_id=($1)', [id]);
    // SQL Query > Insert Data
    // client.query('UPDATE employee_master SET cm_code=$1, cm_name=$2, cm_mobile=$3, cm_email=$4, cm_address=$5, cm_city=$6, cm_state=$7, cm_pin_code=$8, cm_car_name=$9, cm_car_model=$10, cm_car_number=$11 where cm_id=$12',[req.body.cm_code,req.body.cm_name,req.body.cm_mobile,req.body.cm_email,req.body.cm_address,req.body.cm_city,req.body.cm_state,req.body.cm_pin_code,req.body.cm_car_name,req.body.cm_car_model,req.body.cm_car_number,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM expense_type_master');
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
