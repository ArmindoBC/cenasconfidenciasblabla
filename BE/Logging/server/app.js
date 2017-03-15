"use strict";
var ReceiverService = require('./services/ReceiverService.js');

//Start the server
ReceiverService.ConnectToDatabase(function(){
  ReceiverService.StartListening();
});
