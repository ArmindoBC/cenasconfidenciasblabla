'use strict';
// public api
var activityHistory = {
    /*
    Retrieves a set of activity history instances attending a set of properties like search, query, pagging and sorting
    */
    find: function (req, res, next) {
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `activities history api`, message : `Finding history activities.`});

        req.query.user = req.query.user ? req.query.user : '';
        req.query.category = req.query.category ? req.query.category : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};

        if (req.query.category) {
            filters.category = new RegExp('^.*?' + req.query.category + '.*$', 'i');
        }
        if (req.query.user) {
            filters.user = new RegExp('^.*?' + req.query.user + '.*$', 'i');
        }
        //find paginatated results
        req.app.db.models.ActivityHistory.pagedFind({
            filters: filters,
            keys: 'user category message timestamp machineName',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function (err, results) {
            if (err) {
                logClient.Log({ level:"Error", category : `activities history api`, message : `Error findind history activities. Error: ${err.message}`});
                return next(err);
            }

            results.filters = req.query;
            res.status(200).json(results);
        });
    },
    /*
        Find an activity history by id.
    */
    read: function (req, res, next) {
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `activities history api`, message : `Reading history activities.`});

        req.app.db.models.ActivityHistory.findById(req.params.id).exec(function (err, activityHistory) {
            if (err) {
                logClient.Log({ level:"Error", category : `activities history api`, message : `Error reading history activities by id. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(activityHistory);
        });
    },
    /*
        Delete an account group by id.
        this operation can only be done by root admins
    */
    delete: function (req, res, next) {
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `activities history api`, message : `Starting delete history activities workflow.`});

        //validate if current user is a root admin
        workflow.on('validate', function () {
            logClient.Log({ level:"DEBUG", category : `activities history api`, message : `Validating data.`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `activities history api`, message : `Error: current user may not delete history activities. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not delete history activities.');
                return workflow.emit('response');
            }

            workflow.emit('deleteActivityHistory');
        });
        //delete instance from database
        workflow.on('deleteActivityHistory', function (err) {
            logClient.Log({ level:"DEBUG", category : `activities history api`, message : `Deleting category.`});
            req.app.db.models.ActivityHistory.findByIdAndRemove(req.params.id, function (err) {
                if (err) {
                    logClient.Log({ level:"Error", category : `activities history api`, message : `Error deleting category. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }

};
module.exports = activityHistory;
