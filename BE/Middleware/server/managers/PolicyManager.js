/**
*
* Bundle Service: Module responsible to receive data about a bundle and sends it to server to create a new bundle
*
*/


'use strict';
var request = require('request-promise'),
    ConfigurationService = require('../services/ConfigurationService.js'),
    LogClient = require('../clients/log'),
    cacheFactory = require('../clients/cache/CacheFactory'),
    cacheAdapter = cacheFactory.getCacheAdapter();


var options = {
    uri: `${ConfigurationService.GetBackendHostAddress()}/policy`,
    json: true
};

class PolicyManager {
        /**
        *  method: POST
        *  path: /policy
        *
        *  {
        *    userInfoData: {},
        packageSelected: "recommended",
        selectedCoverages: [],
        paymentProperties: { period:"month", method:"card"},
        receiveMethods: { invoices:"email", policies:"post"},
        insured: { vehicles: [], persons:[], properties: []},
        price: {month: , annual:}
    }
    */
    Create(policyData, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP POST to ${options.uri}`
        });
        return request({
            uri: options.uri,
            json: options.json,
            method: 'POST',
            body: policyData,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((data) => {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `Policy saved`
            });
            //invalite cache stored
            if (cacheAdapter) {
                //invalite cache stored
                cacheAdapter.del("policyList", policyData.userId);
            }
            return data;
        });
    }

    /**
    *  method: PUT
    *  path: /policy
    *
    *  {
    *    id: "policy_id"
    userInfoData: {},
    packageSelected: "recommended",
    selectedCoverages: [],
    paymentProperties: { period:"month", method:"card"},
    receiveMethods: { invoices:"email", policies:"post"},
    insured: { vehicles: [], persons:[], properties: []},
    price: {month: , annual:}
    }
    */
    Update(policyData, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP PUT to ${options.uri}`
        });
        return request({
            uri: options.uri,
            json: options.json,
            method: 'PATCH',
            body: policyData,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((data) => {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `Policy saved`
            });
            if (cacheAdapter) {
                //invalite cache stored
                cacheAdapter.del("policyList", policyData.userId);
            }
            return data;
        });
    }
    /**
    * It makes a request to server in order to receive all doc list. If query parameters are received, it returns filtered results.
    *  method: GET
    *  path: /{{path}}
    *
    */
    getPolicyList(query, authToken) {
        var requestFromBackend = function() {
            query = query || {};

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
                },
                qs : query
            })
            .then((data) => {
                if (cacheAdapter) {
                    LogClient.Log({
                        level: "DEBUG",
                        category: "requesting cache",
                        message: `Adding Coverage List By Product data to cache`
                    });
                    if(query.userId){
                        cacheAdapter.set("policyList", query.userId, data);
                    }
                }
                return data;
            });
        }

        if (cacheAdapter) {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting cache",
                message: `Getting Policy List By Product data`
            });
            if(query.userId){
                return cacheAdapter.get("policyList", query.userId)
                .then((result) => {
                    if (result) {
                        LogClient.Log({
                            level: "DEBUG",
                            category: "requesting cache",
                            message: `policyList data received from cache`
                        });
                        return result;
                    } else {
                        return requestFromBackend();
                    }
                });
            }
            else{
                return requestFromBackend();
            }

        } else {
            return requestFromBackend();
        }
    }

}
module.exports = new PolicyManager();
