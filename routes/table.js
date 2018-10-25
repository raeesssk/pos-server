var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

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
    const query = client.query('SELECT * FROM table_master tm LEFT OUTER JOIN area_master am on tm.tm_am_id = am.am_id where tm.tm_id=$1',[id]);
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
                    "from table_master tm "+
                    "LEFT OUTER JOIN area_master am on tm.tm_am_id = am.am_id "+
                    "inner join restaurant_master srm on tm.tm_srm_id=srm.srm_id "+
                    "where tm_status=0 "+
                    "and tm_srm_id = $1 "+
                    "and LOWER(tm_description) like LOWER($2)"+
                    "and LOWER(am_name) like LOWER($3)";
    const query = client.query(strqry,[req.body.tm_srm_id,req.body.tm_description,req.body.tm_am_name]);
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
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO table_master(tm_description, tm_size, tm_am_id, tm_srm_id, tm_isreserved) values($1,$2,$3,$4,0) RETURNING *',
        params = [req.body.tm_description,req.body.tm_size,req.body.tm_am_id.am_id,req.body.tm_srm_id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:ctmId', oauth.authorise(), (req, res, next) => {
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

    var singleInsert = 'UPDATE table_master SET tm_description=$1, tm_size=$2, tm_am_id=$3, tm_updated_at=now() where tm_id=$4 RETURNING *',
        params = [req.body.tm_description,req.body.tm_size,req.body.tm_am.am_id,id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
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

    var singleInsert = 'update table_master set tm_status=1, tm_updated_at=now() where tm_id=$1 RETURNING *',
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

router.post('/isreserved', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('BEGIN;');
    var singleInsert = 'update table_master set tm_isreserved=1 WHERE tm_id=($1) RETURNING *',
        params = [req.body.tm_id];
        client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});

router.post('/notreserved', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    var singleInsert = 'update table_master set tm_isreserved=0 WHERE tm_id=($1) RETURNING *',
        params = [req.body.tm_id];
        client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        
        client.query('COMMIT;');
        done();
        return res.json(results);
    });
  done(err);
  });
});

router.post('/table/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(tm_id) as total "+
                    "from table_master tm "+
                    "LEFT OUTER JOIN area_master am on tm.tm_am_id = am.am_id "+
                    "inner join restaurant_master srm on tm.tm_srm_id=srm.srm_id "+
                    "where tm_status=0 "+
                    "and tm_srm_id = $1 "+
                    "and LOWER(tm_description||''||tm_size||''||am_name) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.tm_srm_id, str]);
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

router.post('/table/limit', oauth.authorise(), (req, res, next) => {
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
                    "from table_master tm "+
                    "LEFT OUTER JOIN area_master am on tm.tm_am_id = am.am_id "+
                    "inner join restaurant_master srm on tm.tm_srm_id=srm.srm_id "+
                    "where tm_status=0 "+
                    "and tm_srm_id = $1 "+
                    "and LOWER(tm_description||''||tm_size||''||am_name) LIKE LOWER($2) "+
                    "order by tm.tm_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.tm_srm_id, str, req.body.number, req.body.begin]);
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
