var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

/*router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM role_master order by rm_id desc");
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
router.get('/', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM permission_master");
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

router.get('/subpermission/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM permission_sub_master psm inner join permission_master pmm on psm.psm_pmm_id=pmm.pmm_id where pmm_status=0 and pmm_id=$1 order by pmm_id asc",[id]);
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


router.get('/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT rm_id,rm_name,rm_description,rm_status,rm_updated_at,rm_created_at FROM role_master where rm_id=$1',[id]);
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

router.get('/permission/:roleId', oauth.authorise(), (req, res, next) => {
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

router.post('/add', oauth.authorise(), (req, res, next) => {
  const results = [];
  const role=req.body.role;
  const permission=req.body.permission;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = "INSERT INTO role_master(rm_name, rm_description, rm_srm_id, rm_status) values($1,$2,$3,0) RETURNING *",
        params = [role.rm_name,role.rm_description,role.rm_srm_id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        permission.forEach(function(value, key){

          client.query('INSERT into role_permission_master(rpm_rm_id,rpm_pmm_id,rpm_psm_id,rpm_pssm_id) values($1,$2,$3,$4) RETURNING *',
            [result.rows[0].rm_id,value.psm_pmm_id,value.psm_id,value.pssm_id]);
        });
        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/edit/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  const permission=req.body.permission;
  const role=req.body.role;
  const remove= req.body.oldpermission;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    
    var singleInsert = 'update role_master set rm_name=$1, rm_description=$2, rm_updated_at=now() where rm_id=$3 RETURNING *',
        params = [role.rm_name,role.rm_description,id];
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        remove.forEach(function(product, index) {
          client.query('delete from public.role_permission_master where rpm_psm_id=$1',
            [product.psm_id]);
        });
        permission.forEach(function(value, key){
          client.query('INSERT into role_permission_master(rpm_rm_id,rpm_pmm_id,rpm_psm_id,rpm_pssm_id) values($1,$2,$3,$4) RETURNING *',
            [result.rows[0].rm_id,value.psm_pmm_id,value.psm_id,value.pssm_id]);
        });

        client.query('COMMIT;');
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.post('/delete/:roleId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.roleId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

    var singleInsert = 'update role_master set rm_status=1, rm_updated_at=now() where rm_id=$1 RETURNING *',
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

router.post('/role/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(rm.rm_id) as total "+
                    "from role_master rm "+
                    "left outer join restaurant_master srm on rm.rm_srm_id=srm.srm_id "+
                    "where rm.rm_status=0 "+
                    "and rm.rm_srm_id=$1 "+
                    "and LOWER(rm_name||''||rm_description) LIKE LOWER($2);";

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

router.post('/role/limit', oauth.authorise(), (req, res, next) => {
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
                    "from role_master rm "+
                    "left outer join restaurant_master srm on rm.rm_srm_id=srm.srm_id "+
                    "where rm.rm_status=0 "+
                    "and rm.rm_srm_id=$1 "+
                    "and LOWER(rm_name||''||rm_description) LIKE LOWER($2) "+
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
                    "FROM role_master rm "+
                    "where rm.rm_status =0 "+
                    "and LOWER(rm_name) LIKE LOWER($1) "+
                    "order by rm.rm_id desc LIMIT 10";

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

router.post('/permission/edit:permId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const role=req.body.role;
  const permission=req.body.permission;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = "INSERT INTO role_master(rm_name, rm_description, rm_status) values($1,$2,0) RETURNING *",
        params = [role.rm_name,role.rm_description]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        permission.forEach(function(value, key){
          client.query('INSERT into role_permission_master(rpm_rm_id,rpm_pm_id,rpm_add,rpm_edit,rpm_delete,rpm_list) values($1,$2,$3,$4,$5,$6) RETURNING *',
            [result.rows[0].rm_id,value.pm_id,value.pm_add1,value.pm_edit1,value.pm_delete1,value.pm_list1]);
        });
        done();
        return res.json(results);
    });

    done(err);
  });
});



module.exports = router;