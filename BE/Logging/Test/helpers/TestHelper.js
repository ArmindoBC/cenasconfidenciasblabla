"use strict";

/*
* Test Helper: contains functions used to build the log saved to the file and the db
*/

var fs = require("fs");

class TestHelper {

  constructor() {
    this.timestamp = new Date().toISOString();
    this.date = new Date(this.timestamp);
    this.fileName = this.CreateFileName();
  }

  CreateFileName() {
    var day = 1;
    //date.getDate();
    if (day.toString().length === 1) {
      day = "0" + day;
    }
    var month = this.date.getMonth() + 1;
    if (month.toString().length === 1) {
      month = "0" + month;
    }
    var year = this.date.getFullYear();
    var fullDate = "" + day + month + year;
    var hour = this.date.getHours();
    if (hour.toString().length === 1) {
      hour = "0" + hour;
    }
    var minutes = this.date.getMinutes();
    if (minutes.toString().length === 1) {
      minutes = "0" + minutes;
    }
    var fullHour = "" + hour + minutes;
    return "backend_testing_" + fullDate + "_" + fullHour;
  }

  WriteandPrintResult(result) {
    fs.appendFile("./Logs/" + this.fileName + ".txt", result + "\n", function(err) {
      if (err) {
        return console.log(err);
      }

      console.log(result);
    });
  }

  CreateLogsFile() {
    var createStream = fs.createWriteStream("./Logs/" + this.fileName + ".txt");
    createStream.end();

    fs.appendFile("./Logs/" + this.fileName + ".txt", "-----" + this.date + "-----" + "\n", function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }

}
module.exports = new TestHelper();
