"use strict";

/*
* Receiver Service: Rabbit confirations loader and initialization
*/

var ConfigurationService = require('./ConfigurationService.js'),
  DatabaseService = require('./DatabaseService.js'),
  amqp = require('amqplib/callback_api');

class ReceiverService {

  constructor() {}

  ConnectToDatabase(onConnected) {
    DatabaseService.InitConnection(onConnected);
  }

  StartListening() {
    amqp.connect({
      username: ConfigurationService.GetRabbitConfigs().login,
      password: ConfigurationService.GetRabbitConfigs().password,
      hostname: ConfigurationService.GetRabbitConfigs().host,
      port: ConfigurationService.GetRabbitConfigs().port
    }, function(err, conn) {
      if (err) {
        console.log("Could not connect to RabbitMQ");
        process.exit(1);
      } else {
        //On Connection Ok, create Socket Channel
        conn.createChannel(function(err, ch) {
          var q = 'logQueue';
          ch.assertQueue(q, {
            durable: false
          });
          ch.consume(q, function(msg) {
            //For each message on queue, log it
            DatabaseService.WriteLog(msg);
          }, {
            noAck: true //Don't care about aknowledge it
          });
        });
      }
    });
  }

}
module.exports = new ReceiverService();
