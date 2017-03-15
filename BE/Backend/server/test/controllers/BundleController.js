"use strict";
var http_request = require('../request.js'),
  utils = require("../utils.js"),
  collectionName = 'Testing Bundle -',
  filename;
/**
 *  Bundle controller test: reponsible to test bundle controller
 */


 //Test to get all users
function Test_GetAll_Sucess() {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/bundle',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of coverage questions or empty array when the collection is empty
    var data = JSON.parse(result.data);
    var intro = collectionName + " Test_GetAll_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate type of array
    utils.validate(filename, intro + "Array?", true, (data instanceof Array));
  });
}

//test of an user retrieve by it's user id
function Test_GetByID_Sucess(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/bundle?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of coverage questions or empty array when the collection is empty
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 1, data_array.length);
  });
}

//test of an user retrive by it's id, this test must fail
function Test_GetByID_Failure(id) {
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/bundle?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 404 and an array of coverage questions or empty array when the collection is empty
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Failure - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 0, data_array.length);
  });
}
//Test ports
function Test_Post() {
  var postData = JSON.stringify({
    "total": 12,
    "datecreation": "12-12-2012",
    "userid": "000000000000000000000001",
    "coverageids": [
      "000000000000000000000002", "000000000000000000000005"
    ],
    "coveragequestionids": [
      "000000000000000000000003", "000000000000000000000004", "000000000000000000000007"
    ],
    "groupcoverageids": [
      "000000000000000000000001", "000000000000000000000012"
    ],
    "groupcoveragequestionids": [
      "000000000000000000000010", "000000000000000000000011"
    ]
  });
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/bundle',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.post(options, postData).then((result) => {
    //expected 200 and an array of coverage questions or empty array when the collection is empty
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_Post - ";
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    utils.validate(filename, intro + "typeof?", typeof data_array, "object");
  });
}

exports.startTest = function(test_filename) {
  filename = test_filename;
  Test_GetAll_Sucess();
  Test_GetByID_Sucess("00000000000000000000001e");
  Test_GetByID_Failure("000000000000000000000001");
  Test_Post();
};