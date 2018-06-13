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
    const query = client.query("SELECT * FROM salereturn_master srm LEFT OUTER JOIN sale_master sm on srm.srm_sm_id=sm.sm_id LEFT OUTER JOIN customer_master cm on srm.srm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master emp on sm.sm_emp_id = emp.emp_id order by srm.srm_id desc");
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
    const query = client.query("SELECT * FROM salereturn_master srm LEFT OUTER JOIN sale_master sm on srm.srm_sm_id=sm.sm_id LEFT OUTER JOIN customer_master cm on srm.srm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master emp on sm.sm_emp_id = emp.emp_id where srm.srm_id=$1",[id]);
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

router.get('/details/:srmId', oauth.authorise(), (req, res, next) => {
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
    const query = client.query('SELECT * FROM salereturn_product_master srpm LEFT OUTER JOIN salereturn_master srm on srpm.srpm_srm_id = srm.srm_id LEFT OUTER JOIN purchase_product_master pm on srpm.srpm_ppm_id= pm.ppm_id LEFT OUTER JOIN category_master ctm on pm.ppm_ctm_id= ctm.ctm_id where srpm.srpm_srm_id=$1',[id]);
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

router.get('/returndetails/:vmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.vmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM salereturn_master srm LEFT OUTER JOIN sale_master sm on srm.srm_sm_id=sm.sm_id LEFT OUTER JOIN customer_master cm on srm.srm_cm_id = cm.cm_id LEFT OUTER JOIN employee_master emp on sm.sm_emp_id = emp.emp_id where srm.srm_status=0 and cm.cm_id=$1 order by srm.srm_id asc",[id]);
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
    const singleInsert = client.query('INSERT INTO public.salereturn_master( srm_invoice_no, srm_date, srm_cm_id, srm_amount, srm_sm_id, srm_comment, srm_vat, srm_sgst, srm_igst, srm_status)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)', [purchaseSingleData.srm_invoice_no,purchaseSingleData.srm_date,purchaseSingleData.sm_invoice_no.cm_id,purchaseSingleData.srm_amount, purchaseSingleData.sm_invoice_no.sm_id,purchaseSingleData.srm_comment,purchaseSingleData.vat,purchaseSingleData.sgst,purchaseSingleData.igst]);
    
    const debit = purchaseSingleData.sm_invoice_no.cm_debit;
    const amount = purchaseSingleData.srm_amount;
    if(debit > amount)
    {
      client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,purchaseSingleData.sm_invoice_no.cm_id]);
    }
    else
    {
      const credit = amount - debit;
      client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,purchaseSingleData.sm_invoice_no.cm_id]);
    }

    client.query('update sale_master set sm_balance_amount=sm_balance_amount-$1 where sm_id=$2',[purchaseSingleData.srm_amount,purchaseSingleData.sm_invoice_no.sm_id]);
    const query = client.query("SELECT * from salereturn_master order by srm_id desc limit 1;");
    query.on('row', (row) => {
      purchaseMultipleData.forEach(function(product, index) {

        const va = client.query('INSERT INTO public.salereturn_product_master(srpm_srm_id, srpm_ppm_id, srpm_quantity, srpm_rate, srpm_vat, srpm_sgst, srpm_igst)VALUES ($1, $2, $3, $4, $5, $6, $7)',[row.srm_id,product.ppm_id,product.spm_quantity,product.spm_rate_vat,product.spm_vat,product.spm_sgst,product.spm_igst]);
        client.query('update purchase_product_master set ppm_quantity_sale=ppm_quantity_sale+$1 where ppm_id=$2',[product.spm_quantity,product.ppm_id]);
        
      });
    });
    query.on('end', () => {
      done();
    });
    client.query('COMMIT;');
    const query1 = client.query('SELECT * FROM salereturn_master');
    query1.on('row', (row) => {
      results.push(row);
    });
    query1.on('end', () => {
      done();
      return res.json(results);
    });
    done(err);
  });

});

router.post('/edit/:srmId', oauth.authorise(), (req, res, next) => {
  const id = req.params.srmId;
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
    const singleInsert = client.query('UPDATE public.salereturn_master set srm_date=$1, srm_amount=$2, srm_comment=$3, srm_vat=$4, srm_sgst=$5, srm_igst=$6 where srm_id=$7', [purchaseSingleData.srm_date,purchaseSingleData.srm_amount,purchaseSingleData.srm_comment,purchaseSingleData.vat,purchaseSingleData.sgst,purchaseSingleData.igst,id]);
    
    const credit = purchaseSingleData.cm_balance;
    const amount = purchaseSingleData.old_srm_amount;
    if(credit > amount)
    {
      client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount,purchaseSingleData.cm_id]);
    }
    else
    {
      const debit = amount - credit;
      client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,purchaseSingleData.cm_id]);
    }

    const query = client.query('SELECT * FROM customer_master where cm_id = $1',[purchaseSingleData.cm_id]);
    query.on('row', (row) => {
      
      const debit = row.cm_debit;
      const amount = purchaseSingleData.srm_amount;
      if(debit > amount)
      {
        client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,purchaseSingleData.cm_id]);
      }
      else
      {
        const credit = amount - debit;
        client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,purchaseSingleData.cm_id]);
      }
    });
    query.on('end', () => {
      done();
    });

    client.query('update sale_master set sm_balance_amount=sm_balance_amount+$1 where sm_id=$2',[purchaseSingleData.old_srm_amount,purchaseSingleData.sm_id]);
    client.query('update sale_master set sm_balance_amount=sm_balance_amount-$1 where sm_id=$2',[purchaseSingleData.srm_amount,purchaseSingleData.sm_id]);
    
    purchaseremove.forEach(function(product, index) {

      client.query('update purchase_product_master set ppm_quantity_sale=ppm_quantity_sale-$1 where ppm_id=$2',[product.srpm_quantity,product.ppm_id]);
      client.query('delete from public.salereturn_product_master where srpm_id=$1',[product.srpm_id]);

    });

    purchaseadd.forEach(function(product, index) {

      const va = client.query('INSERT INTO public.salereturn_product_master(srpm_srm_id, srpm_ppm_id, srpm_quantity, srpm_rate, srpm_vat, srpm_sgst, srpm_igst)VALUES ($1, $2, $3, $4, $5, $6, $7)',[id,product.ppm_id,product.srpm_quantity,product.spm_rate_vat,product.srpm_vat,product.srpm_sgst,product.srpm_igst]);
      client.query('update purchase_product_master set ppm_quantity_sale=ppm_quantity_sale+$1 where ppm_id=$2',[product.srpm_quantity,product.ppm_id]);
      
    });

      client.query('COMMIT;');
      const query1 = client.query('SELECT * FROM salereturn_master');
        query1.on('row', (row) => {
          results.push(row);
        });
        query1.on('end', () => {
          done();
          return res.json(results);
        });

    done(err);
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
    client.query('UPDATE salereturn_master SET srm_status=1 WHERE srm_id=($1)', [id]);
    
    const credit = req.body.cm_balance;
    const amount = req.body.srm_amount;
    if(credit > amount)
    {
      client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount,req.body.cm_id]);
    }
    else
    {
      const debit = amount - credit;
      client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,req.body.cm_id]);
    }

    client.query('update sale_master set sm_balance_amount=sm_balance_amount+$1 where sm_id=$2',[req.body.srm_amount,req.body.sm_id]);
    
    const query1 = client.query("SELECT * FROM salereturn_product_master srpm LEFT OUTER JOIN salereturn_master srm on srpm.srpm_srm_id = srm.srm_id LEFT OUTER JOIN purchase_product_master pm on srpm.srpm_ppm_id= pm.ppm_id LEFT OUTER JOIN category_master ctm on pm.ppm_ctm_id= ctm.ctm_id where srpm.srpm_srm_id=$1",[id]);
    query1.on('row', (row) => {
        client.query('update purchase_product_master set ppm_quantity_sale=ppm_quantity_sale-$1 where ppm_id=$2',[row.srpm_quantity,row.srpm_ppm_id]);
    });
    query1.on('end', () => {
      done();
      // pg.end();
    });

      client.query('COMMIT;');
    const query = client.query('SELECT * FROM salereturn_master');
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

router.get('/serial/no', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from salereturn_master order by srm_id desc limit 1;");
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
