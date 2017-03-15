"use strict";
/*
* Configuration loader: reponsible to load the rabbit and the mongodb configs
*/
class ConfigurationService {

  constructor() {
      this.env = require('minimist')(process.argv.slice(2)).e;
      if (this.env == "production") {
           this.CurrentConfigs = require('../configs/prodconfig');
      } else {
          this.env = "development";
          this.CurrentConfigs = require('../configs/devconfig');
      }
  }

  GetRabbitConfigs() {
    return this.CurrentConfigs.RabbitConfigs;
  }

  GetMongoConfigs(){
    return this.CurrentConfigs.MongoConfigs;
  }

}
module.exports = new ConfigurationService();
