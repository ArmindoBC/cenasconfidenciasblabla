'use strict';
// public api
var group = {
    /*
    Retrieves a set of admin groups attending a set of properties like search, query, pagging and sorting
    */
    find: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting find admin group workflow.`});

        req.query.name = req.query.name ? req.query.name : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.name) {
            filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
        }

        //retrieve paginatated results
        req.app.db.models.AdminGroup.pagedFind({
            filters: filters,
            keys: 'name',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding admin group paged. Error: ${err.message}`});
                return next(err);
            }
            results.filters = req.query;
            res.status(200).json(results);
        });
    },
    /*
        Find an admin group by id.
    */
    read: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting read admin group workflow.`});

        req.app.db.models.AdminGroup.findById(req.params.id).exec(function(err, adminGroup) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding admin group by id. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(adminGroup);
        });
    },
    /*
        Create a new admin group instance.
        It validates if received data is valid an if current user is and root admin.
        After check if there exists another one admin group with same name a new admin group instance is created
    */
    create: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting create admin group workflow.`});

        //it validates if current user is a root admin and if admin group name was received
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Validating admin group data.`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: User many not create admin groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not create admin groups.');
                return workflow.emit('response');
            }

            if (!req.body.name) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Please enter a name`});
                workflow.outcome.errors.push('Please enter a name.');
                return workflow.emit('response');
            }

            workflow.emit('duplicateAdminGroupCheck');
        });

        //checks if already exists an admin group with same name. Cannot exist two admin groups with same name
        workflow.on('duplicateAdminGroupCheck', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Checking duplicate admin group.`});
            req.app.db.models.AdminGroup.findById(req.app.utility.slugify(req.body.name)).exec(function(err, adminGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding admin group by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //the group already exists
                if (adminGroup) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: That group already exists.`});
                    workflow.outcome.errors.push('That group already exists.');
                    return workflow.emit('response');
                }

                workflow.emit('createAdminGroup');
            });
        });

        //create an admin group instance.
        workflow.on('createAdminGroup', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Creating admin group.`});
            var fieldsToSet = {
                _id: req.app.utility.slugify(req.body.name),
                name: req.body.name
            };

            req.app.db.models.AdminGroup.create(fieldsToSet, function(err, adminGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error creating admin group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = adminGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Updates an admin group
        it checks if current user can do the operation and if a name was received
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting update admin group workflow`});

        //check if current user is an root admin and if a name was received
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Validating admin group data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Current user may not update admin groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not update admin groups.');
                return workflow.emit('response');
            }

            if (!req.body.name) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Username required}`});
                workflow.outcome.errfor.name = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAdminGroup');
        });

        //update admin group information
        workflow.on('patchAdminGroup', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Patching admin group`});

            var fieldsToSet = {
                name: req.body.name
            };
            var options = { new: true };
            req.app.db.models.AdminGroup.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, adminGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating admin group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.adminGroup = adminGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        it updates admin group permissions
        it checks if a current user is an root admin and if were received permissions
    */
    permissions: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting admin group permissions workflow`});

        //validates if user is a root admin and if permissions were received by user
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Validating change permissions`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin group api`, message : `Error: current user may not change the permissions of admin groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not change the permissions of admin groups.');
                return workflow.emit('response');
            }

            if (!req.body.permissions) {
                logClient.Log({ level:"ERROR", category : `admin group api`, message : `Error: permissions data required`});
                workflow.outcome.errfor.permissions = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAdminGroup');
        });

        //update admin group instance permissions
        workflow.on('patchAdminGroup', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Patching admin group`});

            var fieldsToSet = {
                permissions: req.body.permissions
            };
            var options = { new: true };

            req.app.db.models.AdminGroup.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, adminGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating admin group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.adminGroup = adminGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Delete an admin group
        This operation can only be done by root admins
    */
    delete: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Starting delete admin group workflow`});

        //validate if current user is root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Validating delete admin group`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin group api`, message : `Error: Current user may not delete admin groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not delete admin groups.');
                return workflow.emit('response');
            }

            workflow.emit('deleteAdminGroup');
        });

        //delete an account group by id
        workflow.on('deleteAdminGroup', function(err) {
            logClient.Log({ level:"DEBUG", category : `admin group api`, message : `Deleting admin group`});
            req.app.db.models.AdminGroup.findByIdAndRemove(req.params.id, function(err, adminGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating admin group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }

};
module.exports = group;
