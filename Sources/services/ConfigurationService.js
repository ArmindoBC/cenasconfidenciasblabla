"use strict";
var os = require('os');
var LogClient = require('../clients/log');

class ConfigurationService {

    //Usage node <init_script> -e <mode>
    //mode: production or development
    constructor() {
        this.env = require('minimist')(process.argv.slice(2)).e;
        console.log(this.env);
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

    GetHttpPort() {
        return this.CurrentConfigs.httpPort;
    }

    GetHttpsPort() {
        return this.CurrentConfigs.httpsPort;
    }

    GetBackendHostAddress() {
        return this.CurrentConfigs.backendHost;
    }

    GetLogsPath() {
        return this.CurrentConfigs.logconfigurations.FalcorRouterConfigs.logsPath;
    }

    GetAuthPath() {
        return this.CurrentConfigs.logconfigurations.FalcorRouterConfigs.authPath;
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

    GetLogConfigurations() {
        this.CurrentConfigs.logconfigurations.machineName = os.hostname();
        return this.CurrentConfigs.logconfigurations;
    }
    GetGoogleConfigurations() {
        return this.CurrentConfigs.google;
    }
    GetFacebookConfigurations() {
        return this.CurrentConfigs.facebook;
    }
    GetLinkedinConfigurations() {
        return this.CurrentConfigs.linkedin;
    }

}
module.exports = new ConfigurationService();
