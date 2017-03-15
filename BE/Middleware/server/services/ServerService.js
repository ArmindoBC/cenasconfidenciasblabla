/**
 *
 * Server Initiation script, in this file is included the needed libraries and the required files
 *
 */

"use strict";

var Express = require('express'),
  FalcorExpress = require('falcor-express'),
  bodyParser = require('body-parser'),
  LogsRouter = require('../routers/LogsRouter'),
  AuthRouter = require('../routers/AuthRouter'),
  InsuranceRouter = require('../routers/InsuranceRouter'),
  ConfigurationService = require('../services/ConfigurationService.js'),
  LogClient = require('../clients/log');

class ServerService {

  constructor() {}

  Initialize() {
    this.app = Express();
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));

    //cross domain authorization
    this.app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Credentials', true);
        for(var i=0;i< ConfigurationService.GetFrontendDomainAddress().length; i++){
            var origin = ConfigurationService.GetFrontendDomainAddress()[i];
            if(req.headers.origin && req.headers.origin.indexOf(origin) > -1){
                res.header('Access-Control-Allow-Origin', req.headers.origin);
            }
        }
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Headers", "Authorization");
        next();
    });

    this.app.use('/model.json', FalcorExpress.dataSourceRoute((req/*, res*/) => {
      return new InsuranceRouter(req.headers.authorization);
    }));

    this.app.use(ConfigurationService.GetLogsPath(), FalcorExpress.dataSourceRoute((/*req, res*/) => {
      return new LogsRouter();
    }));

    this.app.use(ConfigurationService.GetAuthPath(), FalcorExpress.dataSourceRoute((req/*, res*/) => {
      return new AuthRouter(req.headers.authorization);
    }));

    this.app.use('*', (req, res, next) => {
      LogClient.Log({
        level: "Trace",
        category: "request",
        message: "Request received on middleware"
      });
      next();
    });

    //Uncomment for testing if Falcor Router is Working
    this.app.use(Express.static(__dirname + '/../public'));
  }

  Start(){
    LogClient.Log({
      level: "INFO",
      category: "server status",
      message: "Starting middleware orchestrator"
    });

    if (ConfigurationService.IsHTTPModeEnabled()) {
      var http = require('http');
      this.app.httpServer = http.createServer(this.app);
      this.app.httpServer.listen(ConfigurationService.GetMiddlewareConfigs().httpPort, function() {
        LogClient.Log({
          level: "INFO",
          category: "server status",
          message: `HTTP Listening for connections on ${ConfigurationService.GetMiddlewareConfigs().httpPort}...`
        });
      });
    }

    if (ConfigurationService.IsHTTPSModeEnabled()) {
      var fs = require('fs'),
        https = require('https');
      this.app.httpsServer = https.createServer({
        key: fs.readFileSync(ConfigurationService.GetCertKeyPath()),
        cert: fs.readFileSync(ConfigurationService.GetCertPath())
      }, this.app);
      this.app.httpsServer.listen(ConfigurationService.GetMiddlewareConfigs().httpsPort, function() {
        LogClient.Log({
          level: "INFO",
          category: "server status",
          message: `HTTPS Listening for connections on ${ConfigurationService.GetMiddlewareConfigs().httpsPort}...`
        });
      });
    }
  }
}
module.exports = new ServerService();
