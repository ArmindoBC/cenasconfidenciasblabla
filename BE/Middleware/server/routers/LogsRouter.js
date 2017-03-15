'use strict';
var Router = require("falcor-router"),
  logRoutes = require('../routes/log');

/**
 * It receives all routes that will be available in LogRouter.
 * Does not exist a way to handle non matching routes, so the router only returns undefined: https://github.com/Netflix/falcor/issues/615
 */
class LogsRouter extends Router.createClass(logRoutes) {
  constructor(userId) {
    super();
    this.userId = userId;
  }
}

module.exports = LogsRouter;
