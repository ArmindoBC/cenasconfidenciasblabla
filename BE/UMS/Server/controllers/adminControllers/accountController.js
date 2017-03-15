'use strict';
// public api
var account = {
    /*
    Retrieves a set of accounts attending a set of properties like search, query, pagging and sorting
    */
    find: function (req, res, next) {
        var outcome = {};
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting find account workflow.`});

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Finding accounts paged`});

        req.query.search = req.query.search ? req.query.search : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?' + req.query.search + '.*$', 'i');
        }

        req.app.db.models.Account.pagedFind({
            filters: filters,
            keys: 'name company phone zip userCreated',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function (err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding accounts paged. Error: ${err.message}`});
                return next(err);
            }

            outcome.results = results;
            outcome.results.filters = req.query;
            res.status(200).json(outcome);
        });

    },
    /*
    It creates a new account entity
    */
    create: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting create account workflow.`});

        //validates account received data
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating account data.`});

            //account must have a name
            if (!req.body['name.full']) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Invalid data, please enter a name.`});
                workflow.outcome.errors.push('Please enter a name.');
                return workflow.emit('response');
            }

            workflow.emit('createAccount');
        });

        /*
            it creates an account entity.
            receives information and  builds an account object in order to create an account instance
        */
        workflow.on('createAccount', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Creating account.`});
            //builds the account object
            var nameParts = req.body['name.full'].trim().split(/\s/);
            var fieldsToSet = {
                name: {
                    first: nameParts.shift(),
                    middle: (nameParts.length > 1 ? nameParts.shift() : ''),
                    last: (nameParts.length === 0 ? '' : nameParts.join(' '))
                },
                userCreated: {
                    id: req.user._id,
                    name: req.user.username,
                    time: new Date().toISOString()
                }
            };
            fieldsToSet.name.full = fieldsToSet.name.first + (fieldsToSet.name.last ? ' '+ fieldsToSet.name.last : '');
            fieldsToSet.search = [
                fieldsToSet.name.first,
                fieldsToSet.name.middle,
                fieldsToSet.name.last
            ];

            //creates an account instance
            req.app.db.models.Account.create(fieldsToSet, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error creating account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = account;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Retrives information about an account instance.
    */
    read: function(req, res, next){
        var outcome = {};
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting read account workflow.`});

        //get the set of available account groups
        var getAccountGroups = function(callback) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Finding account groups`});
            req.app.db.models.AccountGroup.find({}, 'name').sort('name').exec(function(err, accountGroups) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account groups. Error: ${err.message}`});
                    return callback(err, null);
                }
                outcome.accountGroups = accountGroups;
                return callback(null, 'done');
            });
        };
        //get account information
        var getRecord = function(callback) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Finding account by id.`});
            req.app.db.models.Account.findById(req.params.id).populate('groups', 'name').exec(function(err, record) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account by id. Error: ${err.message}`});
                    return callback(err, null);
                }

                outcome.record = record;
                return callback(null, 'done');
            });
        };

        var asyncFinally = function(err, results) {
            if (err) {
                return next(err);
            }
            res.status(200).json(outcome);
        };

        require('async').parallel([getRecord, getAccountGroups], asyncFinally);
    },
    /*
        Updates account information.
        It receives a the new data, validates it and patch account
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting update account workflow.`});

        //must receive first and last names
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating account data.`});

            if (!req.body.first) {
                workflow.outcome.errfor.first = 'required';
            }

            if (!req.body.last) {
                workflow.outcome.errfor.last = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Invalid account data. ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('patchAccount');
        });

        //patch account. it updates account instance with new data.
        workflow.on('patchAccount', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Patching account data.`});

            //build new account object
            var fieldsToSet = {
                name: {
                    first: req.body.first,
                    middle: req.body.middle,
                    last: req.body.last,
                    full: req.body.first +' '+ req.body.last
                },
                company: req.body.company,
                phone: req.body.phone,
                zip: req.body.zip,
                search: [
                    req.body.first,
                    req.body.middle,
                    req.body.last,
                    req.body.company,
                    req.body.phone,
                    req.body.zip
                ]
            };
            var options = { new: true };

            //update data
            req.app.db.models.Account.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and updating. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.account = account;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },

    /*
        It receives a set of groups and updates account instance in order become part of received Groups
        It validates if groups data were received and if the request user is an admin
    */
    groups: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting groups account workflow`});

        //validates data
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating data.`});
            //user must be member of root admin group
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Current user may not change the group membership of accounts. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not change the group memberships of accounts.');
                return workflow.emit('response');
            }

            //must receive a set of groups
            if (!req.body.groups) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Invalid data. Error: groups required`});
                workflow.outcome.errfor.groups = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAccount');
        });
        //update account instance with references to the received groups
        workflow.on('patchAccount', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Patching account.`});

            var fieldsToSet = {
                groups: req.body.groups
            };
            var options = { new: true };
            req.app.db.models.Account.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error patching accounts. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //populate account instance with created groups information
                account.populate('groups', 'name', function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error populating group accounts. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    workflow.outcome.account = account;
                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        It links account instance to an user instance.
    */
    linkUser: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting link user workflow.`});

        /*
            Validates the operation.
            Only root admins can do this operation and request must receive a new username to link account
        */
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating account data.`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error linking accounts to users since current user is not a member of root group`});
                workflow.outcome.errors.push('You may not link accounts to users.');
                return workflow.emit('response');
            }

            if (!req.body.newUsername) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Invalid data, username required.`});
                workflow.outcome.errfor.newUsername = 'required';
                return workflow.emit('response');
            }

            workflow.emit('verifyUser');
        });
        /*
            It verifies if user referenced by received username exists and if does not have other account linked
        */
        workflow.on('verifyUser', function(callback) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Verifying user.`});

            req.app.db.models.User.findOne({ username: req.body.newUsername }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding user by username. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: User not found`});
                    workflow.outcome.errors.push('User not found.');
                    return workflow.emit('response');
                }
                else if (user.roles && user.roles.account && user.roles.account !== req.params.id) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: User is already linked to a different account`});
                    workflow.outcome.errors.push('User is already linked to a different account.');
                    return workflow.emit('response');
                }

                workflow.user = user;
                workflow.emit('duplicateLinkCheck');
            });
        });
        /*
            it checks if current account is already linked to the user that this operation will link.
            It finds an account with same user id and account id and if some account is found the link already exists
        */
        workflow.on('duplicateLinkCheck', function(callback) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Verifying duplicate link.`});
            req.app.db.models.Account.findOne({ 'user.id': workflow.user._id, _id: {$ne: req.params.id} }).exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (account) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Another account is already linked to that user.`});
                    workflow.outcome.errors.push('Another account is already linked to that user.');
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });
        /*
            It updates the user with role account data, linking user to current account instance
        */
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Patching user`});
            req.app.db.models.User.findByIdAndUpdate(workflow.user._id, { 'roles.account': req.params.id }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error patching user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('patchAccount');
            });
        });
        /*
        Updates account in order to reference user
        */
        workflow.on('patchAccount', function(callback) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Patching account`});
            req.app.db.models.Account.findByIdAndUpdate(req.params.id, { user: { id: workflow.user._id, name: workflow.user.username } }, { new: true }).exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error patching account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.account = account;
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
    It unlinks user from an account.
    This operation only can be done by root admins and must update both account and user instance in order to unlink reference
    from both sides
    */
    unlinkUser: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting unlink user workflow.`});

        //validates if current user can unlink accounts from users
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating data.`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Current user may not unlink users from accounts. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not unlink users from accounts.');
                return workflow.emit('response');
            }

            workflow.emit('patchAccount');
        });

        //updates account deleting user reference
        workflow.on('patchAccount', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Patching account`});

            //finds account instance
            req.app.db.models.Account.findById(req.params.id).exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!account) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: Account was not found.`});
                    workflow.outcome.errors.push('Account was not found.');
                    return workflow.emit('response');
                }

                //deletes user reference
                var userId = account.user.id;
                account.user = { id: undefined, name: '' };
                account.save(function(err, account) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error saving account. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    workflow.outcome.account = account;
                    workflow.emit('patchUser', userId);
                });
            });
        });

        //updates user deleting account reference
        workflow.on('patchUser', function(id) {
            logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error patching user. Error: ${err.message}`});

            //find user instance
            req.app.db.models.User.findById(id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error: User was not found.`});
                    workflow.outcome.errors.push('User was not found.');
                    return workflow.emit('response');
                }

                //delete role account reference
                user.roles.account = undefined;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },

    /*
        It deletes an account.
        This operation can only be done by root admin users
    */
    delete: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Starting delete account workflow.`});

        //validate if current user is an root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Validating data.`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `admin account api`, message : `Current user may not delete accounts. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not delete accounts.');
                return workflow.emit('response');
            }

            workflow.emit('deleteAccount');
        });

        // delete account instance from database
        workflow.on('deleteAccount', function(err) {
            logClient.Log({ level:"DEBUG", category : `admin account api`, message : `Deleting account.`});

            req.app.db.models.Account.findByIdAndRemove(req.params.id, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `admin account api`, message : `Error finding and removing account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.account = account;
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }
};
module.exports = account;
