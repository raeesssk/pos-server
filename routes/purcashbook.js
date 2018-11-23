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
    const query = client.query("SELECT * FROM purcashbook_master pcm LEFT OUTER JOIN dealer_master dm on pcm.pcm_dm_id = dm.dm_id where pcm_status=0 order by pcm_id desc");
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
    const query = client.query("SELECT * FROM purcashbook_master pcm LEFT OUTER JOIN dealer_master dm on pcm.pcm_dm_id = dm.dm_id where pcm_status=0 and pcm_id=$1",[id]);
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

router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  const expenseSingleData = req.body;

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    const credit = expenseSingleData.pcm_dm_id.dm_credit;
    const amount = (parseInt(expenseSingleData.pcm_amount));
    if(credit > amount)
    {
      client.query('update dealer_master set dm_credit=dm_credit-$1 where dm_id=$2',[amount,expenseSingleData.pcm_dm_id.dm_id]);
    }
    else
    {
      const debit = amount - credit;
      client.query('update dealer_master set dm_credit=dm_credit-$1, dm_debit=dm_debit+$2 where dm_id=$3',[credit,debit,expenseSingleData.pcm_dm_id.dm_id]);
    }
    client.query('INSERT INTO purcashbook_master(pcm_dm_id, pcm_date, pcm_received_by, pcm_comment, pcm_payment_mode, pcm_amount, pcm_cheque_no, pcm_cheque_date, pcm_username, pcm_srm_id, pcm_status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0)',
      [expenseSingleData.pcm_dm_id.dm_id,expenseSingleData.pcm_date,expenseSingleData.pcm_received_by,expenseSingleData.pcm_comment,expenseSingleData.pcm_payment_mode,expenseSingleData.pcm_amount,expenseSingleData.pcm_cheque_no,expenseSingleData.pcm_cheque_date,expenseSingleData.pcm_username,expenseSingleData.pcm_srm_id]);
    
    client.query('COMMIT;');
    // SQL Query > Insert Data
    
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM purcashbook_master');
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

    const debit = expenseSingleData.old_pcm_dm_id.dm_debit;
    const amount = expenseSingleData.old_pcm_amount;
    if(debit > amount)
    {
      client.query('update dealer_master set dm_debit=dm_debit-$1 where dm_id=$2',[amount,expenseSingleData.old_pcm_dm_id.dm_id]);
    }
    else
    {
      const credit = amount - debit;
      client.query('update dealer_master set dm_credit=dm_credit+$1, dm_debit=dm_debit-$2 where dm_id=$3',[credit,debit,expenseSingleData.old_pcm_dm_id.dm_id]);
    }

    const query = client.query('SELECT * FROM dealer_master where dm_id = $1',[expenseSingleData.pcm_dm.dm_id]);
    query.on('row', (row) => {
      const credit = row.dm_credit;
      const amount = expenseSingleData.pcm_amount;
      if(credit > amount)
      {
        client.query('update dealer_master set dm_credit=dm_credit-$1 where dm_id=$2',[amount,expenseSingleData.pcm_dm.dm_id]);
      }
      else
      {
        const debit = amount - credit;
        client.query('update dealer_master set dm_credit=dm_credit-$1, dm_debit=dm_debit+$2 where dm_id=$3',[credit,debit,expenseSingleData.pcm_dm.dm_id]);
      }
    });
    query.on('end', () => {
      done();
    });
    client.query('update purcashbook_master set pcm_dm_id=$1, pcm_date=$2, pcm_received_by=$3, pcm_comment=$4, pcm_payment_mode=$5, pcm_amount=$6, pcm_cheque_no=$7, pcm_cheque_date=$8, pcm_updated_at=now() where pcm_id = $9',[expenseSingleData.pcm_dm.dm_id,expenseSingleData.pcm_date,expenseSingleData.pcm_received_by,expenseSingleData.pcm_comment,expenseSingleData.pcm_payment_mode,expenseSingleData.pcm_amount,expenseSingleData.pcm_cheque_no,expenseSingleData.pcm_cheque_date,id]);
    

    client.query('COMMIT;');
    const query1 = client.query('SELECT * FROM purcashbook_master');
    query1.on('row', (row) => {
      results.push(row);
    });
    query1.on('end', () => {
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
  const expenseSingleData = req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    
    client.query('BEGIN;');
    const debit = expenseSingleData.dm_debit;
    const amount = expenseSingleData.pcm_amount;
    if(debit > amount)
    {
      client.query('update dealer_master set dm_debit=dm_debit-$1 where dm_id=$2',[amount,expenseSingleData.dm_id]);
    }
    else
    {
      const credit = amount - debit;
      client.query('update dealer_master set dm_credit=dm_credit+$1, dm_debit=dm_debit-$2 where dm_id=$3',[credit,debit,expenseSingleData.dm_id]);
    }

    client.query('update purcashbook_master set pcm_status=1 where pcm_id = $1',[id]);
    
    client.query('COMMIT;');
    const query = client.query('SELECT * FROM purcashbook_master');
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

router.post('/purcashbook/total', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";

    console.log(str);
    const strqry =  "SELECT count(pcm_id) as total "+
                    "from purcashbook_master pcm "+
                    "LEFT OUTER JOIN dealer_master dm on pcm.pcm_dm_id = dm.dm_id "+
                    "LEFT OUTER JOIN restaurant_master srm on pcm.pcm_srm_id=srm.srm_id "+
                    "where pcm_status = 0 "+
                    "and pcm_srm_id=$1 "+
                    "and LOWER(dm_firm_name||''||pcm_payment_mode||''||pcm_date) LIKE LOWER($2) ";
                    
    const query = client.query(strqry,[req.body.pcm_srm_id,str]);
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

router.post('/purcashbook/limit', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";
    // SQL Query > Select Data

    const strqry =  "SELECT * "+
                    "FROM purcashbook_master pcm "+
                    "LEFT OUTER JOIN dealer_master dm on pcm.pcm_dm_id = dm.dm_id "+
                    "LEFT OUTER JOIN restaurant_master srm on pcm.pcm_srm_id=srm.srm_id "+
                    "where pcm.pcm_status = 0 "+
                    "and pcm_srm_id=$1 "+
                    "and LOWER(dm_firm_name||''||pcm_payment_mode||''||pcm_date) LIKE LOWER($2) "+
                    "order by pcm.pcm_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[ req.body.pcm_srm_id, str, req.body.number, req.body.begin]);
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
