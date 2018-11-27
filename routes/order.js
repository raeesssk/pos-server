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
      var singleInsert = 'INSERT INTO order_master(om_no,om_tm_id,om_where,om_srm_id,om_amount,om_net_amount,om_cgst_amount,om_sgst_amount,om_igst_amount,om_cgst_per,om_sgst_per,om_igst_per,om_status) values($1,$2,$3,$4,0,0,0,0,0,0,0,0,0) RETURNING *',
        params = [no,req.body.tm_id,req.body.om_where,req.body.srm_id]
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
    const query = client.query("SELECT * FROM order_master where om_status_type like 'open' and om_tm_id =$1",[req.body.tm_id]);
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
       
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});
router.post('/placeorder', oauth.authorise(), (req, res, next) => {
  const results = [];
  const arr = [];
  const orderMultipleData=req.body.list;
  const order = req.body.obj;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('BEGIN;');
      orderMultipleData.forEach(function(product, index) {
      client.query('INSERT INTO order_product_master(opm_om_id, opm_pm_id, opm_quantity, opm_rate, opm_total, opm_half) values($1,$2,$3,$4,$5,$6) RETURNING *',
      [order.om_id,product.pm_id,product.quantity,product.price,product.total,product.opm_half]);
       
      // const query = client.query('select * from recipe_master rm inner join product_master pm on rm.rm_pm_id=pm.pm_id where rm_status=0 and rm_pm_id=$1',[product.pm_id]);
      // query.on('row', (row) => {
      //   arr.push(row);
      //  });

      // query.on('end', () => {
      //   done();
      //   arr.forEach(function(value,key){
      //     if(value.pm_half > 0)
      //     {
      //       client.query('update inventory_master set im_quantity = im_quantity - $1 where im_id=$2',[value.rm_quantity_half,value.rm_im_id]);
      //     }
      //     else
      //     {
      //       client.query('update inventory_master set im_quantity = im_quantity - $1 where im_id=$2',[value.rm_quantity,value.rm_im_id]);
      //     }
      //   });
      //   // pg.end();
      // });
    });
      var singleInsert = 'UPDATE order_master SET om_amount=om_amount + $1 WHERE om_id=$2 RETURNING *',
      params=[order.om_total,order.om_id]
      client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
      
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
    done(err);
  });
});


router.post('/ongoing/orders', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id INNER JOIN table_master tm on om.om_tm_id=tm.tm_id INNER JOIN area_master am on tm.tm_am_id=am.am_id INNER JOIN restaurant_master srm on om.om_srm_id=srm.srm_id where om_status_type like 'open' and om_id=$1",[req.body.om_id]);
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

router.get('/ongoin/orders/:omId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id=req.params.omId
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id INNER JOIN table_master tm on om.om_tm_id=tm.tm_id INNER JOIN area_master am on tm.tm_am_id=am.am_id where om_tm_id=$1",[id]);
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

router.post('/product/update', oauth.authorise(), (req, res, next) => {
  const results = [];
  var total=req.body.total;
  var list=req.body.list;
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
    if(list.opm_quantity != list.opm_quantity_old){
    var singleInsert = "UPDATE order_product_master SET opm_quantity=$1,opm_total=$2,opm_status_type='update' WHERE opm_id=$3 RETURNING *",
    params = [list.opm_quantity,list.opm_quantity*list.opm_rate,list.opm_id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        client.query("UPDATE order_master SET om_amount=$1 WHERE om_id=$2",[total,list.om_id]);
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  }
  else{
    return res.end("Successfully."); 
  }
  done(err);
  });
});

router.post('/product/cancel', oauth.authorise(), (req, res, next) => {
  const results = [];
  var total=req.body.total;
  var list=req.body.list;
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
    
    var singleInsert = "UPDATE order_product_master SET opm_quantity=0,opm_total=0,opm_status_type='cancel' WHERE opm_id=$1 RETURNING *",
    params = [list.opm_id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        client.query("UPDATE order_master SET om_amount=$1 WHERE om_id=$2",[total,list.om_id]);
        client.query('COMMIT;');
        done();
        return res.json(results);

    });
  
  done(err);
  });
});

router.post('/order/total', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";

    const strqry =  "SELECT count(om.om_id) as total "+
                    "FROM order_master om "+
                    "LEFT OUTER JOIN customer_master cm on om.om_cm_id = cm.cm_id "+
                    "LEFT OUTER JOIN table_master tm on om.om_tm_id = tm.tm_id "+
                    "LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id "+ 
                    "LEFT OUTER JOIN restaurant_master srm on om.om_srm_id=srm.srm_id "+
                    "where om.om_status=0 "+
                    "and om_srm_id=$1 "+
                    "and LOWER(om_no||''||om_amount||''||om_status_type) LIKE LOWER($2)";
      
    const query = client.query(strqry,[req.body.om_srm_id,str]);
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

router.post('/order/limit', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";

    const strqry =  "SELECT * "+
                    "FROM order_master om "+
                    "LEFT OUTER JOIN customer_master cm on om.om_cm_id = cm.cm_id "+
                    "LEFT OUTER JOIN table_master tm on om.om_tm_id = tm.tm_id "+
                    "LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id "+ 
                    "LEFT OUTER JOIN restaurant_master srm on om.om_srm_id=srm.srm_id "+
                    "where om.om_status=0 "+
                    "and om_srm_id=$1 "+
                    "and LOWER(om_no||''||om_amount||''||om_status_type) LIKE LOWER($2) "+
                    "order by om.om_id desc LIMIT $3 OFFSET $4";

    // SQL Query > Select Data
    const query = client.query(strqry,[ req.body.om_srm_id, str, req.body.number, req.body.begin]);
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

router.post('/order/status', oauth.authorise(), (req, res, next) => {
  const results = [];
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
    var singleInsert = "UPDATE order_master SET om_status_type='closed' WHERE om_id=($1) RETURNING *",
        params = [req.body.om_id];
       
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        client.query("SELECT * from order_master om INNER JOIN customer_master cm on om.om_cm_id=cm.cm_id WHERE om_status_type='closed'");
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});

router.post('/complete', oauth.authorise(), (req, res, next) => {
  const results = [];
  var list=req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM order_product_master opm INNER JOIN order_master om on opm.opm_om_id = om.om_id INNER JOIN product_master pm on opm.opm_pm_id=pm.pm_id where om_id=$1",[list.om_id]);
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

router.post('/order/cancel', oauth.authorise(), (req, res, next) => {
  const results = [];
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
    const query = client.query("Select * from order_product_master where opm_status_type = 'completed' and opm_om_id = $1", [req.body.om_id]);
    query.on('row', (row) => {
      results.push(row);

    });
    query.on('end', () => { 
      done();

      if(results.length == 0){
        var singleInsert = "UPDATE order_master SET om_status_type='cancel' WHERE om_id=$1 RETURNING *",
        params = [req.body.om_id];
        client.query(singleInsert, params, function (error, result) {
            results.push(result.rows[0]);
            client.query('COMMIT;');
            done();
            return res.json(results);

        });
      }
      else
      {
        return res.send("completed");
      }
      // pg.end();
      
    });
    
  
  done(err);
  });
});


module.exports = router;
