var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');
var encryption = require('../commons/encryption.js');
// const bcrypt = require('bcryptjs');
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
    const query = client.query("SELECT um_emp_id,um_rm_id,um_users_id,um_created_at,um_updated_at,um_status FROM user_master order by um_id desc");
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

router.get('/:usermId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.usermId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users us left outer join role_master rm on us.role_id=rm.rm_id where id=$1',[id]);
    query.on('row', (row) => {
      row.pass = encryption.decrypt(row.password);
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



router.post('/check/user', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT username FROM users where username=$1",[req.body.um_user_name]);
    query.on('row', (row) => {
      results.push(row);
      console.log(results);
    });
    query.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
  done(err);
  });
});

router.post('/check/emp', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT user_emp_id FROM users where user_emp_id=$1",[req.body.um_emp_id.emp_id]);
    query.on('row', (row) => {
      results.push(row);
      console.log(results);
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

      client.query('BEGIN;');

      var singleInsert = "INSERT INTO users(username,password,first_name,icon_image,user_emp_id,user_rm_id,user_srm_id,status) values($1,$2,$3,$4,$5,$6,$7,0) RETURNING *",
      params = [req.body.um_user_name,encryption.encrypt(req.body.um_user_password),req.body.um_emp_id.emp_name,req.body.um_emp_id.emp_image,req.body.um_emp_id.emp_id,req.body.um_rm_id.rm_id,req.body.user_srm_id]
      client.query(singleInsert, params, function (error, result) {
      results.push(result.rows[0]); // Will contain your inserted rows
      client.query('COMMIT;');
            done();
            return res.json(results);
        });

    done(err);
  });
});


router.post('/edit/:Id', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.Id;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update users set password=$1,role_id=$2,updated_at=now() where id=$3 RETURNING *',
        params = [encryption.encrypt(req.body.pass),req.body.um_rm.rm_id,id];
        client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/delete/:Id', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.Id;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update users set status=1, updated_at=now() where id=$1 RETURNING *',
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

router.post('/user/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(um.id) as total "+
                    "from users um "+
                    "inner join employee_master emp on um.user_emp_id=emp.emp_id "+
                    "left outer join role_master rm on um.user_rm_id=rm.rm_id "+
                    "left outer join restaurant_master srm on um.user_srm_id=srm.srm_id "+
                    "where emp.emp_status = 0 "+
                    "and um.user_srm_id=$1 "+
                    "and LOWER(username||''||rm_name||''||emp_name) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.user_srm_id,str]);
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

router.post('/user/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM users um "+
                    "inner join employee_master emp on um.user_emp_id=emp.emp_id "+
                    "left outer join role_master rm on um.user_rm_id=rm.rm_id "+
                    "left outer join restaurant_master srm on um.user_srm_id=srm.srm_id "+
                    "where emp.emp_status = 0 "+
                    "and um.user_srm_id=$1 "+
                    "and LOWER(username||''||rm_name||''||emp_name) LIKE LOWER($2) "+
                    "order by um.id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.user_srm_id,str, req.body.number, req.body.begin]);
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

router.post('/view/:Id', oauth.authorise(), (req, res, next) => {
  
  const results = [];
  const id=req.params.Id;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("select uam_url,uam_date_time from users_activity_master where uam_users_id=$1 and date(uam_date_time)::date BETWEEN $2 and $3",[id,req.body.um_from_date,req.body.um_to_date]);
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