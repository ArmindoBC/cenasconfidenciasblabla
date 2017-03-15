'use strict';
// public api
var administrator = {
    /*
        Retrieves a set of administrators attending a set of properties like search, query, pagging and sorting
    */
    find: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Finding administrators.`});

        req.query.search = req.query.search ? req.query.search : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';

        var filters = {};
        if (req.query.search) {
            filters.search = new RegExp('^.*?'+ req.query.search +'.*$', 'i');
        }
        //retrieve paginated results
        req.app.db.models.Admin.pagedFind({
            filters: filters,
            keys: 'name.full',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function(err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding admins. Error: ${err.message}`});
                return next(err);
            }

            results.filters = req.query;
            res.status(200).json(results);
        });
    },
    /*
        It creates a new administrator entity
        It validates the received data and creates a new administrator instance
    */
    create: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting create admins workflow`});

        //revceived data must receive a full name
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating administrators data`});

            if (!req.body['name.full']) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Please enter a name`});
                workflow.outcome.errors.push('Please enter a name.');
                return workflow.emit('response');
            }

            workflow.emit('createAdministrator');
        });

        //creates a new administrator instance on database
        workflow.on('createAdministrator', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Creating administrators.`});

            //builds an administrator object with received data
            var nameParts = req.body['name.full'].trim().split(/\s/);
            var fieldsToSet = {
                name: {
                    first: nameParts.shift(),
                    middle: (nameParts.length > 1 ? nameParts.shift() : ''),
                    last: (nameParts.length === 0 ? '' : nameParts.join(' '))
                }
            };
            fieldsToSet.name.full = fieldsToSet.name.first + (fieldsToSet.name.last ? ' '+ fieldsToSet.name.last : '');
            fieldsToSet.search = [
                fieldsToSet.name.first,
                fieldsToSet.name.middle,
                fieldsToSet.name.last
            ];

            //inserts the administrator object on database
            req.app.db.models.Admin.create(fieldsToSet, function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error creating administrator. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = admin;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Retrives information about an administrator instance.
    */
    read: function(req, res, next){
        var outcome = {};
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting read admins workflow`});

        //get the set of available admin groups
        var getAdminGroups = function(callback) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Finding admin groups`});
            req.app.db.models.AdminGroup.find({}, 'name').sort('name').exec(function(err, adminGroups) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding admin groups. Error: ${err.message}`});
                    return callback(err, null);
                }

                outcome.adminGroups = adminGroups;
                return callback(null, 'done');
            });
        };

        //get account information
        var getRecord = function(callback) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Finding admin by id`});
            req.app.db.models.Admin.findById(req.params.id).populate('groups', 'name').exec(function(err, record) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding admin groups by id. Error: ${err.message}`});
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

        require('async').parallel([getAdminGroups, getRecord], asyncFinally);
    },
    /*
        Updates administrator information.
        It receives a the new data, validates it and patch admin instance
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting update admins workflow`});

        //must receive first and last names
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating admin data`});
            if (!req.body.first) {
                workflow.outcome.errfor.first = 'required';
            }

            if (!req.body.last) {
                workflow.outcome.errfor.last = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Invalid admin data. Error: ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('patchAdministrator');
        });

        //patch administrator: it updates admin instance with new data.
        workflow.on('patchAdministrator', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching administrators`});
            //build new account object
            var fieldsToSet = {
                name: {
                    first: req.body.first,
                    middle: req.body.middle,
                    last: req.body.last,
                    full: req.body.first +' '+ req.body.last
                },
                search: [
                    req.body.first,
                    req.body.middle,
                    req.body.last
                ]
            };

            //update data
            var options = { new: true };
            req.app.db.models.Admin.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error patching administrator. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                admin.populate('groups', 'name', function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error populating groups. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.outcome.admin = admin;
                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        It receives a set of groups and updates admin instance in order become part of received Groups
        It validates if groups data were received and if the request user is an admin
    */
    groups: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting groups administrators workflow`});

        //validates data
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating data.`});
            //user must be member of root admin group
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Current user may not change the group membership of admins. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not change the group memberships of admins.');
                return workflow.emit('response');
            }

            //must receive a set of groups
            if (!req.body.groups) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Invalid data. Error: groups required`});
                workflow.outcome.errfor.groups = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAdministrator');
        });

        //update administrators instance with references to the received groups
        workflow.on('patchAdministrator', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching administrator.`});

            var fieldsToSet = {
                groups: req.body.groups
            };
            var options = { new: true };
            req.app.db.models.Admin.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error patching administrators. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //populate account instance with created groups information
                admin.populate('groups', 'name', function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error populating group administrators. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.outcome.admin = admin;
                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        it updates administrator permissions
        it checks if a current user is a root admin and if were received permissions
    */
    permissions: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting permissions administrators workflow`});

        //validates received data
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating data`});

            //checks if current user is a root admin
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Current user may not change the permissions of admins. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not change the permissions of admins.');
                return workflow.emit('response');
            }

            //checks if permissions information were received
            if (!req.body.permissions) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Invalid data. permissions required`});
                workflow.outcome.errfor.permissions = 'required';
                return workflow.emit('response');
            }

            workflow.emit('patchAdministrator');
        });

        //update administrator instance
        workflow.on('patchAdministrator', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching administrators`});

            //build new information object
            var fieldsToSet = {
                permissions: req.body.permissions
            };
            //updates on database
            var options = { new: true };
            req.app.db.models.Admin.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, admin) {
                if (err) {
                    return workflow.emit('exception', err);
                }

                //populate administrator data with groups information
                admin.populate('groups', 'name', function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error populating group administrators. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.outcome.admin = admin;
                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        It links admin  instance to an user instance.
    */
    linkUser: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting link users workflow`});
        /*
            Validates the operation.
            Only root admins can do this operation and request must receive a new username to link account
        */
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Current user may not link admins to users. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not link admins to users.');
                return workflow.emit('response');
            }

            if (!req.body.newUsername) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Invalid data, new username required.`});
                workflow.outcome.errfor.newUsername = 'required';
                return workflow.emit('response');
            }

            workflow.emit('verifyUser');
        });
        /*
            It verifies if user referenced by received username exists and if does not have other admin instance linked
        */
        workflow.on('verifyUser', function(callback) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Verifying user`});
            req.app.db.models.User.findOne({ username: req.body.newUsername }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: user not found.`});
                    workflow.outcome.errors.push('User not found.');
                    return workflow.emit('response');
                }
                else if (user.roles && user.roles.admin && user.roles.admin !== req.params.id) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: User is already linked to a different admin.`});
                    workflow.outcome.errors.push('User is already linked to a different admin.');
                    return workflow.emit('response');
                }

                workflow.user = user;
                workflow.emit('duplicateLinkCheck');
            });
        });
        /*
            it checks if current admin instance is already linked to the user that this operation will link.
            It finds an admin with same user id and admin id and if some admin is found the link already exists
        */
        workflow.on('duplicateLinkCheck', function(callback) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Checking duplicate link`});
            req.app.db.models.Admin.findOne({ 'user.id': workflow.user._id, _id: { $ne: req.params.id } }).exec(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding admin. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (admin) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Another admin is already linked to that user`});
                    workflow.outcome.errors.push('Another admin is already linked to that user.');
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });
        /*
            It updates the user with role admin data, linking user to current admin instance
        */
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching user`});
            req.app.db.models.User.findByIdAndUpdate(workflow.user._id, { 'roles.admin': req.params.id }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.emit('patchAdministrator');
            });
        });
        /*
        Updates admin in order to reference user
        */
        workflow.on('patchAdministrator', function(callback) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching administrator`});
            req.app.db.models.Admin.findByIdAndUpdate(req.params.id, { user: { id: workflow.user._id, name: workflow.user.username } }, { new: true }).exec(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding admin. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                admin.populate('groups', 'name', function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error populating admin. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.outcome.admin = admin;
                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
    It unlinks user from an admin instance.
    This operation only can be done by root admins and must update both admin and user instance in order to unlink reference
    from both sides
    */
    unlinkUser: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting unlink user workflow`});

        //validates if current user can unlink admins from users
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: current user may not unlink users from admins. User: ${req.user.id}`});

                workflow.outcome.errors.push('You may not unlink users from admins.');
                return workflow.emit('response');
            }

            if (req.user.roles.admin._id + '' === req.params.id) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: current user may not unlink from admin. User: ${req.user.id}`});

                workflow.outcome.errors.push('You may not unlink yourself from admin.');
                return workflow.emit('response');
            }

            workflow.emit('patchAdministrator');
        });

        //updates admin deleting user reference
        workflow.on('patchAdministrator', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching administrator`});
            //finds account instance
            req.app.db.models.Admin.findById(req.params.id).exec(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error patching admin. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!admin) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: Administrator was not found.`});
                    workflow.outcome.errors.push('Administrator was not found.');
                    return workflow.emit('response');
                }
                //deletes user reference
                var userId = admin.user.id;
                admin.user = { id: undefined, name: ''};
                admin.save(function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error saving admin. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    admin.populate('groups', 'name', function(err, admin) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error populating admin. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.admin = admin;
                        workflow.emit('patchUser', userId);
                    });
                });
            });
        });

        //updates user deleting admin reference
        workflow.on('patchUser', function(id) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Patching user`});
            //find user instance
            req.app.db.models.User.findById(id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: user was not found.`});
                    workflow.outcome.errors.push('User was not found.');
                    return workflow.emit('response');
                }

                //delete role account reference
                user.roles.admin = undefined;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        It deletes an admin instance.
        This operation can only be done by root admin users
    */
    delete: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Starting delete administrator workflow`});

        //validate if current user is an root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Validating data`});
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: current user may not delete admins. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not delete admins.');
                return workflow.emit('response');
            }
            if (req.user.roles.admin._id + '' === req.params.id) { //convert ObjectId to String
                logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error: current user may own admin record.`});
                workflow.outcome.errors.push('You may not delete your own admin record.');
                return workflow.emit('response');
            }

            workflow.emit('deleteAdministrator');
        });

        // delete admin instance from database
        workflow.on('deleteAdministrator', function(err) {
            logClient.Log({ level:"DEBUG", category : `administrators api`, message : `Deleting administrator`});
            req.app.db.models.Admin.findByIdAndRemove(req.params.id, function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `administrators api`, message : `Error removing administrator. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }
};
module.exports = administrator;
