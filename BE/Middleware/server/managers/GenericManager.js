'use strict';
var request = require('request-promise'),
ConfigurationService = require('../services/ConfigurationService.js'),
cacheFactory = require('../clients/cache/CacheFactory'),
LogClient = require('../clients/log'),
cacheAdapter = cacheFactory.getCacheAdapter();


class GenericManager {
    constructor(path){
        this.path = path;
        this.options = {
            uri: `${ConfigurationService.GetBackendHostAddress()}/${this.path}`,
            json: true
        }
    }
    /**
    It makes a request to server in order to receive all doc list or if query params were receives it returns filtered results.
    *  method: GET
    *  path: /{{path}}
    *
    */
    getDocList(query, authToken) {
        query = query || {};

        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP GET to ${this.options.uri}`
        });

        return request({
            uri: this.options.uri,
            json: this.options.json,
            method: 'GET',
            headers:{
                Authorization: `Bearer ${authToken}`
            },
            qs : query
        })
        .then((data) => {
            return data;
        });
    }
    /**
    It makes a request to server in order to receive doc by doc id.
    *  method: GET
    *  path: /{path}/{docid}
    *
    */
    getDocById(docid, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP GET to ${this.options.uri}`
        });

        return request({
            uri: `${this.options.uri}/${docid}`,
            json: this.options.json,
            method: 'GET',
            headers:{
                Authorization: `Bearer ${authToken}`
            },
        })
        .then((data) => {
            return data;
        });
    }
    /**
    It makes a request to server in order to create a new docid entity
    *  method: POST
    *  path: /{path}/

    *
    */
    Create(docData, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP POST to ${this.options.uri}`
        });
        return request({
            uri: this.options.uri,
            json: this.options.json,
            method: 'POST',
            body: docData,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((data) => {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `${this.path} saved`
            });
            return data;
        });
    }
    /**
    It makes a request to server in order to update a doc
    *  method: PATCH
    *  path: /{doc}
    *
    */
    Patch(docData, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP PUT to ${this.options.uri}`
        });
        return request({
            uri: this.options.uri,
            json: this.options.json,
            method: 'PATCH',
            body: docData,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((data) => {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `${this.path} Data updated`
            });
            return data;
        });
    }
    /**
    It makes a request to server in order to delete an doc item
    *  method: DELETE
    *  path: /{path}
    *
    */
    Delete(docid, authToken) {
        LogClient.Log({
            level: "DEBUG",
            category: "requesting backend",
            message: `HTTP PUT to ${this.options.uri}`
        });
        return request({
            uri: this.options.uri,
            json: this.options.json,
            method: 'DELETE',
            body: {id:docid},
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then((data) => {
            LogClient.Log({
                level: "DEBUG",
                category: "requesting backend",
                message: `${this.path} Data deleted`
            });
            return data;
        });
    }
}
module.exports = GenericManager;
