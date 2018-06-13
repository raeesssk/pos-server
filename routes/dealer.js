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
    const query = client.query("SELECT *,dm_firm_name||' - '||dm_number ||' - ( '||dm_address||' )' as dm_search FROM dealer_master where dm_status = 0 order by dm_id desc");
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

router.get('/:vendorId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vendorId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM dealer_master where dm_id=$1',[id]);
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
/*
router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO dealer_master(dm_firm_name, dm_number, dm_address, dm_credit, dm_opening_credit, dm_debit, dm_opening_debit, dm_username, dm_status) values($1,$2,$3,$4,$5,$6,$7,$8,0)',[req.body.dm_firm_name,req.body.dm_number,req.body.dm_address,req.body.dm_credit,req.body.dm_opening_credit,req.body.dm_debit,req.body.dm_opening_debit,req.body.dm_username]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM dealer_master');
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

    var singleInsert = 'INSERT INTO dealer_master(dm_firm_name,dm_number,dm_address,dm_credit, dm_opening_credit, dm_debit, dm_opening_debit, dm_username, dm_status) values($1,$2,$3,$4,$5,$6,$7,$8,0) RETURNING *',
        params = [req.body.dm_firm_name,req.body.dm_number,req.body.dm_address,req.body.dm_credit,req.body.dm_opening_credit,req.body.dm_debit,req.body.dm_opening_debit,req.body.dm_username]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

/*router.post('/edit/:vendorId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vendorId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    // SQL Query > Insert Data
    client.query('UPDATE dealer_master SET dm_credit=dm_credit-$1, dm_debit=dm_debit-$2 where dm_id=$3',[req.body.old_opening_credit,req.body.old_opening_debit,id]);
    client.query('UPDATE dealer_master SET dm_firm_name=$1, dm_number=$2, dm_address=$3, dm_credit=dm_credit+$4, dm_opening_credit=$5, dm_debit=dm_debit+$6, dm_opening_debit=$7, dm_updated_at=now() where dm_id=$8',[req.body.dm_firm_name,req.body.dm_number,req.body.dm_address,req.body.dm_opening_credit,req.body.dm_opening_credit,req.body.dm_opening_debit,req.body.dm_opening_debit,id]);
    // SQL Query > Select Data
    client.query('COMMIT;');
    const query = client.query('SELECT * FROM dealer_master');
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

router.post('/edit/:vendorId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vendorId;
    const credit = req.body.dm_opening_credit - req.body.old_opening_credit;
    const debit = req.body.dm_opening_debit - req.body.old_opening_debit;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('BEGIN;');

    var singleInsert = 'UPDATE dealer_master SET dm_firm_name=$1, dm_number=$2, dm_address=$3, dm_credit=dm_credit+$4, dm_opening_credit=$5, dm_debit=dm_debit+$6, dm_opening_debit=$7, dm_updated_at=now() where dm_id=$8 RETURNING *',
        params = [req.body.dm_firm_name,req.body.dm_number,req.body.dm_address,credit,req.body.dm_opening_credit,debit,req.body.dm_opening_debit,id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});



router.post('/delete/:vendorId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vendorId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update dealer_master set dm_status=1, dm_updated_at=now() where dm_id=$1 RETURNING *',
        params = [id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});

router.get('/details/:vmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const querystr =  "(select prm.prm_invoice_no as invoice,prm.prm_date as date,0 as debit,prm.prm_amount as credit, 'Purchase' as type, '1' as num from purchase_master prm LEFT OUTER JOIN dealer_master dm on prm.prm_dm_id=dm.dm_id where prm.prm_status = 0 and dm.dm_id = $1) UNION "+
                      "(select pcm.pcm_id as invoice,pcm.pcm_date as date,pcm.pcm_amount as debit,0 as credit,'Purchase Cashbook' as type, '2' as num from purcashbook_master pcm LEFT OUTER JOIN dealer_master dm on pcm.pcm_dm_id=dm.dm_id where pcm.pcm_status=0 and dm.dm_id = $2) order by date,num asc";
    const query = client.query(querystr,[id,id]);
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

router.post('/dealer/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(dm_id) as total "+
                    "from dealer_master dm "+
                    "where dm_status=0 "+
                    "and LOWER(dm_firm_name||''||dm_number||''||dm_address||''||dm_debit||''||dm_credit) LIKE LOWER($1);";

    const query = client.query(strqry,[str]);
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

router.post('/dealer/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM dealer_master dm "+
                    "where dm.dm_status = 0 "+
                    "and LOWER(dm_firm_name||''||dm_number||''||dm_address||''||dm_debit||''||dm_credit) LIKE LOWER($1) "+
                    "order by dm.dm_id desc LIMIT $2 OFFSET $3";

    const query = client.query(strqry,[ str, req.body.number, req.body.begin]);
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
