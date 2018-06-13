var oauthserver = require('oauth2-server');

// OAuth2 Server
var oauth = oauthserver({
  model: require('./handler'), // See below for specification
  grants: ['password', 'refresh_token'],
  accessTokenLifetime : 86400,
  debug: true
});

module.exports = oauth;