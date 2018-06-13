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
    const query = client.query("SELECT * FROM dailyexpense_master em LEFT OUTER JOIN expense_type_master etm on em.em_etm_id = etm.etm_id where em.em_status = 0 order by dem_id desc");
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

router.get('/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM dailyexpense_master em LEFT OUTER JOIN expense_type_master etm on em.em_etm_id = etm.etm_id where em.em_status = 0 and dem_id=$1",[id]);
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
  const expenseSingleData = req.body;
  // const expenseSingleData = req.body.expense;
  // const expenseMultipleData = req.body.expenseMultipleData;
  // const expenseMultipleDataSale = req.body.expenseMultipleDataSale;

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    client.query('INSERT INTO dailyexpense_master(em_payment_mode, em_received_by, em_comment, em_date, em_etm_id, em_amount, em_cheque_no, em_cheque_date, em_status) values($1,$2,$3,$4,$5,$6,$7,$8,0)',[expenseSingleData.em_payment_mode,expenseSingleData.em_received_by,expenseSingleData.em_comment,expenseSingleData.em_date,expenseSingleData.em_etm_id.etm_id,expenseSingleData.em_amount,expenseSingleData.em_cheque_no,expenseSingleData.em_cheque_date]);
        
    client.query('COMMIT;');
    // SQL Query > Insert Data
    
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM dailyexpense_master');
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
  const expenseSingleData = req.body;
  // const expenseSingleData = req.body.expense;
  // const expenseMultipleData = req.body.expenseMultipleData;
  // const expenseMultipleDataSale = req.body.expenseMultipleDataSale;

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO dailyexpense_master(em_payment_mode, em_received_by, em_comment, em_date, em_etm_id, em_amount, em_cheque_no, em_cheque_date, em_status) values($1,$2,$3,$4,$5,$6,$7,$8,0) RETURNING *',
        params = [expenseSingleData.em_payment_mode,expenseSingleData.em_received_by,expenseSingleData.em_comment,expenseSingleData.em_date,expenseSingleData.em_etm_id.etm_id,expenseSingleData.em_amount,expenseSingleData.em_cheque_no,expenseSingleData.em_cheque_date,expenseSingleData.em_com_id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  const expenseSingleData = req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    client.query('update dailyexpense_master set em_payment_mode=$1, em_received_by=$2, em_comment=$3, em_date=$4, em_etm_id=$5, em_amount=$6, em_cheque_no=$7, em_cheque_date=$8 where dem_id=$9',[expenseSingleData.em_payment_mode,expenseSingleData.em_received_by,expenseSingleData.em_comment,expenseSingleData.em_date,expenseSingleData.em_etm.etm_id,expenseSingleData.em_amount,expenseSingleData.em_cheque_no,expenseSingleData.em_cheque_date,id]);
    
    client.query('COMMIT;');
    const query = client.query('SELECT * FROM dailyexpense_master');
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

router.post('/delete/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    
    client.query('BEGIN;');

    client.query('update dailyexpense_master set em_status=1 where dem_id=$1',[id]);

    client.query('COMMIT;');
    const query = client.query('SELECT * FROM dailyexpense_master');
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
