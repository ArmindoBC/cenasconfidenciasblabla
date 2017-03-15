'use strict';
var request = require('request-promise'),
ConfigurationService = require('../services/ConfigurationService.js'),
cacheFactory = require('../clients/cache/CacheFactory'),
LogClient = require('../clients/log'),
cacheAdapter = cacheFactory.getCacheAdapter();

var options = {
    uri: `${ConfigurationService.GetBackendHostAddress()}/product`,
    json: true
};

class ProductManager {
    /**
    It makes a request to server in order to receive all products list.
    *  method: GET
    *  path: /product
    *
    */
    getProductList(authToken) {
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
                headers:{
                    Authorization: `Bearer ${authToken}`
                }
            })
            .then((data) => {
                if (cacheAdapter) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Adding product list data to cache`
                    });

                    cacheAdapter.set("productList", "list", data);
                }
                return data;
            });
        };

        if (cacheAdapter) {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting cache",
                message: `Getting product list data`
            });

            return cacheAdapter.get("productList", "list")
            .then((result) => {
                if (result) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Product List data received from cache`
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
    /**
    It makes a request to server in order to receive product by product id.
    *  method: GET
    *  path: /product
    query: {id: productid}
    *
    */
    getProductByID(productid, authToken) {
        var requestFromBackend = function() {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `HTTP GET to ${options.uri}`
            });

            return request({
                uri: `${options.uri}/${productid}`,
                json: options.json,
                method: 'GET',
                headers:{
                    Authorization: `Bearer ${authToken}`
                }
            })
            .then((data) => {
                if(data){
                    if (cacheAdapter) {
                        LogClient.Log({
                            level: "DEBUG",
                            category: "requesting cache",
                            message: `Adding product data to cache`
                        });

                        cacheAdapter.set("product", productid, data);
                    }
                    return data;
                }
                else{
                    return undefined;
                }

            });
        };

        if (cacheAdapter) {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting cache",
                message: `Getting product data`
            });

            return cacheAdapter.get("product", productid)
            .then((result) => {
                if (result !== null) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Product data received from cache`
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

module.exports = new ProductManager();
