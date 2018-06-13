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
    const query = client.query("SELECT * FROM quatation_master qm LEFT OUTER JOIN table_master cm on qm.qm_tm_id = cm.tm_id order by qm_id desc");
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

router.get('/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM quatation_master qm LEFT OUTER JOIN table_master cm on qm.qm_tm_id = cm.tm_id where qm_id=$1",[id]);
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

router.get('/sale/list', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM quatation_master qm LEFT OUTER JOIN table_master cm on qm.qm_tm_id = cm.tm_id where qm_status=0 order by qm_id asc");
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

router.get('/details/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM quatation_product_master qpm LEFT OUTER JOIN quatation_master qm on qpm.qpm_qm_id = qm.qm_id LEFT OUTER JOIN product_master pm on qpm.qpm_pm_id= pm.pm_id LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id= ctm.ctm_id where qpm.qpm_qm_id=$1',[id]);
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
  const purchaseSingleData = req.body.purchaseSingleData;
  const purchaseMultipleData = req.body.purchaseMultipleData;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
      client.query('BEGIN;');
      const singleInsert = client.query('INSERT INTO public.quatation_master( qm_ref_no, qm_date, qm_tm_id, qm_total, qm_status)VALUES ($1, $2, $3, $4, 0)',[purchaseSingleData.qm_ref_no,purchaseSingleData.qm_date,purchaseSingleData.qm_tm_id.tm_id,purchaseSingleData.amount]);

      const query = client.query("SELECT * from quatation_master order by qm_id desc limit 1;");
      query.on('row', (row) => {
        purchaseMultipleData.forEach(function(product, index) {
          client.query('INSERT INTO public.quatation_product_master(qpm_qm_id, qpm_pm_id, qpm_quantity, qpm_rate)VALUES ($1, $2, $3, $4)',[row.qm_id,product.pm_id.pm_id,product.pm_id.qpm_quantity,product.pm_id.qpm_rate]);
        });
      });
      query.on('end', () => {
        done();
      });  
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM quatation_master');
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

router.post('/edit/:smId', oauth.authorise(), (req, res, next) => {
  const id = req.params.smId;
  const results = [];
  const purchaseSingleData = req.body.purchaseSingleData;
  const purchaseMultipleData = req.body.purchaseMultipleData;
  const purchaseadd = req.body.purchaseadd;
  const purchaseremove = req.body.purchaseremove;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
      client.query('BEGIN;');

      const singleInsert = client.query('update public.quatation_master set qm_date=$1, qm_tm_id=$2, qm_total=$3 where qm_id=$4',[purchaseSingleData.qm_date,purchaseSingleData.qm_tm.tm_id,purchaseSingleData.amount,id]);
      
        purchaseremove.forEach(function(product, index) {
          client.query('delete from public.quatation_product_master where qpm_id=$1',[product.qpm_id]);
        });

        purchaseMultipleData.forEach(function(product, index) {
          client.query('update public.quatation_product_master set qpm_quantity = $1, qpm_rate = $2 where qpm_id = $3',[product.qpm_quantity,product.qpm_rate,product.qpm_id]);
        });

        purchaseadd.forEach(function(product, index) {
          client.query('INSERT INTO public.quatation_product_master(qpm_qm_id, qpm_pm_id, qpm_quantity, qpm_rate)VALUES ($1, $2, $3, $4)',[id,product.pm_id.pm_id,product.pm_id.qpm_quantity,product.pm_id.qpm_rate]);
        });
        
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM quatation_master');
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

router.post('/delete/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    client.query('UPDATE quatation_master SET qm_status=1 WHERE qm_id=($1)', [id]);

    client.query('COMMIT;');
    const query1 = client.query("SELECT * from quatation_master");
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

router.get('/serial/no', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from quatation_master order by qm_id desc limit 1;");
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
