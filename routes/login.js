var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var multer = require('multer'); 

var pool = new pg.Pool(config);

router.get('/permission/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("select DISTINCT(pmm_id),pmm_name,pmm_class from role_permission_master rpm left outer join permission_master pmm on rpm.rpm_pmm_id=pmm.pmm_id where rpm_rm_id = $1 order by pmm_id asc",[id]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});

router.post('/sub', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("select distinct(rpm.rpm_psm_id),psm_permissions,psm_url,psm_icon,psm_id from role_permission_master rpm inner join permission_sub_master psm on rpm.rpm_psm_id=psm.psm_id where psm_pmm_id=$1 and rpm_rm_id=$2 order by psm_id asc",[ req.body.pmm_id, req.body.roleid]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});

router.get('/superole/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id=req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT rpm_rm_id,rpm_pmm_id,rpm_psm_id,rpm_pssm_id FROM role_permission_master rpm left outer join permission_sub_master psm on rpm.rpm_psm_id =psm.psm_id left outer join permission_supersub_master pssm on rpm.rpm_pssm_id=pssm.pssm_id left outer join permission_master pmm on rpm.rpm_pmm_id=pmm.pmm_id where rpm_rm_id=$1",[id]);
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

router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT username FROM users');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});


// router.post('/check', (req, res, next) => {
//   const results = [];
//   console.log(req.body)
//   pool.connect(function(err, client, done){
//     if(err) {
//       done();
//       done(err);
//       console.log("the error is"+err);
//       return res.status(500).json({success: false, data: err});
//     }
//     // SQL Query > Select Data
//     const query = client.query('SELECT username FROM users where username=$1',[req.body.username]);
//     // Stream results back one row at a time
//     query.on('row', (row) => {
//       results.push(row);
//     });
//     // After all data is returned, close connection and return results
//     query.on('end', () => {
//       done();
//       return res.json(results);
//     });
//     done(err);
//   });
// });

router.post('/check', (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is "+err);
      return res.status(500).json({success: false, data: err});
    }
 
    // SQL Query > Insert Data
    // client.query('UPDATE employee_master SET cm_code=$1, cm_name=$2, cm_mobile=$3, cm_email=$4, cm_address=$5, cm_city=$6, cm_state=$7, cm_pin_code=$8, cm_car_name=$9, cm_car_model=$10, cm_car_number=$11 where cm_id=$12',[req.body.cm_code,req.body.cm_name,req.body.cm_mobile,req.body.cm_email,req.body.cm_address,req.body.cm_city,req.body.cm_state,req.body.cm_pin_code,req.body.cm_car_name,req.body.cm_car_model,req.body.cm_car_number,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT username FROM users where username=$1',[req.body.username]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  done(err);
  });
});
/*router.post('/changepassword', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const upd = client.query('update users set password=$1 where username=$2 and password=$3',[req.body.conpassword,req.body.username,req.body.curpassword]);
    
    const query = client.query('SELECT username FROM users where password=$1',[req.body.conpassword]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});*/

router.post('/changepassword', oauth.authorise(), (req, res, next) => {
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

    var singleInsert = 'UPDATE users SET password=$1 where username=$2 and password=$3 RETURNING *',
        params = [req.body.conpassword,req.body.username,req.body.curpassword]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});

/*router.post('/isonline', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // // SQL Query > Select Data
    client.query('update users set is_online=1, last_login=now() where username=$1',[req.body.username]);
    const query = client.query('SELECT username,first_name,icon_image FROM users where username=$1',[req.body.username]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});*/

router.post('/isonline', oauth.authorise(), (req, res, next) => {
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

    var singleInsert = 'UPDATE users SET is_online=1, last_login=now() where username=$1 RETURNING *',
        params = [req.body.username]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});

/*router.post('/isoffline', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      done(err);
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // // SQL Query > Select Data
    client.query('update users set is_online=0, last_logout=now() where username=$1',[req.body.username]);
    const query = client.query('SELECT username,first_name,icon_image FROM users where username=$1',[req.body.username]);
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });
});*/

router.post('/isoffline', oauth.authorise(), (req, res, next) => {
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

    var singleInsert = 'UPDATE users SET is_online=0, last_login=now() where username=$1 RETURNING *',
        params = [req.body.username]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        client.query('COMMIT;');
        return res.json(results);
    });

    done(err);
  });
});

router.post('/profile/image/:userId', oauth.authorise(), (req, res, next) => {

  var filenamestore = "";

  var Storage = multer.diskStorage({
      destination: function (req, file, callback) {
          // callback(null, "../nginx/html/images");
          callback(null, "C:/xampp/htdocs/pos/resources/assets/img");
      },
      filename: function (req, file, callback) {
          var fi = file.fieldname + "_" + Date.now() + "_" + file.originalname;
          filenamestore = "./resources/assets/img/"+fi;
          callback(null, fi);
      }
  });

  var upload = multer({ storage: Storage }).array("imgUploader", 3); 

  const results = [];
  const id = req.params.userId;
  upload(req, res, function (err) { 
    if (err) { 
        return res.end("Something went wrong!"+err); 
    } 
    pool.connect(function(err, client, done){
      if(err) {
        done();
        done(err);
        console.log("the error is"+err);
        return res.status(500).json({success: false, data: err});
      }
      // // SQL Query > Select Data
      client.query('update users set icon_image=$1, first_name=$2 where username=$3',[filenamestore,req.body.firstname,id]);
      const query = client.query('SELECT username,first_name,icon_image FROM users where username=$1',[id]);
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', () => {
        done();
        return res.json(results);
      });
      done(err);
    });
  });
}); 
// 25178 381 1
// router.get('/backup', oauth.authorise(), (req, res, next) => {
//   const results = [];
//   pool.connect(function(err, client, done){
//     if(err) {
//       done();
//       done(err);
//       console.log("the error is"+err);
//       return res.status(500).json({success: false, data: err});
//     }
//     mysqlDump({
//         host: 'localhost',
//         port: '5432',
//         user: 'postgres',
//         password: 'zeartech',
//         database: 'citymotors',
//         tables:['users'], // only these tables 
//         dest:'D:/zeartech/orient-furniture-palace/backup.sql' // destination file 
//     },function(err){
//         // create data.sql file; 
//     })
//     // SQL Query > Select Data
//     // const query = client.query('pg_dump citymotors > D:/zeartech/orient-furniture-palace/backup.sql');
//     // // Stream results back one row at a time
//     // query.on('row', (row) => {
//     //   results.push(row);
//     // });
//     // // After all data is returned, close connection and return results
//     // query.on('end', () => {
//     //   done();
//     //   return res.json(results);
//     // });
//     done(err);
//   });
// });

module.exports = router;
