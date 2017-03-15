"use strict";

/*
* Configration Service: Loads the configurations need from the config files
*/

class ConfigurationService {

  constructor() {
    this.env = require('minimist')(process.argv.slice(2)).e;
    if (!this.env) {
      this.env = "development";
      this.CurrentConfigs = require('../configs/DevConfig');
    } else {
      //Assume Production (while does not exist any more modes)
      this.env = "production";
      this.CurrentConfigs = require('../configs/ProdConfig');
    }
  }

  GetMiddlewareConfigs() {
    return this.CurrentConfigs.middlewareConfigs;
  }

  GetMongoConfigs(){
    return this.CurrentConfigs.mongoConfigs;
  }

  GetRabbitConfigs(){
    return this.CurrentConfigs.rabbitConfigs;
  }

  GetTestingConfigs(){
    return this.CurrentConfigs.testing;
  }

  GetFrontEndConfigs(){
    return this.CurrentConfigs.frontEndConfig;
  }

  GetBackEndConfigs(){
    return this.CurrentConfigs.backEndConfigs;
  }

}
module.exports = new ConfigurationService();
