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
    const query = client.query("SELECT *,EMP_NAME||' - ( '||EMP_MOBILE||' )' AS EMP_SEARCH FROM EMPLOYEE_MASTER where emp_status = 0 order by emp_id desc");
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

router.get('/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM employee_master where emp_id=$1',[id]);
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
    client.query('INSERT INTO employee_master(emp_name, emp_mobile, emp_address, emp_status) values($1,$2,$3,0)',[req.body.emp_name,req.body.emp_mobile,req.body.emp_address]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM employee_master');
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

    var singleInsert = 'INSERT INTO employee_master(emp_name, emp_mobile, emp_address,emp_srm_id, emp_status) values($1,$2,$3,$4,0) RETURNING *',
        params = [req.body.emp_name,req.body.emp_mobile,req.body.emp_address,req.body.emp_srm_id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

/*router.post('/edit/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('UPDATE employee_master SET emp_name=$1, emp_mobile=$2, emp_address=$3 where emp_id=$4',[req.body.emp_name,req.body.emp_mobile,req.body.emp_address,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM employee_master');
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

router.post('/edit/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'UPDATE employee_master SET emp_name=$1, emp_mobile=$2, emp_address=$3 where emp_id=$4 RETURNING *',
        params = [req.body.emp_name,req.body.emp_mobile,req.body.emp_address,id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});


/*router.post('/delete/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('UPDATE employee_master SET emp_status=1,emp_updated_at=now() WHERE emp_id=($1)', [id]);
    // SQL Query > Insert Data
    // client.query('UPDATE employee_master SET cm_code=$1, cm_name=$2, cm_mobile=$3, cm_email=$4, cm_address=$5, cm_city=$6, cm_state=$7, cm_pin_code=$8, cm_car_name=$9, cm_car_model=$10, cm_car_number=$11 where cm_id=$12',[req.body.cm_code,req.body.cm_name,req.body.cm_mobile,req.body.cm_email,req.body.cm_address,req.body.cm_city,req.body.cm_state,req.body.cm_pin_code,req.body.cm_car_name,req.body.cm_car_model,req.body.cm_car_number,id]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM employee_master');
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

router.post('/delete/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    var singleInsert = 'UPDATE employee_master SET emp_status=1,emp_updated_at=now()  WHERE emp_id=($1) RETURNING *',
        params = [id]
    client.query(singleInsert, params, function (error, result) {
        results.push(result.rows[0]); // Will contain your inserted rows
        done();
        return res.json(results);
    });

    done(err);
  });
});

router.get('/getCityStateList', oauth.authorise(), (req, res, next) => {
  console.log("in");
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query('SELECT STAM_ID,STAM_NAME FROM STATES');
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

router.post('/employee/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(emp_id) as total "+
                    "from employee_master emp "+
                    "LEFT OUTER JOIN restaurant_master srm on emp.emp_srm_id=srm.srm_id "+
                    "where emp_status=0 "+
                    "and emp.emp_srm_id=$1 "+
                    "and LOWER(emp_name||''||emp_mobile) LIKE LOWER($2);";

    const query = client.query(strqry,[req.body.emp_srm_id,str]);
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

router.post('/employee/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM employee_master emp "+
                    "LEFT OUTER JOIN restaurant_master srm on emp.emp_srm_id=srm.srm_id "+
                    "where emp.emp_status = 0 "+
                    "and emp.emp_srm_id=$1 "+
                    "and LOWER(emp_name||''||emp_mobile) LIKE LOWER($2) "+
                    "order by emp.emp_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.emp_srm_id,str, req.body.number, req.body.begin]);
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
                    "FROM employee_master emp "+
                    "where emp.emp_status = 0 "+
                    "and LOWER(emp_name||' '||emp_mobile) LIKE LOWER($1) "+
                    "order by emp.emp_id desc LIMIT 10";

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

router.get('/details/:empId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.empId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query("select sm.sm_invoice_no as sm_invoice, vm.cm_name, vm.cm_address, sm.sm_date, sm.sm_amount, sm.sm_balance_amount, sm.sm_status from sale_master sm LEFT OUTER JOIN customer_master vm on sm.sm_cm_id=vm.cm_id LEFT OUTER JOIN employee_master emp on sm.sm_emp_id=emp.emp_id where emp.emp_id = $1 order by sm_date desc",[id]);
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
