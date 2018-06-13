
var model = module.exports;

var pg = require('pg');
var config = require('../config.js');
// var connectionString = process.env.DATABASE_URL || 'postgres://postgres:zeartech@localhost:5432/orientfurniture';

// var Crypt = require('../commons/encryption');

var pool = new pg.Pool(config);
//
// oauth2-server callbacks
//
model.getAccessToken = function (bearerToken, callback) {
  console.log("getAccessToken");
  pool.connect(function(err, client, done){
      const query = client.query('SELECT * FROM access_tokens where  accesstoken = $1', [bearerToken]);
      query.on('row', (row) => {
        callback(null, row);
      });
  done(err);
    });
  // pool.end();
};

model.getClient = function (clientId, clientSecret, callback) {
  console.log("getClient");
  if (clientSecret === null) {
    pool.connect(function(err, client, done){
      const query = client.query('SELECT * FROM clients where  username = $1', [clientId]);
      query.on('row', (row) => {
        callback(null, row);
      });
      done(err);
    });
  }
  pool.connect(function(err, client, done){
    const query1 = client.query('SELECT * FROM clients where  username = $1 and password = $2', [clientId,clientSecret]);
      query1.on('row', (row) => {
        callback(null, row);
      });
  done(err);
  });
  // pool.end();
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
var authorizedClientIds = ['clientKey'];


model.grantTypeAllowed = function (clientId, grantType, callback) {
  console.log("grantTypeAllowed");
  if (grantType === 'password') {
    return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
  }

  callback(false, true);
};

model.saveAccessToken = function (token, clientId, expires, userId, callback) {
  console.log("saveAccessToken");
  pool.connect(function(err, client, done){
    client.query('insert into access_tokens(accesstoken, userId, expires, clientId) values($1,$2,$3,$4)',[token,userId,expires,clientId],callback);
    // query.on('row', (row) => {
    //   callback(null, row);
    // });
  done(err);
  });
  // pool.end();
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
  console.log("getUser");
  var id = null;
  pool.connect(function(err, client, done){
    const query = client.query('select id from users where  username = $1 and password = $2', [username,password]);
    
    query.on('row', (row) => {
      id = row.id;
    });
    query.on('end', () => {
        callback(null, id);
    });
    done(err);
  });
  // pool.end();
};

/*
 * Required to support refreshToken grant type
 */
model.saveRefreshToken = function (token, clientId, expires, userId, callback) {
console.log("saveRefreshToken");
  pool.connect(function(err, client, done){
    client.query('insert into refresh_tokens(refreshToken, userId, expires, clientId) values($1,$2,$3,$4)',[token,userId,expires,clientId],callback);
  //   query.on('row', (row) => {
  //       callback(null, row);
  // });
  done(err);
  });
  // pool.end();
};

model.getRefreshToken = function (refreshToken, callback) {
console.log("getRefreshToken");
  pool.connect(function(err, client, done){
    const query = client.query('SELECT * FROM refresh_tokens where  refreshtoken = $1', [refreshToken]);
    query.on('row', (row) => {
        callback(null, row);
    });
  done(err);
  });
  // pool.end();
};