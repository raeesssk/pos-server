var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
var multer = require('multer');
var filenamestore = "";


router.post('/upload/file', oauth.authorise(), (req, res, next) => {


  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, '../pos/resources/assets/img/allimages');
            
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../resources/assets/img"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("imgUploader");
  
  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
      return res.end("File uploaded sucessfully!.");
    });

});


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

router.post('/items', oauth.authorise(), (req, res, next) => {
  const results = [];
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT pm.pm_id,pm.pm_description,pm.pm_image,pm.pm_rate,pm.pm_quantity from product_master pm where pm_ctm_id=$1 order by pm_id ASC",[req.body.ctm_id]);
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
  const product = req.body.product;
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, '../pos/resources/assets/img/allimages');
            
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../resources/assets/img"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("imgUploader"); 
  
  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
     
  });
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO product_master(pm_description, pm_ctm_id, pm_rate, pm_quantity, pm_image, pm_status) values($1,$2,$3,$4,$5,0) RETURNING *',
        params = [product.pm_description,product.pm_ctm_id.ctm_id,product.pm_rate,product.pm_quantity,filenamestore]
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
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, '../pos/resources/assets/img/allimages');
            
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../resources/assets/img"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("imgUploader"); 
  
  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
     
  });
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update product_master set pm_description=$1, pm_ctm_id=$2, pm_rate=$3, pm_quantity=$4, pm_image=$5, pm_updated_at=now() where pm_id=$6 RETURNING *',
        params = [product.pm_description,product.pm_ctm.ctm_id,product.pm_rate,product.pm_quantity,filenamestore,id];
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

router.post('/recipe', oauth.authorise(), (req, res, next) => {
  const results = [];
  var list=req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM recipe_master rm INNER JOIN product_master pm on rm.rm_pm_id = pm.pm_id INNER JOIN category_master ctm on pm.pm_ctm_id=ctm.ctm_id INNER JOIN inventory_master im on rm.rm_im_id = im.im_id INNER JOIN unit_master um on im.im_um_id = um.um_id where pm_id=$1",[list.pm_id]);
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
