"use strict";
var fs = require('fs'),
  timestamp = new Date().toISOString(),
  date = new Date(timestamp);

//validate the results of a test, receiving 2 values: the result of the test and what is expected
exports.validate = function(filename_test, param, expected, received) {
  var result = param + " expected:" + expected + " received:" + received;
  if (expected === received) {
    result = result + " ... PASSED";
  } else {
    result = result + " ... FAILED";
  }

  this.WriteandPrintResult(filename_test, result);
};

//Append in a file the result of the test, and show it in the console
exports.WriteandPrintResult = function(filename, result) {

  console.log(result);


  fs.appendFile(filename, result + '\n', function(err) {
    if (err) {
      return console.error(err);
    }
  });
};

//create File name in the format - backend_testing_<date>_<hour>
function CreateFileName() {

  var day = date.getDate();

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

//create the header of the test file
exports.CreateLogsFile = function() {
  var fileName = CreateFileName();

  var createStream = fs.createWriteStream('./Logs/' + fileName + '.txt');
  createStream.end();

  fs.appendFile("./Logs/" + fileName + ".txt", '-----' + date + '-----' + '\n', function(err) {
    if (err) {
      return console.error(err);
    }
  });

  var path = './Logs/' + fileName + '.txt';
  return path;
};
