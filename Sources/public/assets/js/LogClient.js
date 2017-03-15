/**
* File responsible for the LogClient handler, wich contains all the code needed to send the logs messages to FalcorRouter.
  This file defines a LogClient Class that will be available to frontend.
*/
var LogClient = (function(){
//   var configs = {
//     host: 'http://192.168.100.110',
//     port: 9002,
//     path: '/logs.json'
//   }

  var logLevels = {
     ERROR: 5,
     WARN: 4,
     INFO: 3,
     DEBUG: 2,
     TRACE: 1
  };

  /**
  * This is the constructor for the class LogClient. It can receive an options parameter, that contains information about the mode (debug or nondebug).
  * It also inciates some variables with default values in case of "options" paramenter being empty.
  */
  function LogClient(){
    this.model = new falcor.Model({
      source: new falcor.HttpDataSource(configurations.FalcorRouterConfigs.host + ":" + configurations.FalcorRouterConfigs.port + configurations.FalcorRouterConfigs.logsPath,
      {crossDomain: true})
    });
    this.machineName = configurations.machineName;
    this.projectName = configurations.projectName;
    this.debugModeEnabled = configurations.debugModeEnabled;
    this.nonDebugLevel = logLevels[configurations.nonDebugLevel.toUpperCase()];
    this.debugLevel = logLevels[configurations.debugLevel.toUpperCase()];
    this.consoleLogging = configurations.consoleLogging;
    this.testing = configurations.Testing;

  }
  /*function LogClient(configurations){
    console.log(configurations)
    this.model = new falcor.Model({
      source: new HttpDataSource(configurations.FalcorRouterConfigs.host+':'+configurations.FalcorRouterConfigs.port+configurations.FalcorRouterConfigs.path,
      {crossDomain: true})
    });
    this.machineName = configurations.machineName;
    this.projectName = configurations.projectName;
    this.debugModeEnabled = configurations.debugModeEnabled;
    this.nonDebugLevel = logLevels[configurations.nonDebugLevel.toUpperCase()];
    this.debugLevel = logLevels[configurations.debugLevel.toUpperCase()];

  }*/

  /**
  * This funcion is responsible to send the log message to the FalcorRouter through the route log.add.
  */
  LogClient.prototype.SendToFalcorRouter = function(message){
    return this.model.call(['log', 'add'], [message])
                  .then(function (response) {
                      return true;
                  })
                  .catch(function (error) {
                    console.log(error)
                    return false;
                  });
  }

  /**
  * This function cheks if the log is valid do send to FalcorRouter regarding its logLevel.
  */
  LogClient.prototype.LogLevelAllowed = function(level){
    var acceptedLevel = this.debugModeEnabled ? this.debugLevel :this.nonDebugLevel;

    return logLevels[level.toUpperCase()] >= acceptedLevel;
  }

  LogClient.prototype.CheckLog = function(log){
    return (log.timestamp && log.machineName && log.projectName && log.message && log.level && log.category);
  }

  LogClient.prototype.SendLog = function(log){
    log = log == undefined ? {} : log;

    log.timestamp = new Date().toISOString();
    log.machineName = this.machineName;
    log.projectName = this.projectName;
    /*if(this.testing.mode){
      log.optionalData = this.testing.string;
    }*/
    if(this.CheckLog(log) && this.LogLevelAllowed(log.level)){
      if(this.consoleLogging){
        console.log(log);
      }
      return this.SendToFalcorRouter(log);
    }
    else{
      return Promise.resolve(false);
    }

  }

  return LogClient;
})()
