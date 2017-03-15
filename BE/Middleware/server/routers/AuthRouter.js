'use strict';
var Router = require("falcor-router"),
  authRoutes = require('../routes/auth'),
  LogClient = require('../clients/log');

/**
 * It receives all routes that will be available in LogRouter.
 * Does not exist a way to handle non matching routes, so the router only returns undefined: https://github.com/Netflix/falcor/issues/615
 */
class AuthRouter extends Router.createClass(authRoutes) {
  constructor(authorization) {
    super();
    if (authorization) {
      var credentials = authorization.split(' ');

      if (credentials[0] !== 'Bearer' || credentials[1] === undefined) {
        var err = 'authorization scheme must follow Bearer strategy';
        LogClient.Log({
          level: "ERROR",
          category: `Auth Router`,
          message: `Error: ${err}`
        });

        throw new Error(err);
      }
      this.authToken = credentials[1];
    }

  }
}

module.exports = AuthRouter;
