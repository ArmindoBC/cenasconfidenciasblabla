"use strict";

/*
* Test Service: reponsible to run all tests for the loging system
*/


/*
* Includes for the libraries used for tests
*/
var tcpp = require('tcp-ping'),
  request = require('request-promise'),
  TestHelper = require('../helpers/TestHelper.js'),
  ConfigurationService = require('./ConfigurationService.js'),
  LogClientRouter = require('../clients/log/app.js'),
  DatabaseService = require('./DatabaseService.js');

class TestService {

  constructor() {}

  RunAllTests() {
    this.TestFalcorRouterConnection();
    this.TestMongoConnection();
    this.TestRabbitMQConnection();
    this.TestSendLogtoRabbitMQSucess();
    this.TestSendLogtoRabbitMQFailure1();
    this.TestSendLogtoRabbitMQFailure2();
    this.TestSendLogToFalcorRouterAndMongo();
    this.TestSendLogFromFrontEnd();
    this.TestSendLogFromBackEnd();
    this.TestSendLogFromMiddleware();
  }
/*
* This test checks if the Falcor router connection is established
*/
  TestFalcorRouterConnection() {
    var result = `Testing FalcorRouter running on port ${ConfigurationService.GetMiddlewareConfigs().port}...`;

    tcpp.probe(ConfigurationService.GetMiddlewareConfigs().host, ConfigurationService.GetMiddlewareConfigs().port, function(err, available) {
      if (available) {
        result = `${result} PASSED`;
      } else {
        result = `${result} FAILED`;
      }
      //console.log(result);
      TestHelper.WriteandPrintResult(result);
    });
  }
/*
* This test checks if the MongoDB connection is established
*/
  TestMongoConnection() {
    var result = `Testing MongoDB running on port ${ConfigurationService.GetMongoConfigs().port}...`;

    tcpp.probe(ConfigurationService.GetMongoConfigs().host, ConfigurationService.GetMongoConfigs().port, function(err, available) {
      if (available) {
        result = `${result} PASSED`;
      } else {
        result = `${result} FAILED`;
      }
      TestHelper.WriteandPrintResult(result);

    });
  }
/*
* This test checks if the Rabbit connection is established
*/
  TestRabbitMQConnection() {
    var result = `Testing RabbitMQ running on port ${ConfigurationService.GetRabbitConfigs().port}...`;

    tcpp.probe(ConfigurationService.GetRabbitConfigs().host, ConfigurationService.GetRabbitConfigs().port, function(err, available) {
      if (available) {
        result = `${result} PASSED`;
      } else {
        result = `${result} FAILED`;
      }
      TestHelper.WriteandPrintResult(result);
    });
  }
/*
* This test checks if the message is successfully sent to the Rabbit
*/
  TestSendLogtoRabbitMQSucess() {
    var result = `Testing FalcorRouter LogClient ... Method Log - Success test...`;
    var logData = {
      level: 'DEBUG',
      category: 'information',
      message: 'LogClient message from front-end to centralized logging system'
    };
    LogClientRouter.Log(logData)
      .then((response) => {
        if (response) {
          result = `${result} PASSED`;
          TestHelper.WriteandPrintResult(result);
        } else {
          result = `${result} FAILED`;
          TestHelper.WriteandPrintResult(result);
        }
      })
      .catch((err) => {
        console.log(err);
      });

  }
/*
* This test checks if the message is not successfully sent to the Rabbit
*/
  TestSendLogtoRabbitMQFailure1() {
    var result = `Testing FalcorRouter LogClient ... Method Log - Failure test...`;
    var logData = {
      category: 'information',
      message: 'LogClient message from front-end to centralized logging system'
    };
    LogClientRouter.Log(logData)
      .then((response) => {
        if (response) {
          result = `${result} FAILED`;
          TestHelper.WriteandPrintResult(result);
        } else {
          result = `${result} PASSED`;
          TestHelper.WriteandPrintResult(result);
        }
      })
      .catch((err) => {
        console.log(err);
      });

  }
/*
* This test checks if the message is not successfully sent to the Rabbit
*/
  TestSendLogtoRabbitMQFailure2() {
    var result = `Testing FalcorRouter LogClient with undefined Log ... Method Log - Failure test...`;
    LogClientRouter.Log()
      .then((response) => {
        if (response) {
          result = `${result} FAILED`;
          TestHelper.WriteandPrintResult(result);
        } else {
          result = `${result} PASSED`;
          TestHelper.WriteandPrintResult(result);
        }
      })
      .catch((err) => {
        console.log(err);
      });

  }
/*
* This test checks if the message is successfully sent to the Rabbit and then is written to mongo
*/
  TestSendLogToFalcorRouterAndMongo() {
    var result = `Testing the number of rows at DataBase after insert Data ... `;
    var intResult;
    var logData = {
      level: 'INFO',
      category: 'information',
      message: 'LogClient message from front-end to centralized logging system'
    };
    DatabaseService.count().then(function(c) {
        intResult = c;
        return LogClientRouter.Log(logData);
      })
      .then(( /*response*/ ) => {
        setTimeout(() => {
          return DatabaseService.count().then((c) => {
            if (c > intResult) {
              result = `${result} PASSED`;
              TestHelper.WriteandPrintResult(result);
            } else {
              result = `${result} FAILED`;
              TestHelper.WriteandPrintResult(result);
            }
          });
        }, 6000);
      });
  }
/*
* This test checks if the log is sucessfully sent from the frontend
*/
  TestSendLogFromFrontEnd() {
    var result = `Testing the number of rows at DataBase after load FrontEnd ... `;
    var intResult;
    DatabaseService.count({
        optionalData: ConfigurationService.GetTestingConfigs().stringFrontEnd
      }).then(function(c) {
        intResult = c;
        return request('http://' + ConfigurationService.GetFrontEndConfigs().host + ":" + ConfigurationService.GetFrontEndConfigs().port);
      })
      .then(function( /*htmlString*/ ) {
        //console.log(htmlString)
        setTimeout(() => {
          return DatabaseService.count({
            optionalData: ConfigurationService.GetTestingConfigs().stringFrontEnd
          }).then((c) => {
            if (c > intResult) {
              result = `${result} PASSED`;
              TestHelper.WriteandPrintResult(result);
            } else {
              result = `${result} FAILED`;
              TestHelper.WriteandPrintResult(result);
            }
          });
        }, 6000);
      })
      .catch(function(err) {
        console.log(err);
      });
  }
/*
* This test checks if the log is sucessfully sent from the backend
*/
  TestSendLogFromBackEnd() {
    var result = `Testing the number of rows at DataBase after load BackEnd ... `;
    var intResult;
    DatabaseService.count({
        optionalData: ConfigurationService.GetTestingConfigs().stringBackend
      }).then(function(c) {
        intResult = c;
        return request('http://' + ConfigurationService.GetBackEndConfigs().host + ":" + ConfigurationService.GetBackEndConfigs().port + '/coverage');
      })
      .then(function( /*htmlString*/ ) {
        //console.log(htmlString)
        setTimeout(() => {
          return DatabaseService.count({
            optionalData: ConfigurationService.GetTestingConfigs().stringBackend
          }).then((c) => {
            if (c > intResult) {
              result = `${result} PASSED`;
              TestHelper.WriteandPrintResult(result);
            } else {
              result = `${result} FAILED`;
              TestHelper.WriteandPrintResult(result);
            }
          });
        }, 6000);
      })
      .catch(function(err) {
        console.log(err);
      });
  }
/*
* This test checks if the log is sucessfully sent from the middleware
*/
  TestSendLogFromMiddleware() {
    var result = `Testing the number of rows at DataBase after load Middleware ... `;
    var intResult;
    DatabaseService.count({
        optionalData: ConfigurationService.GetTestingConfigs().stringMiddleware
      }).then(function(c) {
        intResult = c;
        return request('http://' + ConfigurationService.GetMiddlewareConfigs().host + ":" + ConfigurationService.GetMiddlewareConfigs().port);
      })
      .then(function( /*htmlString*/ ) {

      })
      .catch(function( /*err*/ ) {
        //It's supposed to enter in the catch statement because middleware is not serving any page at host:port/ and is returning a 404 NOT FOUND
        setTimeout(() => {
          return DatabaseService.count({
            optionalData: ConfigurationService.GetTestingConfigs().stringMiddleware
          }).then((c) => {
            if (c > intResult) {
              result = `${result} PASSED`;
              TestHelper.WriteandPrintResult(result);
            } else {
              result = `${result} FAILED`;
              TestHelper.WriteandPrintResult(result);
            }
          });
        }, 6000);
      });
  }

}
module.exports = new TestService();
