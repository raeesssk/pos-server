var config = {
  user: 'postgres', //env var: PGUSER 
  database: 'pos', //env var: PGDATABASE 
  password: 'zakrshkh', //env var: PGPASSWORD 
  host: '127.0.0.1', // Server hosting the postgres database 
  port: 5432, //env var: PGPORT 
  max: 10, // max number of clients in the pool 
  idleTimeoutMillis: 60000, // how long a client is allowed to remain idle before being closed 
};

module.exports = config;

//  password: 'zakrshkh', //env var: PGPASSWORD 
//   host: '127.0.0.1', // Server hosting the postgres database 
//   port: 5432, //env var: PGPORT 
//   max: 10, // max number of clients in the pool 
//   idleTimeoutMillis: 60000, // how long a client is allowed to remain idle before being closed 
// };
