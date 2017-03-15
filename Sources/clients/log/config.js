/**
 * RabbitHost properties
 */
var os = require('os');

exports.rabbitConfigs = {
  host: 'localhost',
  port: 5672,
  queueName: 'logQueue',
  login: 'dd',
  password: 'dd'
};

/**
 * Log Levels Allowed
 * Highest value used for more critical levels.
 */
exports.logLevels = {
  ERROR: 5,
  WARN: 4,
  INFO: 3,
  DEBUG: 2,
  TRACE: 1
};

/**
 * Send Logs to console
 */
exports.consoleLogging = true;

/**
 * Testing properties
 */
exports.testing = {
  mode: false,
  string: "Testing Mode Frontend"
};

/**
 * Debug Options
 *
 * debugModeEnabled : boolean expressing if debug mode is enabled or not
 * debugLevel : minimum log level allowed to be sent in debug mode
 * nonDebugLevel : minimum log level allowed to be sent in non debug mode
 */
exports.debugOptions = {
  debugModeEnabled: true,
  debugLevel: 'TRACE',
  nonDebugLevel: 'ERROR'
};

/**
 * Uncaught Exceptions
 * This property indicates if LogClient must handle uncaught exceptions or not
 */
exports.uncaughtExceptions = true;

/**
 * Name of the machine where this server is running
 */
exports.machineName = os.hostname();

/**
 * Name of project
 */
exports.projectName = "SMALL V2 Frontend App";
