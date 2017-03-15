'use strict';
var jsong = require('falcor-json-graph'),
  async = require('async-q'),
  PolicyManager = require('../managers/PolicyManager'),
  ProductManager = require('../managers/ProductManager'),
  CoverageManager = require('../managers/CoverageManager'),
  LogClient = require('../clients/log'),
  AuthClient = require('../clients/auth');

/**
 * Routes related to bundle operations
 */
module.exports = [

  /**
   * Route used to access product list by received ids
   *
   */
  {
      route: "products.getListByIDs",
      call: function(callpath, args) {
          let ids = args[0];
          var result = [];

          return async.eachSeries(ids, (id) => {
              return ProductManager.getProductByID(id,this.authToken)
              .then((productData) => {
                  result.push(productData);
                  return;
              });
          })
          .then(()=>{
              /**
              * For each product in result previously obtained will be requested the associated coverages
              */
              return async.each(result, (product) => {
                  return CoverageManager.getCoverageListByProduct(product.id, this.authToken)
                  .then((coverageList) => {
                      LogClient.Log({
                          level: "DEBUG",
                          category: "information",
                          message: `Coverages data for Product id '${product.id}' received successfully`
                      });

                      product.coverageList = coverageList;
                      return;
                  })
                  .catch((err) => {
                      throw err;
                  });
              })
          })
          .then(() => {
              LogClient.Log({
                  level: "DEBUG",
                  category: "information",
                  message: `GroupCoverage data received successfully`
              });
              return {
                  path: ["products"],
                  value: jsong.atom(result)
              };
          })
          .catch((err) => {
              LogClient.Log({
                  level: "ERROR",
                  category: "products route",
                  message: `Error getting product data. ${err.message}`
              });
              return {
                  path: ["products"],
                  value: jsong.error(err.message)
              };
          })


      }
  },
  /**
   * Route used to access product list
   * It receives a non filtered product list
   *
   */
   {
       route: "products.getListByUserInfo",
       call: function(callpath, args) {
           let userData = args[0];

           let result;

           LogClient.Log({
               level: "DEBUG",
               category: "incoming requests",
               message: `Received request in route 'products'`
           });

           return ProductManager.getProductList(this.authToken)
           .then((productList) => {

               LogClient.Log({
                   level: "DEBUG",
                   category: "information",
                   message: `Product list data received successfully`
               });

               result = productList;
           })
           .then(() => {
               /**
               * For each product in result previously obtained will be requested the associated coverages
               */
               return async.each(result, (product) => {
                   return CoverageManager.getCoverageListByProduct(product.id, this.authToken)
                   .then((coverageList) => {

                       LogClient.Log({
                           level: "DEBUG",
                           category: "information",
                           message: `Coverages data for Product id '${product.id}' received successfully`
                       });

                       product.coverageList = coverageList;
                       return;
                   })
                   .catch((err) => {
                       throw err;
                   });
               })
           })
           .then(() => {
               LogClient.Log({
                   level: "DEBUG",
                   category: "information",
                   message: `GroupCoverage data received successfully`
               });
               return {
                   path: ["products"],
                   value: jsong.atom(result)
               };
           })
           .catch((err) => {
               LogClient.Log({
                   level: "ERROR",
                   category: "products route",
                   message: `Error getting product list. ${err.message}`
               });
               return {
                   path: ["products"],
                   value: jsong.error(err.message)
               };

           });
       }
   }
];
