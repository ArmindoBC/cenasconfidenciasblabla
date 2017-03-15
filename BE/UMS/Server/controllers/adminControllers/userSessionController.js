'use strict';
// public api
var usersession = {
    /*
        Retrieves a set of user sessions attending a set of properties like search, query, pagging and sorting
    */
    find: function (req, res, next) {
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `usersession api`, message : `Finding usersessions.`});

        req.query.username = req.query.username ? req.query.username : '';
        req.query.token = req.query.token ? req.query.token : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};

        if (req.query.username) {
            filters["user.username"] = new RegExp('^.*?' + req.query.username + '.*$', 'i');
        }
        if (req.query.token) {
            filters.token = new RegExp('^.*?' + req.query.token + '.*$', 'i');
        }
        req.app.db.models.UserSession.pagedFind({
            filters: filters,
            keys: 'user token createdDate expirationDate',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function (err, results) {
            if (err) {
                logClient.Log({ level:"Error", category : `usersession api`, message : `Error findind usersessions. Error: ${err.message}`});
                return next(err);
            }
            results.filters = req.query;
            res.status(200).json(results);
        });
    },

    /*
        Retrive an user session by an id
    */
    read: function (req, res, next) {
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `usersession api`, message : `Reading user sessions.`});

        req.app.db.models.UserSession.findById(req.params.id).exec(function (err, usersession) {
            if (err) {
                logClient.Log({ level:"Error", category : `usersession api`, message : `Error reading user sessions by id. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(usersession);
        });
    },
    /*
        It updates user session instance changing expiration data to current date. Thus, any operation made after this operation
        will use an invalid token.
    */
    invalidate: function (req, res, next) {
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `usersession api`, message : `Starting invalidate user session workflow.`});

        //checks if user is a root admin
        workflow.on('validate', function () {
            logClient.Log({ level:"DEBUG", category : `usersession api`, message : `Validating data.`});
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `usersession api`, message : `Error: current user may not invalidate user session. User ${req.user.id}`});
                workflow.outcome.errors.push('You may not invalidate user sessions.');
                return workflow.emit('response');
            }

            workflow.emit('patchUserSession');
        });

        //update user session instance in order to invalidate token
        workflow.on('patchUserSession', function () {
            logClient.Log({ level:"DEBUG", category : `usersession api`, message : `Patching user session.`});
            var fieldsToSet = {
                expirationDate: new Date()
            };
            var options = { new: true };
            req.app.db.models.UserSession.findByIdAndUpdate(req.params.id, fieldsToSet, options, function (err, usersession) {
                if (err) {
                    logClient.Log({ level:"Error", category : `usersession api`, message : `Error patching user session. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.outcome.usersession = usersession;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }

};
module.exports = usersession;
