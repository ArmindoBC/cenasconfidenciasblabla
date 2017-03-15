'use strict';
var umsConfigs = require('./config').umsConfigs,
  request = require('request-promise');

var options = {
  uri: `${umsConfigs.host}:${umsConfigs.port}`,
  json: true
};

class AuthClient {
  constructor() {}

  SocialLogin(provider, userData) {
    return request({
        uri: `${options.uri}/api/login/${provider}/`,
        json: options.json,
        method: 'POST',
        body: userData
      })
      .then((data) => {
        return data;
      });
  }
  Signup(userData) {
    return request({
        uri: `${options.uri}/api/signup/`,
        json: options.json,
        method: 'POST',
        body: userData
      })
      .then((data) => {
        return data;
      });
  }
  Login(userData) {
    return request({
        uri: `${options.uri}/api/login/`,
        json: options.json,
        method: 'POST',
        body: userData
      })
      .then((data) => {
        return data;
      });
  }
  Authorize(authorizationData) {
    return request({
        uri: `${options.uri}/api/authorize/`,
        json: options.json,
        method: 'POST',
        body: {
          groups: authorizationData.groups
        },
        headers: {
          'Authorization': `Bearer ${authorizationData.token}`
        }
      })
      .then((data) => {
        return data;
      });
  }
  Logout(sessionToken) {
    return request({
        uri: `${options.uri}/api/external-logout/`,
        json: options.json,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      .then((data) => {
        return data;
      });
  }
  CurrentUser(sessionToken) {
    return request({
        uri: `${options.uri}/api/current-user/`,
        json: options.json,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })
      .then((data) => {
        return data;
      });
  }
}

module.exports = new AuthClient();
