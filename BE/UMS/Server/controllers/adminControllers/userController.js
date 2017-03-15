'use strict';

// public api
var user = {
    /*
        Retrieves a set of users attending a set of properties like search, query, pagging and sorting
    */
    find: function (req, res, next) {
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Finding users`});

        req.query.username = req.query.username ? req.query.username : '';
        req.query.limit = req.query.limit ? parseInt(req.query.limit, null) : 20;
        req.query.page = req.query.page ? parseInt(req.query.page, null) : 1;
        req.query.sort = req.query.sort ? req.query.sort : '_id';
        req.query.isActive = req.query.isActive ? req.query.isActive : '';
        req.query.roles = req.query.roles ? req.query.roles : '';

        //build filter object
        var filters = {};
        if (req.query.username) {
            filters.username = new RegExp('^.*?' + req.query.username + '.*$', 'i');
        }

        if (req.query.isActive) {
            filters.isActive = req.query.isActive;
        }

        if (req.query.roles && req.query.roles === 'admin') {
            filters['roles.admin'] = {$exists: true};
        }

        if (req.query.roles && req.query.roles === 'account') {
            filters['roles.account'] = {$exists: true};
        }

        //retrieve paginated, filtered and sorted results
        req.app.db.models.User.pagedFind({
            filters: filters,
            keys: 'username email isActive',
            limit: req.query.limit,
            page: req.query.page,
            sort: req.query.sort
        }, function (err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding users. Error: ${err.message}`});
                return next(err);
            }
            results.filters = req.query;
            res.status(200).json(results);
        });
    },

    /*
        It creates a new user instance on database.
        After validates if data received is valid, an username was received and is a valid string,
        it checks if already exists an user with same username.
        If username was not taken by another user it creates a new user instance with received username.
    */
    create: function (req, res, next) {
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting create users workflow`});

        //must receive an username and it must only use letters, numbers, -, _
        workflow.on('validate', function () {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating user data`});
            if (!req.body.username) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: username is required`});
                workflow.outcome.errors.push('Please enter a username.');
                return workflow.emit('response');
            }

            if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: username must only use letters, numbers, -, _`});
                workflow.outcome.errors.push('only use letters, numbers, -, _');
                return workflow.emit('response');
            }

            workflow.emit('duplicateUsernameCheck');
        });

        //it checks if already exists an user with same username. Cannot exist multiple users with same username
        workflow.on('duplicateUsernameCheck', function () {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Checking duplicate username`});

            req.app.db.models.User.findOne({username: req.body.username}, function (err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding users by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //the username received is already taken by another user
                if (user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: that username is already taken`});
                    workflow.outcome.errors.push('That username is already taken.');
                    return workflow.emit('response');
                }
                workflow.emit('createUser');
            });
        });

        //it creates a new user instance with received username
        workflow.on('createUser', function () {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Creating user`});
            var fieldsToSet = {
                username: req.body.username,
                search: [
                    req.body.username
                ]
            };
            //inserts object in database
            req.app.db.models.User.create(fieldsToSet, function (err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error creating user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.record = user;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
    It retrieves information about only one user.
    It must receive an id as param and finds an user by that id
    */
    read: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Reading users`});
        req.app.db.models.User.findById(req.params.id).populate('roles.admin', 'name.full').populate('roles.account', 'name.full').exec(function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(user);
        });
    },
    /*
        It updates user entity
        Must receive data like username and email and validates it.
        Before proceed with user update it checks if already exists other user instances with same username and email.
        If none users were found it updates user instance and both admin and account roles in order to update references to user
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting update users workflow`});

        //validates received data
        //must receive username and email and they must match with patterns defined for them.
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});
            if (!req.body.isActive) {
                req.body.isActive = 'no';
            }

            if (!req.body.username) {
                workflow.outcome.errfor.username = 'required';
            }
            else if (!/^[a-zA-Z0-9\-\_]+$/.test(req.body.username)) {
                workflow.outcome.errfor.username = 'only use letters, numbers, \'-\', \'_\'';
            }

            if (!req.body.email) {
                workflow.outcome.errfor.email = 'required';
            }
            else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
                workflow.outcome.errfor.email = 'invalid email format';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Invalid data. Error: ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('duplicateUsernameCheck');
        });
        //it checks if already exist other users with same username
        workflow.on('duplicateUsernameCheck', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Checking duplicate username`});
            req.app.db.models.User.findOne({ username: req.body.username, _id: { $ne: req.params.id } }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: username already taken.`});
                    workflow.outcome.errfor.username = 'Username already taken';
                    return workflow.emit('response');
                }

                workflow.emit('duplicateEmailCheck');
            });
        });
        //it checks if already exist other users with same email
        workflow.on('duplicateEmailCheck', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Checking duplicate email`});
            req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.params.id } }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: username already taken`});
                    workflow.outcome.errfor.email = 'email already taken';
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });

        //updates user instance with received data
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});

            var fieldsToSet = {
                isActive: req.body.isActive,
                username: req.body.username,
                email: req.body.email.toLowerCase(),
                search: [
                    req.body.username,
                    req.body.email
                ]
            };
            var options = { new: true }; //so that user returned is the updated not original doc
            req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error patching user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.emit('patchAdmin', user);
            });
        });

        //update admin instance in order to ensure coherence
        workflow.on('patchAdmin', function(user) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching admin`});
            if (user.roles.admin) {
                var fieldsToSet = {
                    user: {
                        id: req.params.id,
                        name: user.username
                    }
                };
                req.app.db.models.Admin.findByIdAndUpdate(user.roles.admin, fieldsToSet, function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error patching admin. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('patchAccount', user);
                });
            }
            else {
                workflow.emit('patchAccount', user);
            }
        });
        //update account instance in order to ensure coherence
        workflow.on('patchAccount', function(user) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching account`});
            if (user.roles.account) {
                var fieldsToSet = {
                    user: {
                        id: req.params.id,
                        name: user.username
                    }
                };
                req.app.db.models.Account.findByIdAndUpdate(user.roles.account, fieldsToSet, function(err, account) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error patching account. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('populateRoles', user);
                });
            }
            else {
                workflow.emit('populateRoles', user);
            }
        });
        //populate user instance with their roles
        workflow.on('populateRoles', function(user) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Populating roles`});
            user.populate('roles.admin roles.account', 'name.full', function(err, populatedUser) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating roles. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.user = populatedUser;
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },

    /*
        It updates user password
        Before patch user it validates if request received a password and its confirmation and if they match.
    */
    password: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting password workflow`});

        //must receive password and its confirmation and they should match
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});
            if (!req.body.newPassword) {
                workflow.outcome.errfor.newPassword = 'required';
            }

            if (!req.body.confirm) {
                workflow.outcome.errfor.confirm = 'required';
            }

            if (req.body.newPassword !== req.body.confirm) {
                workflow.outcome.errors.push('Passwords do not match.');
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"Error", category : `user api`, message : `Invalid data. Error: ${workflow.outcome}`});
                return workflow.emit('response');
            }

            workflow.emit('patchUser');
        });
        /*
            It updates user instances
            Before insert updates on database it encrypts password
        */
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});

            //encrypt password
            req.app.db.models.User.encryptPassword(req.body.newPassword, function(err, hash) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error encrypting password. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //it updates user instance on database
                var fieldsToSet = { password: hash };
                var options = { new: true };
                req.app.db.models.User.findByIdAndUpdate(req.params.id, fieldsToSet, options, function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error patching user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    //it populates user instance with their roles data
                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.user = user;
                        workflow.outcome.newPassword = '';
                        workflow.outcome.confirm = '';
                        workflow.emit('response');

                    });
                });
            });
        });

        workflow.emit('validate');
    },

    /*
        It links user instance with an admin instance.
        It validates if current user can do the operation, if admin is already linked with another user,
        if user already has a link to an admin and only after that the user instance and admin instances are updated
    */
    linkAdmin: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting link admin workflow`});

        //must receive an admin id and current user must be a root admin
        workflow.on('validate', function() {
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not link users to admin. User ${req.user.admin}`});
                workflow.outcome.errors.push('You may not link users to admins.');
                return workflow.emit('response');
            }

            if (!req.body.newAdminId) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: new admin id required`});
                workflow.outcome.errfor.newAdminId = 'required';
                return workflow.emit('response');
            }

            workflow.emit('verifyAdmin');
        });

        //it verifies if admin instance exists and if is already linked with another user instance
        workflow.on('verifyAdmin', function(callback) {
            req.app.db.models.Admin.findById(req.body.newAdminId).exec(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding admin by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!admin) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: admin not found.`});
                    workflow.outcome.errors.push('Admin not found.');
                    return workflow.emit('response');
                }

                if (admin.user.id && admin.user.id !== req.params.id) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: admin is already linked to a different user.`});
                    workflow.outcome.errors.push('Admin is already linked to a different user.');
                    return workflow.emit('response');
                }

                workflow.admin = admin;
                workflow.emit('duplicateLinkCheck');
            });
        });

        //it verifies if user already has a link with an admin instance
        workflow.on('duplicateLinkCheck', function(callback) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Checking duplicate link`});

            req.app.db.models.User.findOne({ 'roles.admin': req.body.newAdminId, _id: {$ne: req.params.id} }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: another user is already linked to that admin.`});
                    workflow.outcome.errors.push('Another user is already linked to that admin.');
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });

        //updates user instance with reference to the admin indicated
        workflow.on('patchUser', function(callback) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});
            //find user
            req.app.db.models.User.findById(req.params.id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //update admin role reference
                user.roles.admin = req.body.newAdminId;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    //populate user with their roles data
                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.user = user;
                        workflow.emit('patchAdmin');
                    });
                });
            });
        });
        //update admin instance in order to ensure coherence
        workflow.on('patchAdmin', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching admin`});
            workflow.admin.user = { id: req.params.id, name: workflow.outcome.user.username };
            workflow.admin.save(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving admin. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },

    /*
        It removes a reference from user to an admin instance
        it validates if current user can do the operation and after that it updates user and admin instance
    */
    unlinkAdmin: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting unlink admin workflow`});

        //current user must be a root admin and cannot unlink itself from admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not unlink from admins. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not unlink users from admins.');
                return workflow.emit('response');
            }

            if (req.user._id + '' === req.params.id) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not be unlinked from admins`});
                workflow.outcome.errors.push('You may not unlink yourself from admin.');
                return workflow.emit('response');
            }

            workflow.emit('patchUser');
        });

        //update user instance
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});
            //find user
            req.app.db.models.User.findById(req.params.id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: user was not found`});
                    workflow.outcome.errors.push('User was not found.');
                    return workflow.emit('response');
                }

                //delete admin reference
                var adminId = user.roles.admin;
                user.roles.admin = null;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.user = user;
                        workflow.emit('patchAdmin', adminId);
                    });
                });
            });
        });

        //update admin instance
        workflow.on('patchAdmin', function(id) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching admin.`});
            //find admin instance
            req.app.db.models.Admin.findById(id).exec(function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding admin by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!admin) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: admin was not found.`});
                    workflow.outcome.errors.push('Admin was not found.');
                    return workflow.emit('response');
                }
                //delete user reference
                admin.user = undefined;
                admin.save(function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving admin. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        It links user instance with an account instance.
        It validates if current user can do the operation, if account is already linked with another user,
        if user already has a link to an accout and only after that the user instance and account instances are updated
    */
    linkAccount: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting link account workflow`});

        //must receive a new account id and current user must be a root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"DEBUG", category : `user api`, message : `Error: current user many not link to accounts. User: ${req.user.id}`});
                workflow.outcome.errors.push('You may not link users to accounts.');
                return workflow.emit('response');
            }

            if (!req.body.newAccountId) {
                logClient.Log({ level:"DEBUG", category : `user api`, message : `Error: new account id is required`});
                workflow.outcome.errfor.newAccountId = 'required';
                return workflow.emit('response');
            }

            workflow.emit('verifyAccount');
        });
        //it verifies if account instance exists and if is already linked with another user instance
        workflow.on('verifyAccount', function(callback) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Verifying account`});

            req.app.db.models.Account.findById(req.body.newAccountId).exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding account by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //account not found
                if (!account) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: account not found.`});
                    workflow.outcome.errors.push('Account not found.');
                    return workflow.emit('response');
                }
                //account is already linked to a different user
                if (account.user.id && account.user.id !== req.params.id) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: account is already linked to a different user.`});
                    workflow.outcome.errors.push('Account is already linked to a different user.');
                    return workflow.emit('response');
                }

                workflow.account = account;
                workflow.emit('duplicateLinkCheck');
            });
        });
        //check if current user is already linked to an account instance
        workflow.on('duplicateLinkCheck', function(callback) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Checking duplicate link`});

            req.app.db.models.User.findOne({ 'roles.account': req.body.newAccountId, _id: {$ne: req.params.id} }).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                //user already linked to another account
                if (user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: another user is already linked to that account`});
                    workflow.outcome.errors.push('Another user is already linked to that account.');
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });
        //update user instance
        workflow.on('patchUser', function(callback) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});

            //find user
            req.app.db.models.User.findById(req.params.id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //update account reference
                user.roles.account = req.body.newAccountId;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    //populate user with their roles
                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.user = user;
                        workflow.emit('patchAccount');
                    });
                });
            });
        });
        //update account instance
        workflow.on('patchAccount', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching account`});
            //update user reference
            workflow.account.user = { id: req.params.id, name: workflow.outcome.user.username };
            workflow.account.save(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        unlink user from account instance
        it validates if user can do the operation and updates user and account instance
    */
    unlinkAccount: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting unlink account workflow`});

        //current user must be a root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});
            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not unlink users from accounts. User: ${err.message}`});

                workflow.outcome.errors.push('You may not unlink users from accounts.');
                return workflow.emit('response');
            }

            workflow.emit('patchUser');
        });
        //update user instance
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching user`});

            req.app.db.models.User.findById(req.params.id).exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding user by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error: user was not found.`});
                    workflow.outcome.errors.push('User was not found.');
                    return workflow.emit('response');
                }

                //delete account reference
                var accountId = user.roles.account;
                user.roles.account = null;
                user.save(function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `user api`, message : `Error populating user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        workflow.outcome.user = user;
                        workflow.emit('patchAccount', accountId);
                    });
                });
            });
        });
        //update account instance
        workflow.on('patchAccount', function(id) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Patching account`});

            req.app.db.models.Account.findById(id).exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error finding account by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!account) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error : account was not found.`});
                    workflow.outcome.errors.push('Account was not found.');
                    return workflow.emit('response');
                }

                //delete user reference from account instance
                account.user = undefined;
                account.save(function(err, account) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `user api`, message : `Error saving account. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('response');
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        it deletes an user instance
    */
    delete: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `user api`, message : `Starting unlink account workflow`});

        //current user must be a root admin
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Validating data`});

            if (!req.user.roles.admin.isMemberOf('root')) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not delete users. User: ${req.user.id}`});

                workflow.outcome.errors.push('You may not delete users.');
                return workflow.emit('response');
            }

            // work around as typeof req.user._id === "Object"
            if (req.user._id + '' === req.params.id) {
                logClient.Log({ level:"ERROR", category : `user api`, message : `Error: current user may not delete himself from user`});
                workflow.outcome.errors.push('You may not delete yourself from user.');
                return workflow.emit('response');
            }

            workflow.emit('deleteUser');
        });
        //delete instance from database
        workflow.on('deleteUser', function(err) {
            logClient.Log({ level:"DEBUG", category : `user api`, message : `Deleting user`});
            req.app.db.models.User.findByIdAndRemove(req.params.id, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `user api`, message : `Error deleting user account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    }
};
module.exports = user;
