var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.post('/pending',  (req, res, next) => {
  const results = [];

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id LEFT OUTER JOIN table_master tm on om.om_tm_id=tm.tm_id LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id left outer join restaurant_master srm on pm.pm_srm_id=srm.srm_id order by opm.opm_id desc");
    
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
  const arr = [];
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
        results.push(result.rows[0]); 
        const query = client.query("select * from recipe_master rm inner join product_master pm on rm.rm_pm_id=pm.pm_id where rm_status=0 and rm_pm_id=$1",[req.body.pm_id]);
        query.on('row', (row) => {
          arr.push(row);
        });
        query.on('end', () => { 
          arr.forEach(function(value,key){
            console.log(value);
          if(value.pm_half > 0)
          {
            client.query('update inventory_master set im_quantity = im_quantity - $1 where im_id=$2',[value.rm_quantity_half,value.rm_im_id]);
          }
          else
          {
            client.query('update inventory_master set im_quantity = im_quantity - $1 where im_id=$2',[value.rm_quantity,value.rm_im_id]);
          }
        });
        client.query('COMMIT;');
        done();
        return res.json(results);
        });
    });
  done(err);
  });
});


router.post('/progress', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = "UPDATE order_product_master SET opm_status_type='In progress' WHERE opm_id=$1 RETURNING *",
        params = [req.body.opm_id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
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
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id LEFT OUTER JOIN table_master tm on om.om_tm_id=tm.tm_id LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id left outer join restaurant_master srm on pm.pm_srm_id=srm.srm_id where opm.opm_status_type='completed' order by opm.opm_id desc");
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