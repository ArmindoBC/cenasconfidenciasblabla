"use strict";
var http_request = require('../request.js'),
  utils = require("../utils.js"),
  collectionName = 'Testing Group Coverage -',
  filename;
/**
 * Group Coverage Controller: test group coverage 
 */

 //test get all group coverages, this test retrieves sucessfully 
function Test_GetAll_Sucess() {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/groupcoverage',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of group coverages
    var data = JSON.parse(result.data);
    var intro = collectionName + " Test_GetAll_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate type of array
    utils.validate(filename, intro + "Array?", true, (data instanceof Array));
  });
}
//test get group coverages by id, this test retrieves sucessfully 
function Test_GetByID_Sucess(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/groupcoverage?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of group coverages with a single group coverage
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 1, data_array.length);
  });
}

//test get group coverages by id, this test fails
function Test_GetByID_Failure(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/groupcoverage?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 404 and a Not Found error message
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Failure - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 0, data_array.length);
  });
}

exports.startTest = function(test_filename) {
  filename = test_filename;
  Test_GetAll_Sucess();
  Test_GetByID_Sucess("000000000000000000000001");
  Test_GetByID_Failure("000000000000000000000002");
};