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
    const query = client.query("SELECT * FROM delivery_master dm LEFT OUTER JOIN sale_master sm on dm.dm_sm_id = sm.sm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id order by dm_id desc");
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
    const query = client.query("SELECT * FROM delivery_master dm LEFT OUTER JOIN sale_master sm on dm.dm_sm_id = sm.sm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id where dm_id=$1",[id]);
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
    const query = client.query('SELECT * FROM delivery_product_master dpm LEFT OUTER JOIN delivery_master dm on dpm.dpm_dm_id = dm.dm_id LEFT OUTER JOIN product_master pm on dpm.dpm_pm_id= pm.pm_id LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id= ctm.ctm_id where dpm.dpm_dm_id=$1',[id]);
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
      const singleInsert = client.query('INSERT INTO public.delivery_master( dm_serial_no, dm_date, dm_sm_id, dm_status)VALUES ($1, $2, $3, 0)',[purchaseSingleData.dm_serial_no,purchaseSingleData.dm_date,purchaseSingleData.dm_sm_id.sm_id]);

      const query = client.query("SELECT * from delivery_master order by dm_id desc limit 1;");
      query.on('row', (row) => {
        purchaseMultipleData.forEach(function(product, index) {
          client.query('INSERT INTO public.delivery_product_master(dpm_dm_id, dpm_pm_id, dpm_quantity)VALUES ($1, $2, $3)',[row.dm_id,product.pm_id,product.spm_quantity]);
        });
      });
      query.on('end', () => {
        done();
      });  
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM delivery_master');
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
      const singleInsert = client.query('update public.delivery_master set dm_date=$1 where dm_id=$2',[purchaseSingleData.dm_date,id]);
      
        purchaseremove.forEach(function(product, index) {
          client.query('delete from public.delivery_product_master where dpm_id=$1',[product.dpm_id]);
        });

        purchaseadd.forEach(function(product, index) {
          client.query('INSERT INTO public.delivery_product_master(dpm_dm_id, dpm_pm_id, dpm_quantity)VALUES ($1, $2, $3)',[id,product.pm_id,product.spm_quantity]);
        });
        
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM delivery_master');
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
    client.query('UPDATE delivery_master SET dm_status=1 WHERE dm_id=($1)', [id]);

    client.query('COMMIT;');
    const query1 = client.query("SELECT * from delivery_master");
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
    const query = client.query("SELECT * from delivery_master order by dm_id desc limit 1;");
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
