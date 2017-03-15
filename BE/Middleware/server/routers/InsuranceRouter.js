'use strict';
var Router = require("falcor-router"),
productRoutes = require('../routes/product'),
policyRoutes = require('../routes/policy'),
notificationRoutes = require('../routes/notification'),
userRoutes = require('../routes/user'),
LogClient = require('../clients/log');

var InsuranceRoutes = [].concat(productRoutes, policyRoutes,notificationRoutes,  userRoutes);

/**
* It receives all routes that will be available in InsuranceRouter.
* Does not exist a way to handle non matching routes, so the router only returns undefined: https://github.com/Netflix/falcor/issues/615
*/
class InsuranceRouter extends Router.createClass(InsuranceRoutes) {
    constructor(authorization) {
        super();
        if (authorization) {
            var credentials = authorization.split(' ');

            if (credentials[0] != 'Bearer' || credentials[1] === undefined) {
                var err = 'authorization scheme must follow Bearer strategy';
                LogClient.Log({
                    level: "ERROR",
                    category: `Insurance Router`,
                    message: `Error: ${err}`
                });

                throw new Error(err);
            }
            this.authToken = credentials[1];
        }

    }
}

module.exports = InsuranceRouter;
