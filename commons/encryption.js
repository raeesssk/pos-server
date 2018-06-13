var model = module.exports;

const crypto = require('crypto');
const algorithm = 'sha256';
const key = '$----someSecretHash----$';
var urlAlgorithm = 'aes-256-ctr';
var urlPassword = 'd6F3Efeq';


model.hash = function (text) {

    return crypto.createHash(algorithm, key).update(text).digest('hex');
}

model.encrypt = function (text){
    var cipher = crypto.createCipher(urlAlgorithm,urlPassword)
    var crypted = cipher.update(text,'utf8','hex')
    crypted += cipher.final('hex');
    return crypted;
}

model.decrypt = function (text){

    var decipher = crypto.createDecipher(urlAlgorithm,urlPassword)
    var dec = decipher.update(text,'hex','utf8')
    dec += decipher.final('utf8');
    return dec;
}