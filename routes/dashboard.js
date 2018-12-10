var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.get('/salereport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM sale_master sm LEFT OUTER JOIN quatation_master qm on sm.sm_qm_id = qm.qm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master em on sm.sm_emp_id=em.emp_id where sm_status=0 order by sm_id desc");
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


router.post('/salereport/:srmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.srmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT count(om.om_id) as total,sum(om.om_amount) as amount FROM order_master om LEFT OUTER JOIN table_master tm on om.om_tm_id = tm.tm_id LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id LEFT OUTER JOIN restaurant_master srm on om.om_srm_id=srm.srm_id where om.om_status=0 and om_created_at::date = CURRENT_DATE and om.om_status_type='closed' and om_srm_id=$1",[id]);
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

router.post('/monthlyreport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT count(om.om_id) as total,sum(om.om_amount) as amount FROM order_master om LEFT OUTER JOIN table_master tm on om.om_tm_id = tm.tm_id LEFT OUTER JOIN area_master am on tm.tm_am_id=am.am_id LEFT OUTER JOIN restaurant_master srm on om.om_srm_id=srm.srm_id where om.om_status=0 and date(om_created_at)::date BETWEEN $1 and $2 and om.om_status_type='closed' and om_srm_id=$3",[req.body.from_date,req.body.to_date,req.body.srm_id]);
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



router.get('/chequereceivedatereport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM expense_master prm LEFT OUTER JOIN customer_master vm on prm.em_cm_id = vm.cm_id where prm.em_status = 0 and prm.em_cheque_date BETWEEN current_date AND current_date + interval '2' day order by prm.em_id desc");
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

router.get('/chequepaymentdatereport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM dailyexpense_master prm LEFT OUTER JOIN expense_type_master vm on prm.em_etm_id = vm.etm_id where prm.em_status = 0 and prm.em_cheque_date BETWEEN current_date AND current_date + interval '2' day order by prm.dem_id desc");
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

router.get('/dailybalancereport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const querystr =  "(select sm.sm_invoice_no as id,cm.cm_name ||' '|| cm.cm_mobile ||' '|| cm.cm_address as custname,0 as debit, sm.sm_amount as credit,'1' as num, sm.sm_date as date, 'income' as type from sale_master sm LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id where sm_status=0 and sm.sm_date=current_date) Union"+
                      "(select ''||dem_id as id,em_received_by as custname,em_amount as debit,0 as credit,'2' as num, em_date as date, 'expense' as type from dailyexpense_master where em_date=current_date) order by date,num asc";
    
    const query = client.query(querystr);
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

router.get('/customerreport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM CUSTOMER_MASTER where cm_status = 0 order by cm_debit desc");
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

router.get('/quotationreport', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM quatation_master qm LEFT OUTER JOIN customer_master cm on qm.qm_cm_id = cm.cm_id where qm_status=0 order by qm_id desc");
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