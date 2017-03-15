/**
 * UMS config module
 */
'use strict';

var umsConfigs = require('./config').umsConfigs,
request = require('request-promise');

var options = {
    uri: `${umsConfigs.host}:${umsConfigs.port}`,
    json: true
};

/**
 * UMS Client to Authenticate, social login, signup and login with local account
 */

class AuthClient {
    constructor() {}
    /**
     * Social login with facebook, google and linkedin
     * @param: provider: is the provider of the login details
     * @param: userData: data for the user
     */
    SocialLogin(provider, userData){
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
    /**
     * Simple register for the user
     * @param: userData
     */
    Signup(userData){
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
    /**
     * Login to the UMS
     * @param: userData: data given to the user login
     */
    Login(userData){
        return request({
            uri: `${options.uri}/api/login/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        })
    }
    LoginAD(userData){
        return request({
            uri: `${options.uri}/api/login-ad/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        });
    }
    /**
     * UMS authorize method to see if the user token is allowed
     * @param: authorizationData
     */
    Authorize(authorizationData){
        return request({
            uri: `${options.uri}/api/authorize/`,
            json: options.json,
            method: 'POST',
            body: {
                groups : authorizationData.groups
            },
            headers: {
                'Authorization': `Bearer ${authorizationData.token}`
            }
        })
        .then((data) => {
            return data;
        });
    }
    /**
     * UMS logout method
     * @param: sessionToken
     */
    Logout(sessionToken){
        return request({
            uri: `${options.uri}/api/logout/`,
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
    /**
     * Returns the current user
     */
    CurrentUser(sessionToken){
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
