'use strict';

var request = require('request-promise'),
    config = require('../config');

var options = {
    uri: `${config.host}/bundle`,
    json: true
};
class BundleService {
    /**
     *  It receives data about a bundle and sends it to server to create a new bundle
     *  method: POST
     *  path: /bundle
     *
     *  bundleData : { userID : (user id) , coverages : ( array with coverage ids) }
     */
    createBundle(bundleData) {
        bundleData.id = 11111;
        return bundleData;



        /*
        return request({
            uri: options.uri,
            json: option.json,
            method: 'POST',
            body: bundleData
        })
            .then((res) => {
                return res;
            })
            .catch((err) => {
                console.log(err);
            });*/
    }
}
module.exports = new BundleService();