'use strict';
var request = require('request-promise'),
ConfigurationService = require('../services/ConfigurationService.js'),
cacheFactory = require('../clients/cache/CacheFactory'),
LogClient = require('../clients/log'),
cacheAdapter = cacheFactory.getCacheAdapter();
var options = {
    uri: `${ConfigurationService.GetBackendHostAddress()}/coverage`,
    json: true
};

class CoverageService {

    /**
    *
    * Coverage Service:
    *
    */
    /**
    *  It receives a product id and make a request to server in order to receive
    all coverages that belong to the product with product id sent.
    *  method: GET
    *  path: /coverage
    *
    *  productid : (id product)
    */
    getCoverageListByProduct(productID, authToken) {
        var requestFromBackend = function() {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `HTTP GET to ${options.uri}`
            });

            return request({
                uri: options.uri,
                json: options.json,
                method: 'GET',
                qs: {
                    productid: productID
                },
                headers:{
                    Authorization: `Bearer ${authToken}`
                }
            })
            .then((data) => {
                if (cacheAdapter) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Adding Coverage List By Product data to cache`
                    });
                    cacheAdapter.set("CoverageListByProduct", productID, data);
                }
                return data;
            });
        };
        if (cacheAdapter) {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting cache",
                message: `Getting Coverage List By Product data`
            });
            return cacheAdapter.get("CoverageListByProduct", productID)
            .then((result) => {
                if (result !== null) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Coverage List By Product data received from cache`
                    });
                    return result;
                } else {
                    return requestFromBackend();
                }
            });
        } else {
            return requestFromBackend();
        }
    }
}

module.exports = new CoverageService();
