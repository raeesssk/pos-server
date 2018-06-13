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
    const query = client.query("SELECT * FROM sale_master sm LEFT OUTER JOIN quatation_master qm on sm.sm_qm_id = qm.qm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master em on sm.sm_emp_id=em.emp_id order by sm_id desc");
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

router.get('/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM sale_master sm LEFT OUTER JOIN quatation_master qm on sm.sm_qm_id = qm.qm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master em on sm.sm_emp_id=em.emp_id where sm_id=$1",[id]);
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

router.get('/delivery/list', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM sale_master sm LEFT OUTER JOIN quatation_master qm on sm.sm_qm_id = qm.qm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master em on sm.sm_emp_id=em.emp_id where sm_status=0 order by sm_id asc");
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

router.get('/cashbook/list/:cmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.cmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM sale_master sm LEFT OUTER JOIN quatation_master qm on sm.sm_qm_id = qm.qm_id LEFT OUTER JOIN customer_master cm on sm.sm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master em on sm.sm_emp_id=em.emp_id where sm_status=0 and cm.cm_id=$1 order by sm_id asc",[id]);
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

router.get('/details/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM sale_product_master spm LEFT OUTER JOIN sale_master sm on spm.spm_sm_id = sm.sm_id LEFT OUTER JOIN product_master pm on spm.spm_pm_id= pm.pm_id LEFT OUTER JOIN category_master ctm on pm.pm_ctm_id= ctm.ctm_id where spm.spm_sm_id=$1',[id]);
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
  const purchaseSingleData = req.body.purchaseSingleData;
  const purchaseMultipleData = req.body.purchaseMultipleData;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
      client.query('BEGIN;');
      const singleInsert = client.query('INSERT INTO public.sale_master( sm_invoice_no, sm_date, sm_cm_id, sm_amount, sm_balance_amount, sm_comment, sm_payment_mode, sm_cgst_per, sm_sgst_per, sm_qm_id, sm_project, sm_discount, sm_status)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0)',[purchaseSingleData.sm_invoice_no,purchaseSingleData.sm_date,purchaseSingleData.sm_qm_id.cm_id,purchaseSingleData.sm_amount,purchaseSingleData.sm_amount,purchaseSingleData.sm_comment,purchaseSingleData.sm_payment_mode,purchaseSingleData.vatper,purchaseSingleData.sgstper,purchaseSingleData.sm_qm_id.qm_id,purchaseSingleData.sm_project,purchaseSingleData.discper]);

      const credit = purchaseSingleData.sm_qm_id.cm_balance;
      const amount = purchaseSingleData.sm_amount;
      if(credit > amount)
      {
        client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount,purchaseSingleData.sm_qm_id.cm_id]);
      }
      else
      {
        const debit = amount - credit;
        client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,purchaseSingleData.sm_qm_id.cm_id]);
      }

      const query = client.query("SELECT * from sale_master order by sm_id desc limit 1;");
      query.on('row', (row) => {
        purchaseMultipleData.forEach(function(product, index) {
          client.query('INSERT INTO public.sale_product_master(spm_sm_id, spm_pm_id, spm_quantity, spm_rate)VALUES ($1, $2, $3, $4)',[row.sm_id,product.pm_id,product.qpm_quantity,product.qpm_rate]);
        });
      });
      query.on('end', () => {
        done();
      });  
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM sale_master');
        query1.on('row', (row) => {
          results.push(row);
        });
        query1.on('end', () => {
          done();
          // pg.end();
          return res.json(results);
        });

    done(err);
  });

});

router.post('/edit/:smId', oauth.authorise(), (req, res, next) => {
  const id = req.params.smId;
  const results = [];
  const purchaseSingleData = req.body.purchaseSingleData;
  const purchaseMultipleData = req.body.purchaseMultipleData;
  const purchaseadd = req.body.purchaseadd;
  const purchaseremove = req.body.purchaseremove;
  
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
      client.query('BEGIN;');
      const singleInsert = client.query('update public.sale_master set sm_date=$1, sm_amount=$2, sm_balance_amount=$3, sm_comment=$4, sm_cgst_per=$5, sm_sgst_per=$6, sm_project=$7, sm_discount=$8 where sm_id=$9',[purchaseSingleData.sm_date,purchaseSingleData.sm_amount,purchaseSingleData.sm_amount,purchaseSingleData.sm_comment,purchaseSingleData.cgstper,purchaseSingleData.sgstper,purchaseSingleData.sm_project,purchaseSingleData.sm_discount,id]);
      
      const debit = purchaseSingleData.cm_debit;
      const amount = purchaseSingleData.old_sm_amount;
      if(debit > amount)
      {
        client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,purchaseSingleData.cm_id]);
      }
      else
      {
        const credit = amount - debit;
        client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,purchaseSingleData.cm_id]);
      }


      const query = client.query('SELECT * FROM customer_master where cm_id = $1',[purchaseSingleData.cm_id]);
      query.on('row', (row) => {
        const credit = row.cm_balance;
        const amount = purchaseSingleData.sm_amount;
        if(credit > amount)
        {
          client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount,purchaseSingleData.cm_id]);
        }
        else
        {
          const debit = amount - credit;
          client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,purchaseSingleData.cm_id]);
        }
      });
      query.on('end', () => {
        done();
      });

        purchaseremove.forEach(function(product, index) {
          client.query('delete from public.sale_product_master where spm_id=$1',[product.spm_id]);
        });

        purchaseadd.forEach(function(product, index) {
          client.query('INSERT INTO public.sale_product_master(spm_sm_id, spm_pm_id, spm_quantity, spm_rate)VALUES ($1, $2, $3, $4)',[id,product.pm_id,product.qpm_quantity,product.qpm_rate]);
        });
        
      client.query('COMMIT;');
        const query1 = client.query('SELECT * FROM sale_master');
        query1.on('row', (row) => {
          results.push(row);
        });
        query1.on('end', () => {
          done();
          // pg.end();
          return res.json(results);
        });
    done(err);
  });

});

router.post('/delete/:smId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.smId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');
    client.query('UPDATE sale_master SET sm_status=1 WHERE sm_id=($1)', [id]);

    const debit = req.body.cm_debit;
    const amount = req.body.sm_amount;
    if(debit > amount)
    {
      client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,req.body.cm_id]);
    }
    else
    {
      const credit = amount - debit;
      client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,req.body.cm_id]);
    }

    client.query('COMMIT;');
    const query1 = client.query("SELECT * from sale_master");
    query1.on('row', (row) => {
      results.push(row);
    });
    query1.on('end', () => {
      done();
      // pg.end();
      return res.json(results);
    });
    done(err);
  });
});

router.get('/serial/no', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from sale_master order by sm_id desc limit 1;");
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
