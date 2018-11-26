var express = require('express');
var router = express.Router();
var oauth = require('../oauth/index');
var pg = require('pg');
var path = require('path');
var config = require('../config.js');

var pool = new pg.Pool(config);

router.get('/', (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM purchase_master prm LEFT OUTER JOIN dealer_master dm on prm.prm_dm_id = dm.dm_id order by prm.prm_id desc");
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

router.get('/:prmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.prmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * FROM purchase_master prm LEFT OUTER JOIN dealer_master dm on prm.prm_dm_id = dm.dm_id where prm.prm_id=$1",[id]);
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

router.get('/details/:prmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.prmId;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM purchase_product_master ppm LEFT OUTER JOIN purchase_master prm on ppm.ppm_prm_id = prm.prm_id LEFT OUTER JOIN inventory_master im on ppm.ppm_im_id= im.im_id LEFT OUTER JOIN unit_master um on im.im_um_id= um.um_id where ppm.ppm_prm_id=$1',[id]);
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
    
      if(purchaseSingleData.prm_credit == "credit")
      {
        const singleInsert = client.query('INSERT INTO public.purchase_master( prm_invoice_no, prm_date, prm_dm_id, prm_amount, prm_credit, prm_payment_date, prm_comment, prm_username, prm_srm_id, prm_status)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0)',
          [purchaseSingleData.prm_invoice_no,purchaseSingleData.prm_date,purchaseSingleData.prm_dm_id.dm_id,purchaseSingleData.prm_amount,purchaseSingleData.prm_credit,purchaseSingleData.prm_payment_date,purchaseSingleData.prm_comment,purchaseSingleData.prm_username,purchaseSingleData.prm_srm_id]);
        
        const debit = purchaseSingleData.prm_dm_id.dm_debit;
        const amount = purchaseSingleData.prm_amount;
        if(debit > amount)
        {
          client.query('update dealer_master set dm_debit=dm_debit-$1 where dm_id=$2',
            [amount,purchaseSingleData.prm_dm_id.dm_id]);
        }
        else
        {
          const credit = amount - debit;
          client.query('update dealer_master set dm_credit=dm_credit+$1, dm_debit=dm_debit-$2 where dm_id=$3',
            [credit,debit,purchaseSingleData.prm_dm_id.dm_id]);
        }

    }
    else{
      client.query('INSERT INTO public.purchase_master( prm_invoice_no, prm_date, prm_dm_id, prm_amount, prm_credit, prm_comment, prm_username,prm_srm_id, prm_status)VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0)',
        [purchaseSingleData.prm_invoice_no,purchaseSingleData.prm_date,purchaseSingleData.prm_dm_id.dm_id,purchaseSingleData.prm_amount,purchaseSingleData.prm_credit,purchaseSingleData.prm_comment,purchaseSingleData.prm_username,purchaseSingleData.prm_srm_id]);
    }
    const query = client.query("SELECT * from purchase_master order by prm_id desc limit 1;");
    query.on('row', (row) => {
      // console.log(purchaseMultipleData);
      purchaseMultipleData.forEach(function(product, index) {
        console.log(product);
        const va = client.query('INSERT INTO public.purchase_product_master(ppm_prm_id, ppm_im_id, ppm_qty, ppm_rate)VALUES ($1, $2, $3, $4)',
          [row.prm_id,product.ppm_im_id.im_id,product.ppm_qty,product.ppm_rate]);
        client.query('UPDATE inventory_master set im_quantity = im_quantity + $1 where im_id = $2',
          [product.ppm_qty,product.ppm_im_id.im_id]);
      });
    });
    query.on('end', () => {
      done();
    });
    client.query('COMMIT;');
    const query1 = client.query('SELECT * FROM purchase_master');
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

router.post('/edit/:prmId', oauth.authorise(), (req, res, next) => {
  const id = req.params.prmId;
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
    
      if (purchaseSingleData.old_prm_credit == "credit") 
      {
        const credit = purchaseSingleData.old_prm_dm_id.dm_credit;
        const amount = purchaseSingleData.old_prm_amount;
        if(credit > amount)
        {
          client.query('update dealer_master set dm_credit=dm_credit-$1 where dm_id=$2',[amount,purchaseSingleData.old_prm_dm_id.dm_id]);
        }
        else
        {
          const debit = amount - credit;
          client.query('update dealer_master set dm_credit=dm_credit-$1, dm_debit=dm_debit+$2 where dm_id=$3',[credit,debit,purchaseSingleData.old_prm_dm_id.dm_id]);
        }
      }

       if(purchaseSingleData.prm_credit == "credit")
      {

        client.query('update public.purchase_master set prm_date=$1, prm_dm_id=$2, prm_amount=$3, prm_credit=$4, prm_payment_date=$5, prm_comment=$6, dm_updated_at=now() where prm_id=$7',[purchaseSingleData.prm_date,purchaseSingleData.prm_dm.dm_id,purchaseSingleData.prm_amount,purchaseSingleData.prm_credit,purchaseSingleData.prm_payment_date,purchaseSingleData.prm_comment,id]);
        
        const query = client.query('SELECT * FROM dealer_master where dm_id = $1',[purchaseSingleData.prm_dm.dm_id]);
        query.on('row', (row) => {
          const debit = purchaseSingleData.prm_dm.dm_debit;
          const amount = purchaseSingleData.prm_amount;
          if(debit > amount)
          {
            client.query('update dealer_master set dm_debit=dm_debit-$1 where dm_id=$2',[amount,purchaseSingleData.prm_dm.dm_id]);
          }
          else
          {
            const credit = amount - debit;
            client.query('update dealer_master set dm_credit=dm_credit+$1, dm_debit=dm_debit-$2 where dm_id=$3',[credit,debit,purchaseSingleData.prm_dm.dm_id]);
          }
        });
        query.on('end', () => {
          done();
        });
      }
      else{
        client.query('update public.purchase_master set prm_date=$1, prm_dm_id=$2, prm_amount=$3, prm_credit=$4, prm_comment=$5, prm_payment_date=null, dm_updated_at=now() where prm_id=$6',[purchaseSingleData.prm_date,purchaseSingleData.prm_dm.dm_id,purchaseSingleData.prm_amount,purchaseSingleData.prm_credit,purchaseSingleData.prm_comment,id]);
      }

      purchaseremove.forEach(function(product, index) {
          // console.log(product);
          client.query('UPDATE inventory_master set im_quantity = im_quantity - $1 where im_id = $2',[product.ppm_qty,product.ppm_im_id]);
          client.query('delete from public.purchase_product_master where ppm_id=$1',[product.ppm_id]);
        });

      purchaseMultipleData.forEach(function(product, index) {
        const va = client.query('UPDATE public.purchase_product_master set ppm_qty=$1, ppm_rate=$2 where ppm_id=$3',[product.ppm_qty,product.ppm_rate,product.ppm_id]);
        client.query('UPDATE inventory_master set im_quantity = im_quantity - $1 where im_id = $2',[product.old_ppm_qty,product.ppm_im_id]);
        client.query('UPDATE inventory_master set im_quantity = im_quantity + $1 where im_id = $2',[product.ppm_qty,product.ppm_im_id]);
      });

      purchaseadd.forEach(function(product, index) {
        const va = client.query('INSERT INTO public.purchase_product_master(ppm_prm_id, ppm_im_id, ppm_qty, ppm_rate)VALUES ($1, $2, $3, $4)',[id,product.im_search.im_id,product.ppm_qty,product.ppm_rate]);
        client.query('UPDATE inventory_master set im_quantity = im_quantity + $1 where im_id = $2',[product.ppm_qty,product.im_search.im_id]);
      });
      
      client.query('COMMIT;');
      const query1 = client.query('SELECT * FROM purchase_master');
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

router.post('/delete/:prmId', oauth.authorise(), (req, res, next) => {
  const results = [];
  const id = req.params.prmId;
  const purchaseSingleData = req.body;
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('BEGIN;');
    if (purchaseSingleData.prm_credit == "credit") 
    {
      const credit = purchaseSingleData.dm_credit;
      const amount = purchaseSingleData.prm_amount;
      if(credit > amount)
      {
        client.query('update dealer_master set dm_credit=dm_credit-$1 where dm_id=$2',[amount,purchaseSingleData.dm_id]);
      }
      else
      {
        const debit = amount - credit;
        client.query('update dealer_master set dm_credit=dm_credit-$1, dm_debit=dm_debit+$2 where dm_id=$3',[credit,debit,purchaseSingleData.dm_id]);
      }
    }

    client.query('UPDATE purchase_master SET prm_status=1 WHERE prm_id=($1)', [id]);
   
    const query1 = client.query("SELECT * FROM purchase_product_master ppm LEFT OUTER JOIN purchase_master prm on ppm.ppm_prm_id = prm.prm_id LEFT OUTER JOIN inventory_master im on ppm.ppm_im_id= im.im_id where ppm.ppm_prm_id=$1",[id]);
    query1.on('row', (row) => {
        client.query('update inventory_master set im_quantity=im_quantity-$1 where im_id=$2',[row.ppm_qty,row.ppm_im_id]);
    });
    query1.on('end', () => {
      done();
      // pg.end();
    });


      client.query('COMMIT;');
    const query = client.query('SELECT * FROM purchase_master');
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

router.get('/invoice/no', oauth.authorise(), (req, res, next) => {
  const results = [];
  pool.connect(function(err, client, done){
    if(err) {
      done();
      // pg.end();
      console.log("the error is"+err);
      return res.status(500).json({success: false, data: err});
    }
    const query = client.query("SELECT * from purchase_master order by prm_id desc limit 1;");
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

router.post('/purchase/total', oauth.authorise(), (req, res, next) => {
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
    const strqry =  "SELECT count(prm_id) as total "+
                    "from purchase_master prm "+
                    "LEFT OUTER JOIN dealer_master dm on prm.prm_dm_id = dm.dm_id "+
                    "inner join restaurant_master srm on prm.prm_srm_id=srm.srm_id "+
                    "where prm.prm_status = 0 "+
                    "and prm_srm_id = $1 "+
                    "and LOWER(dm_firm_name) LIKE LOWER($2) ";

    const query = client.query(strqry,[req.body.prm_srm_id,str]);
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

router.post('/purchase/limit', oauth.authorise(), (req, res, next) => {
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
                    "FROM purchase_master prm "+
                    "LEFT OUTER JOIN dealer_master dm on prm.prm_dm_id = dm.dm_id "+
                    "inner join restaurant_master srm on prm.prm_srm_id=srm.srm_id "+
                    "where prm.prm_status = 0 "+
                    "and prm_srm_id = $1 "+
                    "and LOWER(dm_firm_name) LIKE LOWER($2) "+
                    "order by prm.prm_id desc LIMIT $3 OFFSET $4";

    const query = client.query(strqry,[req.body.prm_srm_id, str, req.body.number, req.body.begin]);
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
