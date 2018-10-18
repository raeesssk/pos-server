var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var multer = require('multer'); 

var filenamestore = "";

var pool = new pg.Pool(config);

router.get('/:uId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.uId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM corporate_master where scm_status = 0 and scm_user_id=$1",[id]);
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
    const query = client.query('SELECT * FROM corporate_master where scm_id=$1',[id]);
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
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO area_master(am_name, am_username, am_status) values($1,$2,0)',[req.body.am_name,req.body.am_username]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM area_master');
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

  var upload = multer({ storage: Storage }).array("scm_image"); 

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

      var singleInsert = 'INSERT INTO corporate_master(scm_corp_name,scm_country,scm_address,scm_landmark,scm_area,scm_city,scm_pincode,scm_state,scm_currency,scm_contact_name,scm_contact_no,scm_email,scm_image,scm_user_id) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *',
          params = [req.body.scm_corp_name,req.body.scm_country,req.body.scm_address,req.body.scm_landmark,req.body.scm_area,req.body.scm_city,req.body.scm_pincode,req.body.scm_state,req.body.scm_currency,req.body.scm_contact_name,req.body.scm_contact_no,req.body.scm_email,filenamestore,req.body.scm_user_id]
      client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows
          done();
          return res.json(results);
      });

      done(err);
    });
  }); 
});


router.post('/edit/:scmId', oauth.authorise(), (req, res, next) => {
  const results = [];

  const id = req.params.scmId;
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

  var upload = multer({ storage: Storage }).array("scm_image"); 

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

      var singleInsert = 'update corporate_master set scm_corp_name=$1,scm_country=$2,scm_address=$3,scm_landmark=$4,scm_area=$5,scm_city=$6,scm_pincode=$7,scm_state=$8,scm_currency=$9,scm_contact_name=$10,scm_contact_no=$11,scm_email=$12,scm_image=$13, scm_updated_at=now() where scm_id=$14  RETURNING *',
          params = [req.body.scm_corp_name,req.body.scm_country,req.body.scm_address,req.body.scm_landmark,req.body.scm_area,req.body.scm_city,req.body.scm_pincode,req.body.scm_state,req.body.scm_currency,req.body.scm_contact_name,req.body.scm_contact_no,req.body.scm_email,filenamestore,id]
      client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows
          done();
          return res.json(results);
      });

      done(err);
    });
  }); 
});


router.post('/delete/:ctmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.ctmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update area_master set am_status=1, am_updated_at=now() where am_id=$1 RETURNING *',
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

router.post('/area/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(am_id) as total "+
                    "from area_master "+
                    "where am_status=0 "+
                    "and LOWER(am_name) LIKE LOWER($1);";

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

router.post('/area/limit', oauth.authorise(), (req, res, next) => {
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

    const strqry =  "SELECT am.am_name "+
                    "FROM area_master am "+
                    "where am.am_status = 0 "+
                    "and LOWER(am_name) LIKE LOWER($1) "+
                    "order by am.am_id desc LIMIT $2 OFFSET $3";

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
