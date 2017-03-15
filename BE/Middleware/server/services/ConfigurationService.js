/**
 *
 * Configuration Service: In this file is loaded
 *
 */
"use strict";
var LogClient = require('../clients/log');

class ConfigurationService {

  constructor() {
      this.env = require('minimist')(process.argv.slice(2)).e;
      if (this.env == "production") {
          LogClient.Log({
              level: "DEBUG",
              category: "Middleware Server Configuration",
              message: "Initiating in production mode..."
          });
           this.CurrentConfigs = require('../configs/prodconfig');
      } else {
          LogClient.Log({
              level: "DEBUG",
              category: "Middleware Server Configuration",
              message: "Initiating in development mode..."
          });
          this.env = "development";
          this.CurrentConfigs = require('../configs/devconfig');
      }
  }

  GetFrontendDomainAddress() {
    return this.CurrentConfigs.frontendDomain;
  }

  GetBackendHostAddress() {
    return this.CurrentConfigs.backendHost;
  }

  GetLogsPath() {
    return this.CurrentConfigs.logsPath;
  }

  GetAuthPath() {
    return this.CurrentConfigs.authPath;
  }

  IsHTTPModeEnabled() {
    return this.CurrentConfigs.httpMode;
  }

  IsHTTPSModeEnabled() {
    return this.CurrentConfigs.httpsMode;
  }

  GetMiddlewareConfigs() {
    return this.CurrentConfigs.middlewareHost;
  }

  GetCertKeyPath() {
    return this.CurrentConfigs.httpsModeKeyPath;
  }

  GetCertPath() {
    return this.CurrentConfigs.httpsModeCertPath;
  }

  GetCacheConfigurations() {
    return this.CurrentConfigs.cacheDefs;
  }

  GetCacheAdaptersList() {
    return this.CurrentConfigs.cacheAdapters;
  }

  GetCacheAdapterMemcachedConfigurations() {
    return this.CurrentConfigs.memcachedConfigs;
  }

  GetCacheAdapterRedisConfigurations() {
    return this.CurrentConfigs.redisConfigs;
  }

}
module.exports = new ConfigurationService();
