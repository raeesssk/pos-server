var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
var multer = require('multer');
var filenamestore = "";


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
    const query = client.query("SELECT * FROM product_master pm LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id where pm.pm_status = 0 order by pm.pm_id desc");
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
    const query = client.query("SELECT * from product_master pm left outer join product_price_master ppm on ppm.ppm_pm_id = pm.pm_id where pm_ctm_id=$1 and ppm_am_id=$2 order by pm_id ASC",[req.body.ctm_id,req.body.am_id]);
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

router.get('/price/:productId', oauth.authorise(), (req, res, next) => {
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
    const query = client.query('SELECT * FROM product_price_master ppm INNER JOIN product_master pm on ppm.ppm_pm_id = pm.pm_id INNER JOIN area_master am on ppm.ppm_am_id=am.am_id where pm.pm_id=$1',[id]);
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

router.post('/checkname', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    // SQL Query > Select Data
    const strqry =  "SELECT * "+
                    "from product_master pm "+
                    "inner join restaurant_master srm on pm.pm_srm_id=srm.srm_id "+
                    "where pm_status=0 "+
                    "and pm_srm_id = $1 "+
                    "and LOWER(pm_description) like LOWER($2)";
    const query = client.query(strqry,[req.body.pm_srm_id,req.body.pm_description]);
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
  var productlist = req.body.list;
  var product = req.body.product;
  

    pool.connect(function(err, client, done){
      if(err) {
        done();
        // pg.end();
        console.log("the error is"+err);
        return res.status(500).json({success: false, data: err});
      }

      var singleInsert = 'INSERT INTO product_master(pm_description, pm_ctm_id, pm_dish_no, pm_expected_in, pm_srm_id,pm_half, pm_status) values($1,$2,$3,$4,$5,$6,0) RETURNING *',
          params = [product.pm_description,product.pm_ctm_id.ctm_id,product.pm_dish_no,product.pm_expected_in,product.pm_srm_id,product.pm_half]
     
          client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows

          productlist.forEach(function(product,key){
            client.query('INSERT INTO public.product_price_master(ppm_pm_id, ppm_am_id, ppm_fullday_price, ppm_fullnight_price, ppm_halfday_price, ppm_halfnight_price)VALUES ($1, $2, $3, $4, $5, $6)',
              [result.rows[0].pm_id,product.am_id,product.pm_fullday_price,product.pm_fullnight_price,product.pm_halfday_price,product.pm_halfnight_price]);
          
          });

          done();
          return res.json(results);
      });

    done(err);
    });
});


router.post('/image/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.productId;
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

  var upload = multer({ storage: Storage }).array("pm_image"); 

  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 

    pool.connect(function(err, client, done){
      if(err) {
        done();
        // pg.end();
        console.log("the error is"+err);
        return res.status(500).json({success: false, data: err});
      }

      var singleInsert = 'update  product_master set pm_image=$1 where pm_id=$2 RETURNING *',
          params = [filenamestore,id]
      client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows

        

          done();
          return res.json(results);
      });

    done(err);
    });
  }); 
});



router.post('/edit/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.productId;
  const product = req.body.product;
  const productlist = req.body.list;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update product_master set pm_description=$1, pm_ctm_id=$2, pm_dish_no=$3, pm_expected_in=$4, pm_half=$5, pm_updated_at=now() where pm_id=$6 RETURNING *',
        params = [product.pm_description,product.pm_ctm.ctm_id,product.pm_dish_no,product.pm_expected_in,product.pm_half,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        productlist.forEach(function(val,key){
          client.query('update public.product_price_master set ppm_fullday_price=$1, ppm_fullnight_price=$2, ppm_halfday_price=$3, ppm_halfnight_price=$4 where ppm_id = $5 RETURNING *',
              [val.ppm_fullday_price,val.ppm_fullnight_price,val.ppm_halfday_price,val.ppm_halfnight_price,val.ppm_id]);
          
        })
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
                    "LEFT OUTER JOIN restaurant_master srm on pm.pm_srm_id=srm.srm_id "+
                    "where pm.pm_status=0 "+
                    "and pm_srm_id = $1 "+
                    "and LOWER(pm_description||''||pm_dish_no) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.pm_srm_id,str]);
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
                    "LEFT OUTER JOIN restaurant_master srm on pm.pm_srm_id=srm.srm_id "+
                    "where pm.pm_status=0 "+
                    "and pm_srm_id = $1 "+
                    "and LOWER(pm_description||''||pm_dish_no) LIKE LOWER($2) "+
                    "order by pm.pm_id desc LIMIT $3 OFFSET $4";

    // SQL Query > Select Data
    const query = client.query(strqry,[req.body.pm_srm_id, str, req.body.number, req.body.begin]);
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

router.get('/recipe/:productId', oauth.authorise(), (req, res, next) => {
  const results = [];
  var id=req.params.productId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM recipe_master rm INNER JOIN product_master pm on rm.rm_pm_id = pm.pm_id INNER JOIN category_master ctm on pm.pm_ctm_id=ctm.ctm_id INNER JOIN inventory_master im on rm.rm_im_id = im.im_id INNER JOIN unit_master um on im.im_um_id = um.um_id where pm_id=$1",[id]);
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

router.post('/typeahead/search', oauth.authorise(), (req, res, next) => {
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
                    "from product_master pm "+
                    "inner join restaurant_master srm on pm.pm_srm_id=srm.srm_id "+
                    "where pm_status=0 "+
                    "and pm_srm_id = $1 "+
                    "and LOWER(pm_description) LIKE LOWER($2) "+
                    "order by pm.pm_id desc LIMIT 10";

    const query = client.query(strqry,[req.body.pm_srm_id, str]);
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
