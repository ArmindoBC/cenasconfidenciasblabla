"use strict";
var joi = require('joi'),
  BaseController = require('./BaseController.js');
/**
 * Coverage controller, contains all functions to build the coverage, this also extends BaseController
 */
class CoverageController extends BaseController {

  constructor() {
    super();
  }

  GetCollectionName() {
    return "coverage";
  }
/**
* Returns the Coverages meeting the provided parameters. In case there are no search parameters, all Coverages will be returned
*/
  Get() {
    return {
      method: 'GET',
      path: '/coverage',
      config: {
        description: 'Get Coverage',
        notes: 'Returns the Coverages meeting the provided parameters. In case there are no search parameters, all Coverages will be returned',
        tags: ['api'],
        handler: (request, reply) => {
          this.BaseGetHandler(this.GetCollectionName(), request, reply);
        },
        validate: {
          query: {
            id: joi.string().hex().optional().description("Filter coverage by id (same as use path/{id})"),
            title: joi.string().optional().description("Filter coverages by title"),
            type: joi.string().optional().description("Filter coverages by type"),
            premium: joi.number().precision(2).optional().description("Filter coverages by premium"),
            productid: joi.string().hex().optional().description("Filter coverages by group coverage id")
          }
        }
      }
    };
  }
}
module.exports = new CoverageController();
