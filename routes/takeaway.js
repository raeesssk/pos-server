var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);


router.post('/:srmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  
  const id = req.params.srmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from area_master am inner join restaurant_master srm on am.am_srm_id=srm.srm_id where am_status=0 and am_name = 'Takeaway' and am_srm_id=$1",[id]);
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



router.post('/delivery', oauth.authorise(), (req, res, next) => {
  const results = [];
  // Grab data from http request
  const orderMultipleData=req.body.list;
  const order=req.body.obj;
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
      var singleInsert = 'INSERT INTO order_master(om_no,om_where,om_amount,om_srm_id,om_net_amount,om_cgst_amount,om_sgst_amount,om_igst_amount,om_cgst_per,om_sgst_per,om_igst_per,om_status) values($1,$2,$3,$4,0,0,0,0,0,0,0,0) RETURNING *',
        params = [no,order.om_where,order.om_total,order.srm_id]
        client.query(singleInsert, params, function (error, result) {
        data.push(result.rows[0]); 
    	orderMultipleData.forEach(function(product, index) {
      	client.query('INSERT INTO order_product_master(opm_om_id, opm_pm_id, opm_quantity, opm_rate, opm_total,opm_half) values($1,$2,$3,$4,$5,$6) RETURNING *',
      	[result.rows[0].om_id,product.pm_id,product.quantity,product.price,product.total,product.opm_half]);
      });
        // Will contain your inserted rows
        done();
        return res.json(data);
      });
    });
    done(err);
  });
});

router.post('/items', oauth.authorise(), (req, res, next) => {
  const results = [];
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from product_master pm inner join product_price_master ppm on ppm.ppm_pm_id=pm.pm_id left outer join area_master am on ppm.ppm_am_id=am.am_id where pm_ctm_id=$1 and am_name = 'Takeaway' and am_status = 0 order by pm_id ASC",[req.body.ctm_id]);
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