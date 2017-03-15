/**
 *
 * UMS client for middleware
 *
 */


 'use strict';

//variables initialization and libraries inclusion
var backendHost = require('../../services/ConfigurationService').GetBackendHostAddress(),
request = require('request-promise');

var options = {
    uri: backendHost,
    json: true
};

class AuthClient {
    constructor() {}

    //social login - provides log in via facebook, linkedin and twitter
    SocialLogin(provider, userData){
        return request({
            uri: `${options.uri}/auth/social-login/${provider}/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        })
    }
    //Simple signup, must be sent all the parameters
    Signup(userData){
        return request({
            uri: `${options.uri}/auth/signup/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        })
    }
    //simple login without social
    Login(userData){
        return request({
            uri: `${options.uri}/auth/login/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        })
    }
    //login to the remote machine
    LoginAD(userData){
        return request({
            uri: `${options.uri}/auth/login-ad/`,
            json: options.json,
            method: 'POST',
            body: userData
        })
        .then((data) => {
            return data;
        })
    }
    //groups authorization method
    Authorize(authorizationData){
        return request({
            uri: `${options.uri}/auth/authorize/`,
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
        })
    }
    //method to successfully log off from the UMS
    Logout(sessionToken){
        return request({
            uri: `${options.uri}/auth/logout/`,
            json: options.json,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        })
        .then((data) => {
            return data;
        })
    }
    // This method  returns the current user
    CurrentUser(sessionToken){
        return request({
            uri: `${options.uri}/auth/current-user/`,
            json: options.json,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        })
        .then((data) => {
            return data;
        })
    }
}

module.exports = new AuthClient();
