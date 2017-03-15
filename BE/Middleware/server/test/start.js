/**
 *
 * Test Script to ensure that all parts of the middleware are working
 *
 */

'use strict';
var tcpp = require('tcp-ping');
var fs = require('fs');
var coverageService = require('../services/CoverageService');
var logClientBrowserConfigs = require('./config.js');

var timestamp = new Date().toISOString();
var date = new Date(timestamp);
var fileName = CreateFileName();

//function to print to the file the results of the tests
function WriteandPrintResult(result) {

  fs.appendFile("./Logs/" + fileName + ".txt", result + '\n', function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(result);
  });
}

//file name creation depending to the current date
function CreateFileName() {
  var day = 1;
  //date.getDate();
  if (day.toString().length === 1) {
    day = '0' + day;
  }
  var month = date.getMonth() + 1;
  if (month.toString().length === 1) {
    month = '0' + month;
  }
  var year = date.getFullYear();
  var fullDate = '' + day + month + year;
  var hour = date.getHours();
  if (hour.toString().length === 1) {
    hour = '0' + hour;
  }
  var minutes = date.getMinutes();
  if (minutes.toString().length === 1) {
    minutes = '0' + minutes;
  }
  var fullHour = '' + hour + minutes;
  return 'backend_testing_' + fullDate + '_' + fullHour;
}

(function CreateLogsFile() {
  var createStream = fs.createWriteStream('./Logs/' + fileName + '.txt');
  createStream.end();

  fs.appendFile("./Logs/" + fileName + ".txt", '-----' + date + '-----' + '\n', function(err) {
    if (err) {
      return console.log(err);
    }
  });
})();
//Test Falcor router connection
(function TestFalcorRouterConnection() {

  var result = `Testing FalcorRouter running on port ${logClientBrowserConfigs.routerConfigs.port}...`;

  tcpp.probe(logClientBrowserConfigs.routerConfigs.host, logClientBrowserConfigs.routerConfigs.port, function(err, available) {
    if (available) {
      result = `${result} PASSED`;
    } else {
      result = `${result} FAILED`;
    }
    WriteandPrintResult(result);
  });
})();
//test connection to the backend
(function TestBackendConnection() {

  var result = `Testing Backend running on port ${logClientBrowserConfigs.BackendConfigs.port}...`;

  tcpp.probe(logClientBrowserConfigs.BackendConfigs.host, logClientBrowserConfigs.BackendConfigs.port, function(err, available) {
    if (available) {
      result = `${result} PASSED`;
    } else {
      result = `${result} FAILED`;
    }
    WriteandPrintResult(result);
  });
})();
//test json from backend
(function TestJSONfromBackend() {
  var result = `Testing JSONFromBackend running on port ${logClientBrowserConfigs.BackendConfigs.port}...`;

  coverageService.getCoverageListByGroupCoverage().then((res) => {
    if (typeof res === 'object') {
      result = `${result} PASSED`;
    } else {
      result = `${result} FAILED`;
    }
    WriteandPrintResult(result);
  });
})();
