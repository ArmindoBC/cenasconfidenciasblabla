'use strict';

var tcpp = require('tcp-ping');
var configs = require('./configs/config');
var umsServerTests = require('./test_cases/umsServerTests')(configs, configs.UMSServerConfigs, configs.testingDataBackend, 'Backend');
var backendServerTests = require('./test_cases/umsServerTests')(configs, configs.BackEndConfigs, configs.testingDataUMS, 'UMS');

var helper = require('./helpers/file')
var async = require('async-q');

helper.CreateLogsFile();

//========= Applications Running Tests

/*
    It tests if the User Management System server is running
*/
function TestUMSServerConnection(){
    var deferred = Promise.defer();
    var testData = {
        id: `#${++helper.testCounter}`,
        title: 'Testing UMS Server',
        description: 'Success test: server is running...',
        input:{
            host: configs.UMSServerConfigs.host,
            port: configs.UMSServerConfigs.port,
        }
    };
    tcpp.probe(testData.input.host, testData.input.port, function(err, available){
        if(err){
            testData.output = err;
            testData.result = 'FAILED';
        }
        else{
            testData.output = available;
            if(available){
                testData.result = 'PASSED';
            }
            else{
                testData.result = 'FAILED';
            }
        }
        helper.PrintDetailedResult(testData);
        deferred.resolve()
    })
    return deferred.promise;
};

/*
    It tests if User Management System database is running
*/
function TestUMSDatabaseConnection(){
    var deferred = Promise.defer();
    var testData = {
        id: `#${++helper.testCounter}`,
        title: 'Testing UMS database',
        description: 'Success test: database is running...',
        input:{
            host: configs.mongoConfigsUMS.host,
            port: configs.mongoConfigsUMS.port,
        }
    };
    tcpp.probe(testData.input.host, testData.input.port, function(err, available){
        if(err){
            testData.output = err;
            testData.result = 'FAILED';
        }
        else{
            testData.output = available;
            if(available){
                testData.result = 'PASSED';
            }
            else{
                testData.result = 'FAILED';
            }
        }
        helper.PrintDetailedResult(testData);
        deferred.resolve();
    })
    return deferred.promise;
};

/*
    It tests if Backend server is running
*/
function TestBackendConnection(){
    var deferred = Promise.defer();
    var testData = {
        id: `#${++helper.testCounter}`,
        title: 'Testing Backend Server',
        description: 'Success test: server is running...',
        input:{
            host: configs.BackEndConfigs.host,
            port: configs.BackEndConfigs.port,
        }
    };
    tcpp.probe(testData.input.host, testData.input.port, function(err, available){
        if(err){
            testData.output = err;
            testData.result = 'FAILED';
        }
        else{
            testData.output = available;
            if(available){
                testData.result = 'PASSED';
            }
            else{
                testData.result = 'FAILED';
            }
        }
        helper.PrintDetailedResult(testData);
        deferred.resolve();
    });
    return deferred.promise;
};

/*
    It tests if Middleware server is running
*/
function TestMiddlewareConnection(){
    var deferred = Promise.defer();
    var testData = {
        id: `#${++helper.testCounter}`,
        title: 'Testing Middleware Server',
        description: 'Success test: server is running...',
        input:{
            host: configs.MiddlewareConfigs.host,
            port: configs.MiddlewareConfigs.port,
        }
    };
    tcpp.probe(testData.input.host, testData.input.port, function(err, available){
        if(err){
            testData.output = err;
            testData.result = 'FAILED';
        }
        else{
            testData.output = available;
            if(available){
                testData.result = 'PASSED';
            }
            else{
                testData.result = 'FAILED';
            }
        }
        helper.PrintDetailedResult(testData);
        deferred.resolve();
    });
    return deferred.promise;
};

async.series([

    TestUMSServerConnection,
    TestUMSDatabaseConnection,
    TestBackendConnection,
    TestMiddlewareConnection,
    umsServerTests.TestLocalSignUpSuccess,
    umsServerTests.TestLocalSignUpSuccess2,
    umsServerTests.TestLocalSignUpFailure1,
    umsServerTests.TestLocalSignUpFailure2,
    umsServerTests.TestLocalLoginSuccess,
    umsServerTests.TestLocalLoginSuccess2,
    umsServerTests.TestLocalLoginFailure,
    umsServerTests.TestLocalLoginFailure2,
    umsServerTests.TestLogoutSuccess,
    umsServerTests.TestLogoutFailure,
    umsServerTests.TestLogoutFailure2,
    umsServerTests.TestAuthorizationSuccess,
    umsServerTests.TestAuthorizationFailure,
    umsServerTests.TestAuthorizationFailure2,
    umsServerTests.TestAuthorizationFailure3,
    umsServerTests.TestCurrentUserSuccess1,
    umsServerTests.TestCurrentUserSuccess2,
    umsServerTests.TestCurrentUserFailure1,
    umsServerTests.TestCurrentUserFailure2,

    backendServerTests.TestLocalSignUpSuccess,
    backendServerTests.TestLocalSignUpSuccess2,
    backendServerTests.TestLocalSignUpFailure1,
    backendServerTests.TestLocalSignUpFailure2,
    backendServerTests.TestLocalLoginSuccess,
    backendServerTests.TestLocalLoginSuccess2,
    backendServerTests.TestLocalLoginFailure,
    backendServerTests.TestLocalLoginFailure2,
    backendServerTests.TestLogoutSuccess,
    backendServerTests.TestLogoutFailure,
    backendServerTests.TestLogoutFailure2,
    backendServerTests.TestAuthorizationSuccess,
    backendServerTests.TestAuthorizationFailure,
    backendServerTests.TestAuthorizationFailure2,
    backendServerTests.TestAuthorizationFailure3,
    backendServerTests.TestCurrentUserSuccess1,
    backendServerTests.TestCurrentUserSuccess2,
    backendServerTests.TestCurrentUserFailure1,
    backendServerTests.TestCurrentUserFailure2

]).then(() => {
    console.log(`-> ${helper.successTests} in ${helper.testCounter} tests PASSED`);
})
