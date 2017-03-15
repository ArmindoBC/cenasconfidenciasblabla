"use strict";
var http = require('http');

//make a request to an application
exports.request = function(options) {
  return new Promise((resolve) => {
    var req = http.request(options, function(res) {
      var str = '';
      res.on('data', function(chunk) {
        str += chunk;
      });
      res.on('end', function() {
        res.data = str;
        resolve(res);
      });
    });

    req.on('error', function(e) {
      console.error('problem with request: ' + e.message);
    });
    req.end();
  });
};

//make a post to an application with data
exports.post = function(options, data) {
  return new Promise((resolve) => {
    var req = http.request(options, function(res) {
      var str = '';
      res.on('data', function(chunk) {
        str += chunk;
      });
      res.on('end', function() {
        res.data = str;
        resolve(res);
      });
    });

    req.on('error', function(e) {
      console.error('problem with request: ' + e.message);
    });
    req.write(data);
    req.end();
  });
};
