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
    const query = client.query("SELECT * FROM recipe_master rm LEFT OUTER JOIN product_master pm on rm.rm_pm_id = pm.pm_id LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id LEFT OUTER JOIN inventory_master im on rm.rm_im_id = im.im_id LEFT OUTER JOIN unit_master um on im.im_um_id = um.um_id  where rm.rm_status = 0 order by rm.rm_id desc");
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
    const query = client.query('SELECT * FROM recipe_master rm LEFT OUTER JOIN product_master pm on rm.rm_pm_id = pm.pm_id LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id LEFT OUTER JOIN inventory_master im on rm.rm_im_id = im.im_id LEFT OUTER JOIN unit_master um on im.im_um_id = um.um_id LEFT OUTER JOIN restaurant_master srm on rm.rm_srm_id=srm.srm_id where rm.rm_id=$1',[id]);
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
    client.query('INSERT INTO recipe_master(rm_pm_id, rm_im_id, rm_quantity, rm_username, rm_status) values($1,$2,$3,$4,0)',[req.body.rm_pm_id.pm_id,req.body.rm_im_id.im_id,req.body.rm_quantity,req.body.rm_username]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM recipe_master');
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
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'INSERT INTO recipe_master(rm_pm_id, rm_im_id, rm_quantity, rm_srm_id, rm_status) values($1,$2,$3,$4,0) RETURNING *',
        params = [req.body.rm_pm_id.pm_id,req.body.rm_im_id.im_id,req.body.rm_quantity,req.body.rm_srm_id]
      
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

/*router.post('/edit/:ctmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.ctmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('UPDATE recipe_master SET rm_pm_id=$1, rm_im_id=$2, rm_quantity=$3, rm_updated_at=now() where rm_id=$4',[req.body.rm_pm.pm_id,req.body.rm_im.im_id,req.body.rm_quantity,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM recipe_master');
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
*/

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

    var singleInsert = 'UPDATE recipe_master SET rm_pm_id=$1,rm_im_id=$2,rm_quantity=$3,rm_updated_at=now() where rm_id=$4 RETURNING *',
        params = [req.body.rm_pm.pm_id,req.body.rm_im.im_id,req.body.rm_quantity,id]
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

    var singleInsert = 'update recipe_master set rm_status=1, rm_updated_at=now() where rm_id=$1 RETURNING *',
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

router.post('/recipe/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(rm_id) as total "+
                    "from recipe_master rm "+
                    "LEFT OUTER JOIN product_master pm on rm.rm_pm_id = pm.pm_id "+
                    "LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id "+
                    "LEFT OUTER JOIN inventory_master im on rm.rm_im_id = im.im_id "+
                    "LEFT OUTER JOIN unit_master um on im.im_um_id = um.um_id "+
                    "LEFT OUTER JOIN restaurant_master srm on rm.rm_srm_id=srm.srm_id "+
                    "where rm_status=0 "+
                    "and rm_srm_id=$1 "+
                    "and LOWER(rm_pm_id||''||rm_im_id||''||rm_quantity) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.rm_srm_id,str]);
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

router.post('/recipe/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM recipe_master rm "+
                    "LEFT OUTER JOIN product_master pm on rm.rm_pm_id = pm.pm_id "+
                    "LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id = ctm.ctm_id "+
                    "LEFT OUTER JOIN inventory_master im on rm.rm_im_id = im.im_id "+
                    "LEFT OUTER JOIN unit_master um on im.im_um_id = um.um_id "+
                    "LEFT OUTER JOIN restaurant_master srm on rm.rm_srm_id=srm.srm_id "+
                    "where rm.rm_status = 0 "+
                    "and rm_srm_id=$1 "+
                    "and LOWER(rm_pm_id||''||rm_im_id||''||rm_quantity) LIKE LOWER($2) "+
                    "order by rm.rm_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.rm_srm_id, str, req.body.number, req.body.begin]);
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
