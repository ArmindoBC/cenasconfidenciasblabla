'use strict';
// public api
var group = {
    /*
    Retrieves a set of account groups attending a set of properties like search, query, pagging and sorting
    */
    find: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting find account group workflow.`});

        req.query.name = req.query.name ? req.query.name : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.name) {
            filters.name = new RegExp('^.*?'+ req.query.name +'.*$', 'i');
        }

        //find paginatated results
        req.app.db.models.AccountGroup.pagedFind({
            filters: filters,
            keys: 'name',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account group paged. Error: ${err.message}`});
                return next(err);
            }
            results.filters = req.query;
            res.status(200).json(results);
        });
    },
    /*
        Find an account group by id.
    */
    read: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting read account group workflow.`});

        req.app.db.models.AccountGroup.findById(req.params.id).exec(function(err, accountGroup) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account group by id. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(accountGroup);
        });
    },
    /*
        Create a new account group instance.
        It validates if received data is valid an if current user is and root admin.
        After check if there exists another one account group with same name a new account group instance is created
    */
    create: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting create account group workflow.`});

        //it validates if current user is a root admin and if account group name was received
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Validating account group data.`});
            console.log(req.user.roles.admin.isMemberOf('root'))
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: User may not create account groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not create account groups.');
                return workflow.emit('response');
            }

            if (!req.body.name) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Please enter a name`});
                workflow.outcome.errors.push('Please enter a name.');
                return workflow.emit('response');
            }

            workflow.emit('duplicateAccountGroupCheck');
        });

        //checks if already exists an account group with same name. Cannot exist two account groups with same name
        workflow.on('duplicateAccountGroupCheck', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Checking duplicate account group.`});
            req.app.db.models.AccountGroup.findById(req.app.utility.slugify(req.body.name)).exec(function(err, accountGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account group by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //the group already exists
                if (accountGroup) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: That group already exists.`});
                    workflow.outcome.errors.push('That group already exists.');
                    return workflow.emit('response');
                }

                workflow.emit('createAccountGroup');
            });
        });
        //create an account group instance.
        workflow.on('createAccountGroup', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Creating account group.`});
            var fieldsToSet = {
                _id: req.app.utility.slugify(req.body.name),
                name: req.body.name
            };

            req.app.db.models.AccountGroup.create(fieldsToSet, function(err, accountGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error creating account group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = accountGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Updates an account group
        it checks if current user can do the operation and if a name was received
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting update account group workflow`});

        //check if current user is an root admin and if a name was received
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Validating account group data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Current user may not update account groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not update account groups.');
                return workflow.emit('response');
            }

            if (!req.body.name) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Username required}`});
                workflow.outcome.errfor.name = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAccountGroup');
        });

        //update account group information
        workflow.on('patchAccountGroup', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Patching account group`});

            var fieldsToSet = {
                name: req.body.name
            };
            var options = { new: true };
            req.app.db.models.AccountGroup.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, accountGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating account group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.accountGroup = accountGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        it updates account group permissions
        it checks if a current user is an root admin and if were received permissions
    */
    permissions: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting account group permissions workflow`});

        //validates if user is a root admin and if permissions were received by user
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Validating change permissions`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `account group api`, message : `Error: current user may not change the permissions of account groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not change the permissions of account groups.');
                return workflow.emit('response');
            }

            if (!req.body.permissions) {
                logClient.Log({ level:"ERROR", category : `account group api`, message : `Error: permissions data required`});
                workflow.outcome.errfor.permissions = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAccountGroup');
        });

        //update account group instance permissions
        workflow.on('patchAccountGroup', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Patching account group`});

            var fieldsToSet = {
                permissions: req.body.permissions
            };
            var options = { new: true };

            req.app.db.models.AccountGroup.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, accountGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating account group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.accountGroup = accountGroup;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Delete an account group
        This operation can only be done by root admins
    */
    delete: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account group api`, message : `Starting delete account group workflow`});

        //validate if current user is root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Validating delete account group`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `account group api`, message : `Error: Current user may not delete account groups. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not delete account groups.');
                return workflow.emit('response');
            }

            workflow.emit('deleteAccountGroup');
        });
        //delete an account group by id
        workflow.on('deleteAccountGroup', function(err) {
            logClient.Log({ level:"DEBUG", category : `account group api`, message : `Deleting account group`});
            req.app.db.models.AccountGroup.findByIdAndRemove(req.params.id, function(err, accountGroup) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating account group. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }

};
module.exports = group;
