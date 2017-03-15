'use strict';
var DatabaseService = require('./services/DatabaseService.js');
var TestService = require('./services/TestService.js');

//Start the test suite
DatabaseService.InitConnection(function(){
  TestService.RunAllTests();
});
