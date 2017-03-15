"use strict";
var joi = require('joi'),
  BaseController = require('./BaseController.js');
/**
 *  Group Coverage controller, contains all functions to retrieve the coverage questions, this also extends BaseController
 */
class ProductController extends BaseController {

  constructor() {
    super();
  }

  GetCollectionName() {
    return "product";
  }
/**
 *  Returns the Group Coverages meeting the provided parameters. In case there are no search parameters, all Group Coverages will be returned
 */
  Get() {
    return {
      method: 'GET',
      path: '/product',
      config: {
        description: 'Get Product',
        notes: 'Returns the Products meeting the provided parameters. In case there are no search parameters, all Products will be returned',
        tags: ['api'],
        handler: (request, reply) => {
          this.BaseGetHandler(this.GetCollectionName(), request, reply);
        },
        validate: {
          query: {
            title: joi.string().optional().description("Filter product by title"),
            id: joi.string().hex().optional().description("Filter product by id")
          }
        }
      }
    };
  }

  /**
  * Returns the product which matches the id received
  */
  GetItem() {
      return {
          method: 'GET',
          path: '/product/{id}',
          config: {
              description: 'Get product',
              notes: 'Returns the product which matches the id received',
              tags: ['api'],
              handler: (request, reply) => {
                  this.BaseGetItemHandler(this.GetCollectionName(), request, reply);
              },
              validate: {
                  params: {
                      id: joi.string().hex().required().description("Filter product by id "),
                  },
                  headers: joi.object({
                      'authorization': joi.string().required()
                  }).unknown()
              }
          }
      };
  }
}

module.exports = new ProductController();
