/**
*
* Chache Factory: this represents the initialization of the memcached adapter or the Redis adapter
*
*/

'use strict';
var ConfigurationService = require('../../services/ConfigurationService.js'),
RedisAdapter = require('./RedisAdapter'),
MemCachedAdapter = require('./MemCachedAdapter');

class CacheFactory {
    getCacheAdapter() {
        if (this.adapterInstance === undefined && ConfigurationService.GetCacheConfigurations().enabled) {
            if (ConfigurationService.GetCacheConfigurations().adapter === ConfigurationService.GetCacheAdaptersList().redis) {
                this.adapterInstance = new RedisAdapter();
            } else if (ConfigurationService.GetCacheConfigurations().adapter === ConfigurationService.GetCacheAdaptersList().memcached) {
                this.adapterInstance = new MemCachedAdapter();
            }
        }
        return this.adapterInstance;
    }
}

module.exports = new CacheFactory();
