"use strict";

/**
 * User Controller: test user
 */

var http_request = require('../request.js'),
  utils = require("../utils.js"),
  collectionName = 'Testing User -',
  filename;

//test get all users
function Test_GetAll_Sucess() {
  console.log("Test_GetAll_Sucess()");
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/user',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of users
    var data = JSON.parse(result.data);
    var intro = collectionName + " Test_GetAll_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate type of array
    utils.validate(filename, intro + "Array?", true, (data instanceof Array));
  });
}

// test get a user by it's id
function Test_GetByID_Sucess(id) {
  console.log("Test_GetByID_Sucess()");
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/user?id=' + id,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  http_request.request(options).then((result) => {
    //expected 200 and an array of users with a single user
    var data_array = JSON.parse(result.data);
    var intro = collectionName + " Test_GetByID_Sucess - ";
    //validate status code
    utils.validate(filename, intro + "Status Code", 200, result.statusCode);
    //validate length of array
    utils.validate(filename, intro + "Size of array", 1, data_array.length);
  });
}

//test get a user by it's id, this test must fail
function Test_GetByID_Failure(id) {
  console.log("Test_GetByID_Failure()");
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/user?id=' + id,
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


//test register a user in the system
function Test_Post() {
  console.log("Test_Post()");
  var postData = JSON.stringify({
    name: 'António',
    photo: 'antonio.jpg',
    companyid: '000000000000000000000001'
  });
  var options = {
    hostname: 'localhost',
    port: '9003',
    path: '/user',
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
  Test_GetByID_Sucess("00000000000000000000001c");
  Test_GetByID_Failure("000000000000000000000001");
  Test_Post();
};
