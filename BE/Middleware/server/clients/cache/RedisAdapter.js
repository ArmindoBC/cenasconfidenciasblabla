/**
 *
 * Redis Adapter: in this file is represented and implemented the adapter for the Redis Service
 *
 */

'use strict';
var Redis = require('ioredis'),
  ConfigurationService = require('../../services/ConfigurationService.js'),
  LogClient = require('../log');

class RedisAdapter {
  //main constructor for the redis adapter
  constructor() {
    this.redis = new Redis({
      port: ConfigurationService.GetCacheAdapterRedisConfigurations().port,
      host: ConfigurationService.GetCacheAdapterRedisConfigurations().host
    });
  }
  get(collection, id) {
    var deferred = Promise.defer();
    this.redis.get(RedisAdapter.buildKey(collection, id), (err, result) => {
      if (err) {
        LogClient.Log({
          level: "ERROR",
          category: "requesting cache",
          message: `Error getting redis data cache: ${err.message}`
        });
        deferred.reject(err);
      } else {
          deferred.resolve(JSON.parse(result))
      }

    });
    return deferred.promise;
  }
  set(collection, id, value) {
      return Promise.resolve(this.redis.set(RedisAdapter.buildKey(collection, id), JSON.stringify(value)));
  }
  del(collection, id){
      this.redis.del(RedisAdapter.buildKey(collection, id))
  }
  static buildKey(collection, id) {
    return `${collection.toLowerCase()}:${id}`;
  }
}

module.exports = RedisAdapter;
