var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var multer = require('multer'); 

var filenamestore = "";

var pool = new pg.Pool(config);

router.get('/:ctmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.ctmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM category_master where ctm_id=$1',[id]);
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
                    "from category_master ctm "+
                    "inner join restaurant_master srm on ctm.ctm_srm_id=srm.srm_id "+
                    "where ctm_status=0 "+
                    "and ctm_srm_id = $1 "+
                    "and LOWER(ctm_type) LIKE LOWER($2) ";
    const query = client.query(strqry,[req.body.ctm_srm_id,req.body.ctm_type]);
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

  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, "../nginx/html/images");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../images/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("ctm_image"); 

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

      var singleInsert = 'INSERT INTO category_master(ctm_type,ctm_image,ctm_srm_id) values($1,$2,$3) RETURNING *',
          params = [req.body.ctm_type,filenamestore,req.body.ctm_srm_id]
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
  /*const product = req.body.category;*/

  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, "../nginx/html/images");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../images/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("ctm_image"); 

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
      client.query('BEGIN;');
      
      var singleInsert = 'update category_master set ctm_type=$1, ctm_image=$2, ctm_updated_at=now() where ctm_id=$3 RETURNING *',
          params = [req.body.ctm_type,filenamestore,id];
      client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows
          
          client.query('COMMIT;');
          done();
          return res.json(results);
      });

      done(err);
    });
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

    var singleInsert = 'update category_master set ctm_status=1, ctm_updated_at=now() where ctm_id=$1 RETURNING *',
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

router.post('/category/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(ctm_id) as total "+
                    "from category_master ctm"+
                    "inner join restaurant_master srm on ctm.ctm_srm_id=srm.srm_id "+
                    "where ctm_status=0 "+
                    "and ctm_srm_id = $1 "+
                    "and LOWER(ctm_type) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.ctm_srm_id,str]);
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

router.post('/category/limit', oauth.authorise(), (req, res, next) => {
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
                    "from category_master ctm"+
                    "inner join restaurant_master srm on ctm.ctm_srm_id=srm.srm_id "+
                    "where ctm_status=0 "+
                    "and ctm_srm_id = $1 "+
                    "and LOWER(ctm_type) LIKE LOWER($2) "+
                    "order by ctm.ctm_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.ctm_srm_id, str, req.body.number, req.body.begin]);
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
                    "from category_master ctm"+
                    "inner join restaurant_master srm on ctm.ctm_srm_id=srm.srm_id "+
                    "where ctm_status=0 "+
                    "and ctm_srm_id = $1 "+
                    "and LOWER(ctm_type) LIKE LOWER($2) "+
                    "order by ctm.ctm_id desc LIMIT 10";

    const query = client.query(strqry,[req.body.ctm_srm_id, str]);
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
