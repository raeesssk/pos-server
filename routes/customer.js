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
    const query = client.query("SELECT *,cm_name||' - '||cm_mobile||' - '||cm_address AS cm_search FROM customer_master where cm_status = 0 order by cm_id desc");
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

router.get('/:custId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.custId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM customer_master where cm_id=$1',[id]);
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
    client.query('INSERT INTO customer_master( cm_name, cm_mobile, cm_address,cm_pin, cm_status) values($1,$2,$3,$4,0)',[req.body.cm_name,req.body.cm_mobile,req.body.cm_address,req.body.cm_pin]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM customer_master');
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

    var singleInsert = 'INSERT INTO customer_master(cm_name,cm_mobile,cm_address,cm_pin,cm_status) values($1,$2,$3,$4,0) RETURNING *',
        params = [req.body.cm_name,req.body.cm_mobile,req.body.cm_address,req.body.cm_pin]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});


router.post('/edit/:custId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.custId;
  const product = req.body.product;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update customer_master set cm_name=$1, cm_mobile=$2, cm_address=$3, cm_pin=$4, cm_updated_at=now() where cm_id=$5 RETURNING *',
        params = [req.body.cm_name,req.body.cm_mobile,req.body.cm_address,req.body.cm_pin,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});


router.post('/delete/:custId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.custId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update customer_master set cm_status=1, cm_updated_at=now() where cm_id=$1 RETURNING *',
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
/*router.get('/details/:vmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const querystr =  "(select sm.sm_invoice_no as invoice,sm.sm_date as date,sm.sm_amount as debit,0 as credit,'Invoice' as type, '1' as num from sale_master sm LEFT OUTER JOIN customer_master vm on sm.sm_cm_id=vm.cm_id where sm.sm_status=0 and vm.cm_id = $1) UNION "+
                      "(select ''||em.em_id as invoice,em.em_date as date,em.em_amount as debit,em.em_credit as credit,'Cashbook' as type, '2' as num from expense_master em LEFT OUTER JOIN customer_master vm on em.em_cm_id=vm.cm_id where vm.cm_id = $2) order by date,num asc";
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
});*/

/*router.get('/code/no', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from customer_master where cm_status=0 order by cm_id desc limit 1;");
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

router.post('/customer/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(cm_id) as total "+
                    "from customer_master "+
                    "where cm_status=0 "+
                    "and LOWER(cm_name||''||cm_mobile||''||cm_address||''||cm_pin) LIKE LOWER($1);";

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

router.post('/customer/limit', oauth.authorise(), (req, res, next) => {
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

    const strqry =  "SELECT cm.cm_id, cm.cm_name, cm.cm_mobile, cm.cm_address, cm.cm_pin "+
                    "FROM CUSTOMER_MASTER cm "+
                    "where cm.cm_status = 0 "+
                    "and LOWER(cm_name||''||cm_mobile||''||cm_address||''||cm_pin ) LIKE LOWER($1) "+
                    "order by cm.cm_id desc LIMIT $2 OFFSET $3";

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
