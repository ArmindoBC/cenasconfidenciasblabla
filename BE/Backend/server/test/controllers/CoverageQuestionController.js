"use strict";

/**
 *  Coverage Question controller test: reponsible to test requests to the coverages questions
 */

var http_request = require('../request.js'),
  utils = require("../utils.js"),
  collectionName = 'Testing Coverage Question -',
  filename;
//test get all questions
function Test_GetAll_Sucess() {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/coveragequestion',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of coverage questions
    var data = JSON.parse(result.data);
    var intro = collectionName + " Test_GetAll_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate type of array
    utils.validate(filename, intro + "Array?", true, (data instanceof Array));
  });
}
//test get coverage by id, in this test must be retrieved a coverage question
function Test_GetByID_Sucess(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/coveragequestion?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of coverage questions with a single coverage question
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 1, data_array.length);
  });
}
//test get coverage by id, in this test the retrieve will fail
function Test_GetByID_Failure(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/coveragequestion?id=' + id,
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
  Test_GetByID_Sucess("000000000000000000000003");
  Test_GetByID_Failure("000000000000000000000001");
};
