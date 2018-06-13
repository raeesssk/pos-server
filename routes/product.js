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
    const query = client.query("SELECT *,ctm.ctm_type||' '||pm.pm_description ||' ('||pm.pm_quantity||')' as pm_search FROM product_master pm LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id where pm_status = 0 order by pm_id desc");
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

router.get('/starter', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT pm_description from product_master where pm_ctm_id=17 order by pm_id ASC");
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

router.get('/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.productId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM product_master pm LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id where pm.pm_status=0 and pm.pm_id=$1',[id]);
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

  const image = req.body.image;
  const product = req.body.product;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO product_master(pm_description, pm_ctm_id, pm_rate, pm_quantity, pm_username, pm_image, pm_status) values($1,$2,$3,$4,$5,$6,0)',[product.pm_description,product.pm_ctm_id.ctm_id,product.pm_rate,product.pm_quantity,product.pm_username,image]);
    
	// SQL Query > Select Data
    const query = client.query('SELECT * FROM product_master');
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
  const image = req.body.image;
  const product = req.body.product;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO product_master(pm_description, pm_ctm_id, pm_rate, pm_quantity, pm_image, pm_status) values($1,$2,$3,$4,$5,0) RETURNING *',
        params = [product.pm_description,product.pm_ctm_id.ctm_id,product.pm_rate,product.pm_quantity,image]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.productId;
  const product = req.body.product;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update product_master set pm_description=$1, pm_ctm_id=$2, pm_rate=$3, pm_quantity=$4, pm_image=$5, pm_updated_at=now() where pm_id=$6 RETURNING *',
        params = [product.pm_description,product.pm_ctm.ctm_id,product.pm_rate,product.pm_quantity,req.body.image,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});



router.post('/delete/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.productId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update product_master set pm_status=1, pm_updated_at=now() where pm_id=$1 RETURNING *',
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

router.post('/product/total', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const str = "%"+req.body.search+"%";

    const strqry =  "SELECT count(pm.pm_id) as total "+
                    "FROM product_master pm "+
                    "LEFT OUTER JOIN category_master cm on pm.pm_ctm_id = cm.ctm_id "+
                    "where pm.pm_status=0 "+
                    "and LOWER(pm_description||''||pm_ctm_id) LIKE LOWER($1);";

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

router.post('/product/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM product_master pm "+
                    "LEFT OUTER JOIN category_master cm on pm.pm_ctm_id = cm.ctm_id "+
                    "where pm.pm_status=0 "+
                    "and LOWER(pm_description||''||pm_ctm_id) LIKE LOWER($1) "+
                    "order by pm.pm_id desc LIMIT $2 OFFSET $3";

    // SQL Query > Select Data
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
