"use strict";

/*
* Database Service: reponsible to connect to mongodb and contains functions to write logs
*/

var ConfigurationService = require('./ConfigurationService.js'),
  mongoose = require('mongoose');

class DatabaseService {

  constructor() {
    this.newLog = mongoose.Schema({
      level: String,
      timestamp: String,
      machineName: String,
      projectName: String,
      category: String,
      message: String,
      optionalData: String
    });

    //connect to Database
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
  }

  InitConnection(onConnected) {
    mongoose.connect('mongodb://' + ConfigurationService.GetMongoConfigs().host + '/' + ConfigurationService.GetMongoConfigs().databaseName);
    mongoose.connection.once('open', function() {
      //Connected
      console.log("Connected to Database");

      if(onConnected){
        onConnected();
      }
    });
  }

//writes logs directly to mongodb, being validated based through the schema 
  WriteLog(msg) {
    var WriteLog = mongoose.model('Log', this.newLog);
    var msgStringObj = JSON.parse(msg.content.toString());
    var testLog = new WriteLog({
      level: msgStringObj.level,
      timestamp: msgStringObj.timestamp,
      machineName: msgStringObj.machineName,
      projectName: msgStringObj.projectName,
      category: msgStringObj.category,
      message: msgStringObj.message,
      optionalData: msgStringObj.optionalData
    });
    testLog.save(function(err /*,data*/ ) {
      if (err) {
        console.log(err);
      }
    });
  }
}

module.exports = new DatabaseService();
