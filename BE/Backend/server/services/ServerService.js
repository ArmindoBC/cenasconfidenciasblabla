"use strict";
var Hapi = require('hapi'),
  Good = require('good'),
  Inert = require('inert'),
  HapiMongoDB = require('hapi-mongodb'),
  Vision = require('vision'),
  HapiSwagger = require('hapi-swagger'),
  Blipp = require('blipp'),
  Pack = require('../package'),
  ConfigurationService = require('./ConfigurationService.js');
/**
 * Server Service: Initialize the HTTP server and the HTTPS server.
 */
class ServerService {

  constructor() {}

  Initialize(){
    this.InitializeServer();
    this.InitializeDatabaseConnection();
    this.InitializeStaticPagesServer();
    this.InitializeDocumentation();
    this.InitializeRoutes();
  }

  InitializeServer() {
    if (ConfigurationService.IsHttpEnabled()) {
      //Config HTTP Server
      console.log('Initializing Server (HTTP)...');
      var httpServerOptions = {
        port: ConfigurationService.GetHttpServerPort()
      };
      this.httpServer = new Hapi.Server();
      this.httpServer.connection(httpServerOptions);
    }

    if (ConfigurationService.IsHttpsEnabled()) {
      console.log('Initializing Server (HTTPS)...');
      var fs = require('fs');
      var httpsServerOptions = {
        port: ConfigurationService.GetHttpsServerPort(),
        tls: {
          key: fs.readFileSync(ConfigurationService.GetHttpsKeyPath()),
          cert: fs.readFileSync(ConfigurationService.GetHttpsCertPath())
        }
      };

      this.httpsServer = new Hapi.Server();
      this.httpsServer.connection(httpsServerOptions);
    }

    //Register Good
    console.log('Registering Good...');
    var goodOps = {
      register: Good,
      options: {
        reporters: [{
          reporter: require('good-console'),
          events: {
            response: '*',
            log: '*'
          }
        }]
      }
    };
    var GoodErrorFunction = function(err) {
      if (err) {
        throw err; // something bad happened loading the plugin
      }
    };
    if (ConfigurationService.IsHttpEnabled()) {
      this.httpServer.register(goodOps, GoodErrorFunction);
    }
    if (ConfigurationService.IsHttpsEnabled()) {
      this.httpsServer.register(goodOps, GoodErrorFunction);
    }
    console.log("Good Ok");
    console.log("Server Initialized!");
  }
  //Static pages server boot
  InitializeStaticPagesServer() {
    //Inert
    console.log("Init Inert...");

    //Define Routes
    var GetIndexRoute = {
      method: 'GET',
      path: '/',
      handler: function(request, reply) {
        reply.file('./index.html');
      }
    };
    var GetParameterRoute = {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: '.',
          redirectToSlash: true,
          index: true
        }
      }
    };

    //Register
    if (ConfigurationService.IsHttpEnabled()) {
      this.httpServer.register(Inert, (err) => {
        if (err) {
          throw err;
        }

        this.httpServer.route(GetIndexRoute);
        this.httpServer.route(GetParameterRoute);
      });
    }

    if (ConfigurationService.IsHttpsEnabled()) {
      this.httpsServer.register(Inert, (err) => {
        if (err) {
          throw err;
        }

        this.httpsServer.route(GetIndexRoute);
        this.httpsServer.route(GetParameterRoute);
      });
    }

    console.log("Inert ok");
    console.log("StaticPagesServer Initialized!");
  }
  //Documentation Initialization
  InitializeDocumentation() {
    //Configure Swagger
    var swaggerOptions = {
      apiVersion: Pack.version
    };

    var HapiSwaggerOps = [
      Vision,
      Blipp, {
        register: HapiSwagger,
        options: swaggerOptions
      }
    ];
    var InitSwaggerError = function(err) {
      if (err) {
        throw err;
      }
    };

    if (ConfigurationService.IsHttpEnabled()) {
      this.httpServer.register(HapiSwaggerOps, InitSwaggerError);
    }

    if (ConfigurationService.IsHttpsEnabled()) {
      this.httpsServer.register(HapiSwaggerOps, InitSwaggerError);
    }
  }
  //Routes Initializer
  InitializeRoutes() {
    var RoutesService = require('./RoutesService.js');
    var routes = RoutesService.BuildRoutes();
    if (ConfigurationService.IsHttpEnabled()) {
      this.httpServer.route(routes);
    }
    if (ConfigurationService.IsHttpsEnabled()) {
      this.httpsServer.route(routes);
    }
  }
/**
 * Database connection initialization
 */
  InitializeDatabaseConnection() {
    //Config Database Connection
    console.log('Initializing Database Connection...');
    var dbOpts = {
      "url": ConfigurationService.GetDatabaseURL(),
      "settings": {
        "db": {
          "native_parser": false
        }
      }
    };

    //Register MongoDB
    var MongoDBOps = {
      register: HapiMongoDB,
      options: dbOpts
    };
    var MongoDBErrorFunction = function(err) {
      if (err) {
        console.error(err);
        throw err;
      }
    };
    if (ConfigurationService.IsHttpEnabled()) {
      this.httpServer.register(MongoDBOps, MongoDBErrorFunction);
    }
    if (ConfigurationService.IsHttpsEnabled()) {
      this.httpsServer.register(MongoDBOps, MongoDBErrorFunction);
    }

    console.log("Database Connection Initialized!");
  }
  //Start servers
  Start() {
    if (ConfigurationService.IsHttpEnabled()) {
      console.log("Starting HTTP Server...");
      this.httpServer.start(() => {
        console.log("HTTP Server running at: ", this.httpServer.info.uri);
      });
    }

    if (ConfigurationService.IsHttpsEnabled()) {
      console.log("Starting HTTPS Server...");
      this.httpsServer.start(() => {
        console.log("HTTPS Server running at: ", this.httpServer.info.uri);
      });
    }
  }

  GetDatabaseConnection() {
    return this.httpServer.plugins['hapi-mongodb'];
  }
}
module.exports = new ServerService();
