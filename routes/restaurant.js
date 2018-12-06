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
    const query = client.query("SELECT * FROM users um left outer join restaurant_master srm on um.user_srm_id=srm.srm_id where srm_status = 0 and id=$1",[id]);
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

router.get('/:srmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.srmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM restaurant_master where srm_id=$1',[id]);
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
  console.log(req.body);
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, "../nginx/html/pos/images");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../images/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("srm_image"); 

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
        var singleInsert = 'INSERT INTO restaurant_master(srm_restaurant_name,srm_country,srm_address,srm_landmark,srm_area,srm_city,srm_pincode,srm_state,srm_currency,srm_contact_name,srm_contact_number,srm_email,srm_image,srm_day_start_time,srm_day_end_time,srm_night_start_time,srm_night_end_time,srm_isnight,srm_checkgst,srm_gst_no,srm_gst_per) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *',
            params = [req.body.srm_restaurant_name,req.body.srm_country,req.body.srm_address,req.body.srm_landmark,req.body.srm_area,req.body.srm_city,req.body.srm_pincode,req.body.srm_state,req.body.srm_currency,req.body.srm_contact_name,req.body.srm_contact_number,req.body.srm_email,filenamestore,req.body.srm_day_start_time,req.body.srm_day_end_time,req.body.srm_night_start_time,req.body.srm_night_end_time,req.body.srm_isnight,req.body.srm_check,req.body.srm_gst_no,req.body.srm_gst_per]
        console.log(params);
        client.query(singleInsert, params, function (error, result) {
            results.push(result.rows[0]); // Will contain your inserted rows
            client.query("update users set user_srm_id = $1,first_name=$2 where id = $3",[result.rows[0].srm_id,result.rows[0].srm_contact_name,req.body.srm_user_id])
            client.query('COMMIT;');
            done();
            return res.json(results);
        });
      done(err);
    });
  }); 
});


router.post('/edit/:srmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.srmId;
  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "./images");
            callback(null, "../nginx/html/pos/images");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "../images/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("srm_image"); 

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

      var singleInsert = 'update restaurant_master set srm_restaurant_name=$1,srm_country=$2,srm_address=$3,srm_landmark=$4,srm_area=$5,srm_city=$6,srm_pincode=$7,srm_state=$8,srm_currency=$9,srm_contact_name=$10,srm_contact_number=$11,srm_email=$12,srm_image=$13,srm_day_start_time=$14,srm_day_end_time=$15,srm_night_start_time=$16,srm_night_end_time=$17,srm_isnight=$18, srm_updated_at=now() where srm_id=$19  RETURNING *',
          params = [req.body.srm_restaurant_name,req.body.srm_country,req.body.srm_address,req.body.srm_landmark,req.body.srm_area,req.body.srm_city,req.body.srm_pincode,req.body.srm_state,req.body.srm_currency,req.body.srm_contact_name,req.body.srm_contact_number,req.body.srm_email,filenamestore,req.body.srm_day_start_time,req.body.srm_day_end_time,req.body.srm_night_start_time,req.body.srm_night_end_time,req.body.srm_isnight,id]
      client.query(singleInsert, params, function (error, result) {
          results.push(result.rows[0]); // Will contain your inserted rows
          done();
          return res.json(results);
      });

      done(err);
    });
  }); 
});


router.post('/delete/:srmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.srmId;
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
