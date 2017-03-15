'use strict';

var amqplib = require('amqplib'),
  logConfigs = require('./config'),
  rabbitConfigs = logConfigs.rabbitConfigs,
  debugOptions = logConfigs.debugOptions,
  logLevels = logConfigs.logLevels;

/**
 * Class used to manage all access to Log System.
 * Applications client will have access to a instance of this class to send their own logs
 */
class LogClient {
  /**
   * It constructs a new LogClient object.
   * It attends to default options but their can be overriden by options passed as arguments
   * such: debugModeEnable, debugLevel and nonDebugLevel
   *
   * If configs indicates that uncaught exceptions must be handled an handler for that are initialized.
   *
   * @param: options: object with debugModeEnabled, debugLevel and nonDebugLevel
   */
  constructor() {
    this.debug = debugOptions.debugModeEnabled;
    this.debugLevel = debugOptions.debugLevel;
    this.nonDebugLevel = debugOptions.nonDebugLevel;

    this.machineName = logConfigs.machineName;
    this.projectName = logConfigs.projectName;

    if (logConfigs.uncaughtExceptions) {
      this.OnUncaughtException();
    }
  }

  /**
   * Make possible to manage LogClient class as a singleton
   */
  static GetInstance() {
    if (this.instance === null) {
      this.instance = new LogClient();
    }
    return this.instance;
  }

  /**
   * Manage connection with rabbit service
   * This method allows to connect with service attending properties in rabbitConfigs
   *
   * When some error accurs on connection or connection is closed, this method allows retry to create a new connection
   */
  Connect() {
    if (this.rabbitConnection === undefined) {
      return amqplib.connect({
          username: rabbitConfigs.login,
          password: rabbitConfigs.password,
          hostname: rabbitConfigs.host,
          port: rabbitConfigs.port
        })
        .then((connection) => {
          this.rabbitConnection = connection;

          this.rabbitConnection.on('close', (err) => {
            console.error(err);
            this.rabbitConnection = undefined;
            this.logChannel = undefined;
            return this.Connect();
          });
          this.rabbitConnection.on('error', (err) => {
            console.error(err);
            this.rabbitConnection = undefined;
            this.logChannel = undefined;
            return this.Connect();
          });

          return this.CreateChannel();
        });
    } else {
      return this.CreateChannel();
    }
  }

  /**
   * Manage connection with rabbit service
   * This method allows to create a new channel to send logs to service
   *
   * When some error accurs on channel or it is closed, this method allows retry to create a new channel
   */
  CreateChannel() {
    if (this.logChannel === undefined) {
      return this.rabbitConnection.createChannel()
        .then((channel) => {
          this.logChannel = channel;

          this.logChannel.on('close', (err) => {
            console.error(err);
            return this.rabbitConnection.createChannel();
          });
          this.logChannel.on('error', (err) => {
            console.error(err);
            this.logChannel = null;
            return this.rabbitConnection.createChannel();
          });
          return this.logChannel;
        });
    } else {
      return Promise.resolve(this.logChannel);
    }
  }

  /**
   * Method used to send logs to rabbit
   * @param logData : log data that must includes level, category, message and optionalData
   */

  Log(logData) {
    logData = logData === undefined ? {} : logData;

    var logMessage = {
      level: logData.level,
      timestamp: new Date().toISOString(),
      machineName: this.machineName,
      projectName: this.projectName,
      category: logData.category,
      message: logData.message,
      optionalData: logData.optionalData
    };
    if (this.CheckLog(logMessage) && this.LogLevelAllowed(logMessage.level)) {
      if (logConfigs.testing.mode) {
        logMessage.optionalData = logConfigs.testing.string;
      }
      if (logConfigs.consoleLogging) {
        console.log(logMessage);
      }
      return this.Connect()
        .then(() => {
          this.logChannel.assertQueue(rabbitConfigs.queueName, {
            durable: false
          });
          this.logChannel.sendToQueue(rabbitConfigs.queueName, new Buffer(JSON.stringify(logMessage)));
          return true;
        })
        .catch((err) => {
          console.error(err);
          return false;
        });
    }
    return Promise.resolve(false);
  }

  /**
   * Method used to send logs to rabbit
   * Data like timestamp, machineName and projectName are accepted from received log data
   */
  LogFromFalcor(logData) {
    logData = logData === undefined ? {} : logData;
    var logMessage = {
      level: logData.level,
      timestamp: logData.timestamp,
      machineName: logData.machineName,
      projectName: logData.projectName,
      category: logData.category,
      message: logData.message,
      optionalData: logData.optionalData
    };
    if (this.CheckLog(logMessage) && this.LogLevelAllowed(logMessage.level)) {
      return this.Connect()
        .then(() => {
          this.logChannel.assertQueue(rabbitConfigs.queueName, {
            durable: false
          });
          this.logChannel.sendToQueue(rabbitConfigs.queueName, new Buffer(JSON.stringify(logMessage)));
          return true;
        })
        .catch((err) => {
          console.error(err);
          return false;
        });
    }
    return Promise.resolve(false);
  }

  /**
   * Validates log data according to all allowed properties and its type
   * @return {boolean}
   */
  CheckLog(logData) {
    if (!logData.level || typeof logData.level !== 'string') {
      return false;
    }
    if (!logData.timestamp || typeof logData.timestamp !== 'string') {
      return false;
    }
    if (!logData.machineName || typeof logData.machineName !== 'string') {
      return false;
    }
    if (!logData.projectName || typeof logData.projectName !== 'string') {
      return false;
    }
    if (!logData.category || typeof logData.category !== 'string') {
      return false;
    }
    if (!logData.message || typeof logData.message !== 'string') {
      return false;
    }
    return true;

  }

  /**
   * Method used to check if log must be send to rabbit according to its level
   * Properties like debugModeEnabled, debugLevel and nonDebugLevel are used to check which levels are allowed
   * @param logLevel
   * @returns {boolean}
   */
  LogLevelAllowed(logLevel) {
    var acceptedLevel = this.debug ? this.debugLevel : this.nonDebugLevel;
    return logLevels[logLevel.toUpperCase()] >= logLevels[acceptedLevel.toUpperCase()];

  }

  /**
   * Method used to process uncaught exceptions.
   * When some exceptions are caught in this handler, log client will send an ERROR log tog server
   */
  OnUncaughtException() {
    process.on('uncaughtException', (err) => {
      this.Log({
        level: 'ERROR',
        category: 'UncaughtException',
        message: err.message
      });
    });
  }
}

LogClient.instance = null;

module.exports = LogClient.GetInstance();
