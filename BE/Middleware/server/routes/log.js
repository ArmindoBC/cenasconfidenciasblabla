/**
 *
 * Routes for the logging system
 *
 */


'use strict';
var jsong = require('falcor-json-graph'),
  logClient = require('../clients/log');

module.exports = [{
  route: "log.add",
  call: function(callpath, args) {
    let logData = args[0];
    return logClient.LogFromFalcor(logData)
      .then((result) => {
        if (result) {
          return {
            path: ["log", "add"],
            value: jsong.atom("log added")
          };
        } else {
          return {
            path: ["log", "add"],
            value: jsong.error("log added")
          };
        }
      })
      .catch((err) => {
        //Error ading log. It only sends
        console.error(err)
        return {
          path: ["log", "error"],
          value: jsong.error(err)
        };
      });
  }
}];
