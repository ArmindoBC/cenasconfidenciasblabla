/**
 *
 * MemCached Adapter: in this file is represented and implemented the adapter for the MemCached Service
 *
 */


'use strict';
var MemCachedJS = require('memjs'),
  ConfigurationService = require('../../services/ConfigurationService.js'),
  LogClient = require('../log');

class MemCachedAdapter {
  //contructor for the memcached client
  constructor() {
    var server = `${ConfigurationService.GetCacheAdapterMemcachedConfigurations().host}:${ConfigurationService.GetCacheAdapterMemcachedConfigurations().port}`;
    this.memcached = MemCachedJS.Client.create(server);
  }
  get(collection, id) {
    var deferred = Promise.defer();
    this.memcached.get(MemCachedAdapter.buildKey(collection, id), function(err, result) {
      if (err) {
        LogClient.Log({
          level: "ERROR",
          category: "requesting cache",
          message: `Error getting memcached data cache: ${err.message}`
        });
        deferred.reject(err);
      } else {
        result = JSON.parse(result);
        deferred.resolve(result);
      }

    });
    return deferred.promise;
  }
  set(collection, id, value) {
    return Promise.resolve(this.memcached.set(MemCachedAdapter.buildKey(collection, id), JSON.stringify(value)));
  }
  static buildKey(collection, id) {
    return `${collection.toLowerCase()}:${id}`;
  }
}

module.exports = MemCachedAdapter;
