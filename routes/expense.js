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
    const query = client.query("SELECT * FROM EXPENSE_MASTER em LEFT OUTER JOIN customer_master cm on em.em_cm_id = cm.cm_id where em.em_status = 0 order by em_id desc");
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

router.get('/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query("SELECT * FROM EXPENSE_MASTER em LEFT OUTER JOIN customer_master cm on em.em_cm_id = cm.cm_id where em.em_status = 0 and em_id=$1",[id]);
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
  const expenseSingleData = req.body;
  // const expenseSingleData = req.body.expense;
  // const expenseMultipleData = req.body.expenseMultipleData;
  // const expenseMultipleDataSale = req.body.expenseMultipleDataSale;

  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

      const debit = expenseSingleData.expensess.cm_debit;
      const amount = expenseSingleData.em_amount;
      if(debit > amount)
      {
        client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,expenseSingleData.expensess.cm_id]);
      }
      else
      {
        const credit = amount - debit;
        client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,expenseSingleData.expensess.cm_id]);
      }

      client.query('INSERT INTO expense_master(em_payment_mode, em_received_by, em_comment, em_date, em_cm_id, em_credit, em_payment_against, em_invoice_no, em_cheque_no, em_cheque_date, em_amount, em_status) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,0)',[expenseSingleData.em_payment_mode,expenseSingleData.em_received_by,expenseSingleData.em_comment,expenseSingleData.em_date,expenseSingleData.expensess.cm_id,expenseSingleData.em_amount,expenseSingleData.em_payment_against,expenseSingleData.sm_invoice_no.sm_invoice_no,expenseSingleData.em_cheque_no,expenseSingleData.em_cheque_date]);
      client.query('update sale_master set sm_balance_amount=sm_balance_amount-$1 where sm_id=$2',[expenseSingleData.em_amount,expenseSingleData.sm_invoice_no.sm_id]);
    
    client.query('COMMIT;');
    // SQL Query > Insert Data
    
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM expense_master');
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

router.post('/edit/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  const expenseSingleData = req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    client.query('BEGIN;');

      client.query('update expense_master set em_payment_mode=$1, em_received_by=$2, em_comment=$3, em_date=$4, em_credit=$5, em_cheque_no=$6, em_cheque_date=$7 where em_id = $8',[expenseSingleData.em_payment_mode,expenseSingleData.em_received_by,expenseSingleData.em_comment,expenseSingleData.em_date,expenseSingleData.em_amount,expenseSingleData.em_cheque_no,expenseSingleData.em_cheque_date,id]);

      const credit = expenseSingleData.cm_balance;
      const amount1 = expenseSingleData.old_em_amount;
      if(credit > amount1)
      {
        client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount1,expenseSingleData.cm_id]);
      }
      else
      {
        const debit = amount1 - credit;
        client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,expenseSingleData.cm_id]);
      }

      const query = client.query('SELECT * FROM customer_master where cm_id = $1',[expenseSingleData.cm_id]);
      query.on('row', (row) => {
        const debit = row.cm_debit;
        const amount = expenseSingleData.em_amount;
        if(debit > amount)
        {
          client.query('update customer_master set cm_debit=cm_debit-$1 where cm_id=$2',[amount,expenseSingleData.cm_id]);
        }
        else
        {
          const credit = amount - debit;
          client.query('update customer_master set cm_balance=cm_balance+$1, cm_debit=cm_debit-$2 where cm_id=$3',[credit,debit,expenseSingleData.cm_id]);
        }
      });
      query.on('end', () => {
        done();
      });
      
      client.query('update sale_master set sm_balance_amount=sm_balance_amount+$1 where sm_invoice_no=$2',[expenseSingleData.old_em_amount,expenseSingleData.em_invoice_no]);
      client.query('update sale_master set sm_balance_amount=sm_balance_amount-$1 where sm_invoice_no=$2',[expenseSingleData.em_amount,expenseSingleData.em_invoice_no]);
    

    client.query('COMMIT;');
    const query1 = client.query('SELECT * FROM expense_master');
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

router.post('/delete/:emId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.emId;
  const expenseSingleData = req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    
    client.query('BEGIN;');

      const credit = expenseSingleData.cm_balance;
      const amount1 = expenseSingleData.em_credit;
      if(credit > amount1)
      {
        client.query('update customer_master set cm_balance=cm_balance-$1 where cm_id=$2',[amount1,expenseSingleData.cm_id]);
      }
      else
      {
        const debit = amount1 - credit;
        client.query('update customer_master set cm_balance=cm_balance-$1, cm_debit=cm_debit+$2 where cm_id=$3',[credit,debit,expenseSingleData.cm_id]);
      }
      client.query('update sale_master set sm_balance_amount=sm_balance_amount+$1 where sm_invoice_no=$2',[expenseSingleData.em_credit,expenseSingleData.em_invoice_no]);
    

    client.query('delete from expense_master where em_id = $1',[id]);
    
    client.query('COMMIT;');
    const query = client.query('SELECT * FROM expense_master');
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
