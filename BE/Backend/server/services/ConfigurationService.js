"use strict";
var LogClient = require('../clients/log');
/**
* Configuration Service: Functions to retrieve the configs from the files
*/

class ConfigurationService {
    //Usage node <init_script> -e <mode>
    //mode: production or development
    constructor() {
        this.env = require('minimist')(process.argv.slice(2)).e;
        if (this.env == "production") {
            LogClient.Log({
                level: "DEBUG",
                category: "Back-end Server Configuration",
                message: "Initiating in production mode..."
            });
             this.CurrentConfigs = require('../configs/prodconfig');
        } else {
            LogClient.Log({
                level: "DEBUG",
                category: "Back-end Server Configuration",
                message: "Initiating in development mode..."
            });
            this.env = "development";
            this.CurrentConfigs = require('../configs/devconfig');
        }
    }


    GetHttpServerPort() {
        return this.CurrentConfigs.HttpServerPort;
    }

    GetHttpsServerPort() {
        return this.CurrentConfigs.HttpsServerPort;
    }

    GetDatabaseURL() {
        return this.CurrentConfigs.DatabaseURL;
    }

    IsHttpEnabled(){
        return this.CurrentConfigs.httpMode;
    }

    IsHttpsEnabled(){
        return this.CurrentConfigs.httpsMode;
    }

    GetHttpsKeyPath(){
        return this.CurrentConfigs.httpsModeKeyPath;
    }

    GetHttpsCertPath(){
        return this.CurrentConfigs.httpsModeCertPath;
    }
    GetDefaultUserGroups(){
        return this.CurrentConfigs.defaultUsersGroups;
    }

}
module.exports = new ConfigurationService();
