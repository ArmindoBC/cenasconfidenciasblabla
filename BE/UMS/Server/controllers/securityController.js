'use strict';
var helper = require('../helpers/controllers/common.js');

/**
*   Method responsible for social login with providers like google, facebook, linkedin and prepared for other kind of providers.
*   This method can have 2 behaviours:
        * called from login server backoffice through http GET method, which redirects to the authentication page and collecting social data.
        * called from api, with http POST method, receiving social data. With this behaviour it does not trigger redirects
    When social data is available it tries to find a pre existing user in our database or creates all workflow in order to create a new instance on own database
**/
var socialLogin = function(provider, req, res, next){
    var logClient = req.app.utility.logClient;
    logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Starting social login workflow for provider ${provider}`});

    provider = provider.toLowerCase();
    var workflow = req.app.utility.workflow(req, res);

    workflow.on('authUser', function(){
        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Authenticating user with provider ${provider}`});

        if(req.method === 'POST'){
            //called through POST with social data in body.
            if (!req.body) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `${provider} user data not found`});


                return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Error', message: 'Social user data not found.'}, function(err){
                    if(err){
                        return workflow.emit('exception', err);
                    }
                    workflow.outcome.errors.push(provider + ' user data not found');
                    return workflow.emit('response');
                })
            }
            workflow.profile = req.body;
            return workflow.emit('findUser');
        }
        else{
            //redirects to authentication page of social provider and collects its data
            req._passport.instance.authenticate(provider, { callbackURL: helper.getSocialCallbackUrl(req.app.config.serverAddress, provider)}, function(err, user, info) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error authenticating with ${provider} provider. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!info || !info.profile) {
                    logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `${provider} user data not found`});

                    return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Error', message: 'Social user data not found'}, function(err){
                        if(err){
                            return workflow.emit('exception', err);
                        }
                        workflow.outcome.errors.push(provider + ' user data not found');
                        return workflow.emit('response');
                    })
                }
                workflow.profile = info.profile;
                return workflow.emit('findUser');
            })(req, res, next);
        }
    });

    /*
        It uses data retrieved by social provider to check if already exists an user in database related to current social user.
        If an user is found a workflow is started in order to collect all data do send to user.
        If does not exist an user another workflow is started to create a new instance in database or link to another existing instance
    */
    workflow.on('findUser', function(){

        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Finding existing ${provider} user in our database`});

        var option = {};
        option[provider+'.id'] = workflow.profile.id;
        req.app.db.models.User.findOne(option, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error finding ${provider} user by provider id. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }

            if (!user) {
                //none user was found
                return workflow.emit('duplicateEmailCheck');
            }
            else {
                //user exists and is linked to provider
                workflow.user = user;
                return workflow.emit('populateUser');
            }
        });
    });

    /*
        It checks if exist an user with same email.
        If it exists is started a workflow to link user to an existing instance.
        If not exists a new search is initiated atending username
    */
    workflow.on('duplicateEmailCheck', function() {

        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Checking duplicate email for ${provider} user`});

        workflow.email = workflow.profile.emails && workflow.profile.emails[0].value || '';
        if(!workflow.email){
            return workflow.emit('duplicateUsernameCheck');
        }
        req.app.db.models.User.findOne({ email: workflow.email.toLowerCase() }, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error finding ${provider} user by email. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }

            if (user) {
                //user/account exists but not yet linked
                workflow.user = user;
                return workflow.emit('linkUser');
            }
            //none user was found
            return workflow.emit('duplicateUsernameCheck');
        });
    });

    /*
        It checks if exist an user with same username.
        If it exists is started a workflow to link user to an existing instance.
        If not exists a new workflow starts in order to create a new user
    */
    workflow.on('duplicateUsernameCheck', function(){

        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Checking duplicate username for ${provider} user`});

        workflow.username = workflow.profile.username || (workflow.profile.emails && workflow.profile.emails[0].value || workflow.profile.id);

        if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
            workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
        }

        req.app.db.models.User.findOne({ username: workflow.username }, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error finding ${provider} user by username. Error: ${err.message}`});

                return helper.createActivityHistory(req, {machineName: req.app.config.hostname, category: 'Error', message: 'Error findind User by provider id'}, function(err){
                    if(err){
                        return workflow.emit('exception', err);
                    }
                    return workflow.emit('exception', err);
                })

            }

            if (user) {
                workflow.username = workflow.username + workflow.profile.id;
            }
            else {
                workflow.username = workflow.username;
            }
            //none user was found
            return workflow.emit('createUser');
        });
    });

    /*
        It creates a new user instance using social data received.
        It uses social data to fill informations like username and email
    */
    workflow.on('createUser', function(){

        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Creating user instance with ${provider} data`});

        var fieldsToSet = {
            isActive: 'yes',
            username: workflow.username,
            email: workflow.email.toLowerCase(),
            search: [
                workflow.username,
                workflow.email
            ]
        };

        //links account by saving social profile retrieved from social profile provider i.e. google
        fieldsToSet[workflow.profile.provider] = {
            id: workflow.profile.id,
            profile: workflow.profile
        };

        //creates a new user instance with social data included
        req.app.db.models.User.create(fieldsToSet, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error creating user instance with ${provider} data. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            workflow.user = user;
            return workflow.emit('createAccount');
        });
    });

    /*
        It creates a new account instance and updates user roles with account data
    */
    workflow.on('createAccount', function(){
        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Creating account instance with ${provider} data`});

        var displayName = workflow.profile.displayName || '';
        var nameParts = displayName.split(' ');
        var fieldsToSet = {
            isVerified: 'yes',
            'name.first': nameParts[0],
            'name.last': nameParts[1] || '',
            'name.full': displayName,
            user: {
                id: workflow.user._id,
                name: workflow.user.username
            },
            search: [
                nameParts[0],
                nameParts[1] || ''
            ],
            groups : req.body.groups
        };
        helper.createAccountAndUpdateUser(req, fieldsToSet, workflow.user, function(err, user){
            if(err){
                return workflow.emit('exception', err);
            }
            else{
                return workflow.emit('sendWelcomeEmail');
            }
        });
    });

    /*
        It sends an welcome email to the new registered user
    */
    workflow.on('sendWelcomeEmail', function() {

        helper.sendWelcomeEmail(req,res, workflow.user.username, workflow.email, function(err){
            workflow.emit('populateUser');
        });

    });
    /**
        It links social data received to a pre existing user instance that belongs to the same person
    */
    workflow.on('linkUser', function(){
        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Linking existing user to social provider`});

        workflow.user[workflow.profile.provider] = {
            id: workflow.profile.id,
            profile: workflow.profile
        };

        //link existing user to social provider
        helper.saveLinkUser(req, workflow.user, function(err, user){
            if(err){
                return workflow.emit('exception', err);
            }
            else{
                workflow.user = user;
                return workflow.emit('populateUser');
            }
        })
    });

    /*
        It populates user instance with all roles data ( admin and account )
    */
    workflow.on('populateUser', function(){
        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Populating user.`});

        var user = workflow.user;

        //gets data about admin and account and append it to user instance
        user.populate('roles.admin roles.account', function(err, user){
            if(err){
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error populating user with roles data. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            if (user && user.roles && user.roles.admin) {
                //it populates admin role with its groups information
                user.roles.admin.populate("groups", function(err, admin) {
                    if(err){
                        logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error populating user with groups data. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    workflow.user = user;
                    return workflow.emit('logUserIn');
                });
            }
            else {
                workflow.user = user;
                return workflow.emit('logUserIn');
            }
        });
    });

    /*
        It logs user in system.
        This step is useful for backoffice interface in order to create a new session on server storing user data.
        when a new user is logged in it also starts a workflow step in order to create a new user session instance

    */
    workflow.on('logUserIn', function(){
        logClient.Log({ level:"DEBUG", category : `social login ${provider}`, message : `Log user in.`});
        req.login(workflow.user, function(err) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `social login ${provider}`, message : `Error in user login. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            workflow.outcome.defaultReturnUrl = workflow.user.defaultReturnUrl();
            workflow.outcome.user = helper.filterUser(req.user);

            return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Login',user:workflow.user.id, message: `Successfully social login with ${provider} account`}, function(err){
                if(err){
                    return workflow.emit('exception', err);
                }
                return workflow.emit('createUserSession');
            })
        });
    });
    /*
        It creates a new user session instance.
        It is usefull for REST API clients as it creates a session token that can be used to authorize requests.
        If succeeds response is sent to client with an user token instance.
    */
    workflow.on('createUserSession', function(){
        helper.createUserSession(req, workflow.user, function(err, tokenSessionInstance){
            if(err){
                 workflow.emit('exception', err);
            }
            // sends token session instance to client in response
            workflow.outcome.userSession = tokenSessionInstance;
            //delete workflow.outcome.user;
            logClient.Log({ level:"INFO", category : `user session`, message : `Log user in Successfully.`});
            workflow.emit('response');
        });
    })
    workflow.emit('authUser');
};



var security = {

/*
    It receives an authenticated request which has an authorization token and finds to which user it belongs
    retrieving current user data.
*/
    sendCurrentUser: function (req, res, next) {
        var workflow = req.app.utility.workflow(req, res);
        if(req.headers.authorization === undefined){
            return res.json({user:null});
        }
        var credentials = req.headers.authorization.split(' ');
        if(credentials[0] != 'Bearer'){
            req.app.utility.logClient.Log({ level:"ERROR", category : `find current user`, message : `Error: authorization scheme must follow Bearer strategy.`});
            workflow.outcome.errors.push(`Error: authorization scheme must follow Bearer strategy.`);
            return workflow.emit('response');
        }

        helper.findCurrentUserByAuthTokenWorkflow(req.app, credentials[1],workflow, 'validate','response');
        workflow.emit('validate');
    },
/*
    It receives data about a new local user.
    Validates received data, checks if already exists users with same email or username and if not exists it creates a new user instance,
    a new account role instance, send welcome email,log user in and creates a new user session.
*/
    signup: function(req, res){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `local signup`, message : `Starting signup workflow for local accounts.`});

        var workflow = req.app.utility.workflow(req, res);

        /*
            It validates received data. To create signup it is necessary to receive an username, an email, and a password
        */
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `Validating user data`});

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

            if (!req.body.password) {
                workflow.outcome.errfor.password = 'required';
            }

            if (workflow.hasErrors()) {
                return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Error', message: `Invalid user data.`}, function(err){
                    if(err){
                        return workflow.emit('exception', err);
                    }
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Invalid user data: Error: ${workflow.outcome.errfor}`});
                    return workflow.emit('response');
                })
            }
            workflow.emit('duplicateUsernameCheck');
        });

        /*
            It checks if already exists an user with same username. Cannot exist multiple instances with same username.
        */
        workflow.on('duplicateUsernameCheck', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `Checking duplicate username`});

            req.app.db.models.User.findOne({ username: req.body.username }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Error finding user by username. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    logClient.Log({ level:"DEBUG", category : `local signup`, message : `Username already taken`});
                    workflow.outcome.errfor.username = 'Username already taken';
                    return workflow.emit('response');
                }

                workflow.emit('duplicateEmailCheck');
            });
        });
        /*
            It checks if already exists an user with same email. Cannot exist multiple instances with same email.
        */
        workflow.on('duplicateEmailCheck', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `Checking duplicate email`});

            req.app.db.models.User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Error finding user by email. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Error: email already registered`});
                    workflow.outcome.errfor.email = 'email already registered';
                    return workflow.emit('response');
                }

                workflow.emit('createUser');
            });
        });

        /*
            Create a user instance using data received in signup action.
        */
        workflow.on('createUser', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `Creating user instance`});

            //encryptPassword before store it in database
            req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Error in password encryption. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                var fieldsToSet = {
                    isActive: 'yes',
                    username: req.body.username,
                    email: req.body.email.toLowerCase(),
                    password: hash,
                    search: [
                        req.body.username,
                        req.body.email
                    ]
                };
                req.app.db.models.User.create(fieldsToSet, function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `local signup`, message : `Error creating user instance. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.user = user;
                    workflow.emit('createAccount');
                });
            });
        });
        /*
            Creates an account instance to link it to created user instance.
            All registered users must have an account role that extends its information and to be considered a system costumer.
        */
        workflow.on('createAccount', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `Creating account instance`});

            var fieldsToSet = {
                isVerified: req.app.config.requireAccountVerification ? 'no' : 'yes',
                'name.full': workflow.user.username,
                user: {
                    id: workflow.user._id,
                    name: workflow.user.username
                },
                search: [
                    workflow.user.username
                ],
                groups : req.body.groups
            };
            /*
                creates a new account instance and update user with created data
            */
            helper.createAccountAndUpdateUser(req, fieldsToSet, workflow.user, function(err, user){
                if(err){
                    return workflow.emit('exception', err);
                }
                else{
                    return workflow.emit('sendWelcomeEmail');
                }
            });
        });
        /*
            send an welcome email to the created user
        */
        workflow.on('sendWelcomeEmail', function() {
            helper.sendWelcomeEmail(req,res, req.body.username, req.body.email, function(err){
                workflow.emit('logUserIn');
            });
        });
        /*
            Logs user in. It creates a server session allowing user to mantain data between requests.
            It is usefull for backoffice allowing users to navigate logged
        */
        workflow.on('logUserIn', function() {
            logClient.Log({ level:"DEBUG", category : `local signup`, message : `User login in`});

            //authenticate with local account
            req._passport.instance.authenticate('local', function(err, user, info) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Error authenticating local user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    logClient.Log({ level:"ERROR", category : `local signup`, message : `Login failed, no user found`});
                    workflow.outcome.errors.push('Login failed. That is strange.');
                    return workflow.emit('response');
                }
                else {
                    //creates server session
                    req.login(user, function(err) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `local signup`, message : `Error in log user in. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }
                        return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Login',user:req.user.id, message: 'Social login successfuly'}, function(err){
                            if(err){
                                return workflow.emit('exception', err);
                            }
                            workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();
                            workflow.emit('createUserSession');
                        });
                    });
                }
            })(req, res);
        });
        /*
            Creates a user session instance.
            It is retrived an session token to the external clients in order to be used to authorize requests when used throw REST API.
        */
        workflow.on('createUserSession', function(){
            helper.createUserSession(req, req.user, function(err, tokenSessionInstance){
                if(err){
                     workflow.emit('exception', err);
                }
                // sends token session instance to client in response
                workflow.outcome.userSession = tokenSessionInstance;
                delete workflow.outcome.user;
                logClient.Log({ level:"INFO", category : `local signup`, message : `Log user in Successfully.`});
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Used to accomplish local accounts login.
        It checks if all necessary data was received to login user, checks abuse filter in order to know if current user is trying to login in the system
        a high number of times, in order to block abusive use.
        If all works as expected it attempts to login user with local account and creates a new user session instance.
    */
    login: function(req, res){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `local login`, message : `Starting login workflow for local accounts.`});

        var workflow = req.app.utility.workflow(req, res);
        //validate received data. must contain an username and a password
        workflow.on('validate', function() {
            if (!req.body.username) {
                workflow.outcome.errfor.username = 'required';
            }

            if (!req.body.password) {
                workflow.outcome.errfor.password = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `local login`, message : `Invalid user data. Error: ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('abuseFilter');
        });
        //checks if current client is trying to log in a high number of times
        workflow.on('abuseFilter', function() {
            helper.checkAbuseFilterWorkflow(req, workflow, 'attemptLogin');
        });
        //attempt login with local account credentials
        workflow.on('attemptLogin', function() {
            logClient.Log({ level:"DEBUG", category : `local login`, message : `Attemping login`});

            //authenticate user with local credentials
            req._passport.instance.authenticate('local', function(err, user, info) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `local login`, message : `Error authentication local user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    //User not found, insert an instance of login attempt atending request ip and username
                    var fieldsToSet = { ip: req.ip, user: req.body.username };
                    req.app.db.models.LoginAttempt.create(fieldsToSet, function(err, doc) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `local login`, message : `Error authentication local user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        logClient.Log({ level:"ERROR", category : `local login`, message : `Username and password combination not found or your account is inactive.`});
                        workflow.outcome.errors.push('Username/email and password combination not found or your account is inactive.');
                        return workflow.emit('response');
                    });
                }
                else {
                    //create a server session
                    req.login(user, function(err) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `local login`, message : `Error in login. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }
                        workflow.outcome.user = helper.filterUser(req.user);
                        workflow.outcome.defaultReturnUrl = user.defaultReturnUrl();

                        return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Login',user:req.user.id, message: 'Successfully login'}, function(err){
                            if(err){
                                return workflow.emit('exception', err);
                            }
                            logClient.Log({ level:"INFO", category : `reset password`, message : `Successfuly login`});
                            workflow.emit('createUserSession');
                        });
                    });
                }
            })(req, res);
        });
        /*
            create a user session instance retriving it to the client
        */
        workflow.on('createUserSession', function(){
            helper.createUserSession(req, workflow.outcome.user, function(err, tokenSessionInstance){
                if(err){
                     workflow.emit('exception', err);
                }
                // sends token session instance to client in response
                workflow.outcome.userSession = tokenSessionInstance;
                delete workflow.outcome.user;
                logClient.Log({ level:"INFO", category : `local login`, message : `Log user in Successfully.`});
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        It receives Active Directory credentials, checks abuse login attempts, and if a user is found it tries to find it on our database checking
        if already exists. If still not exists that user in our database a new user and account instance is created, checking if username and email already exists,
        and after populate user and create a new user session
    */
    loginAD: function(req, res){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `ad login`, message : `Starting login workflow for Active Directory accounts.`});

        var workflow = req.app.utility.workflow(req, res);
        //validate data. must contain username and password
        workflow.on('validate', function() {
            if (!req.body.username) {
                workflow.outcome.errfor.username = 'required';
            }

            if (!req.body.password) {
                workflow.outcome.errfor.password = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `ad login`, message : `Invalid user data. Error: ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('abuseFilter');
        });
        //check if client has done a high number of attempts
        workflow.on('abuseFilter', function() {
            helper.checkAbuseFilterWorkflow(req, workflow, 'attemptLogin');
        });
        //authenticate user in ldap system
        workflow.on('attemptLogin', function() {
            logClient.Log({ level:"DEBUG", category : `ad login`, message : `Attemping login`});
            req._passport.instance.authenticate('ldapauth', function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `ad login`, message : `Error authentication ad user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                if (!user) {
                    //none user was found. Create a new Login attempt instance
                    var fieldsToSet = { ip: req.ip, user: req.body.username };
                    req.app.db.models.LoginAttempt.create(fieldsToSet, function(err, doc) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `ad login`, message : `Error authentication local user. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

                        logClient.Log({ level:"ERROR", category : `ad login`, message : `Username and password combination not found.`});
                        workflow.outcome.errors.push('Username/email and password combination not found.');
                        return workflow.emit('response');
                    });
                }
                user.provider = "activeDirectory";
                workflow.profile = user;
                return workflow.emit('findUser');
            })(req, res);
        });
        /*
            Check if exists an user already registered with same active directory credentials
        */
        workflow.on('findUser', function(){
            logClient.Log({ level:"DEBUG", category : `ad login`, message : `Finding existing ad user in our database`});

            var option = {};
            option[workflow.profile.provider +'.id'] = workflow.profile.sAMAccountName;
            req.app.db.models.User.findOne(option, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `AD login`, message : `Error finding ad user by provider id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                if (!user) {
                    return workflow.emit('duplicateEmailCheck');
                }
                else {
                    //user exists and is linked to provider
                    workflow.user = user;
                    return workflow.emit('populateUser');
                }
            });
        });
        /*
            Check if already exists an user instance with same registered email.
            If exists the new user data is linked to an exisiting user account
        */
        workflow.on('duplicateEmailCheck', function() {
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Checking duplicate email for ad user`});

            workflow.email = workflow.profile.userPrincipalName;

            if(!workflow.email){
                return workflow.emit('duplicateUsernameCheck');
            }
            req.app.db.models.User.findOne({ email: workflow.email.toLowerCase() }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `AD login`, message : `Error finding ad user by email. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (user) {
                    //user/account exists but not yet linked
                    workflow.user = user;
                    return workflow.emit('linkUser');
                }
                return workflow.emit('duplicateUsernameCheck');
            });
        });
        /*
            Link active directory data to a existing user
        */
        workflow.on('linkUser', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Linking existing user to social provider`});

            workflow.user[workflow.profile.provider] = {
                id: workflow.profile.sAMAccountName,
                profile: workflow.profile
            };

            //link existing user to active directory provider
            helper.saveLinkUser(req, workflow.user, function(err, user){
                if(err){
                    return workflow.emit('exception', err);
                }
                else{
                    workflow.user = user;
                    return workflow.emit('populateUser');
                }
            })
        });
        /*
            Check if already exists an user instance with same registered username.
            If exists a new username is built
        */
        workflow.on('duplicateUsernameCheck', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Checking duplicate username for ad user`});

            workflow.username = workflow.profile.sAMAccountName;
            if (!/^[a-zA-Z0-9\-\_]+$/.test(workflow.username)) {
                workflow.username = workflow.username.replace(/[^a-zA-Z0-9\-\_]/g, '');
            }

            req.app.db.models.User.findOne({ username: workflow.username }, function(err, user) {
                if (err) {
                    return helper.createActivityHistory(req, {machineName: req.app.config.hostname, category: 'Error', message: 'Error findind User by provider id'}, function(err){
                        if(err){
                            return workflow.emit('exception', err);
                        }
                        logClient.Log({ level:"ERROR", category : `AD login`, message : `Error finding ad user by username. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    });
                }

                if (user) {
                    workflow.username = workflow.username + workflow.profile.sAMAccountName;
                }
                else {
                    workflow.username = workflow.username;
                }

                return workflow.emit('createUser');
            });
        });
        /*
            Create a new user instance with active directory data
        */
        workflow.on('createUser', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Creating user instance with ad data`});

            var fieldsToSet = {
                isActive: 'yes',
                username: workflow.username,
                email: workflow.email.toLowerCase(),
                search: [
                    workflow.username,
                    workflow.email
                ]
            };

            //links account by saving profile retrieved from sactive directory provider
            fieldsToSet[workflow.profile.provider] = {
                id: workflow.profile.sAMAccountName,
                profile: workflow.profile
            };

            req.app.db.models.User.create(fieldsToSet, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `AD login`, message : `Error creating user instance with ad data. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.user = user;
                return workflow.emit('createAccount');
            });
        });
        /*
            Create a new account instance with active directory data
        */
        workflow.on('createAccount', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Creating account instance with AD data`});

            var displayName = workflow.profile.name || '';
            var nameParts = displayName.split(' ');
            var fieldsToSet = {
                isVerified: 'yes',
                'name.first': nameParts[0],
                'name.last': nameParts[1] || '',
                'name.full': displayName,
                user: {
                    id: workflow.user._id,
                    name: workflow.user.username
                },
                search: [
                    nameParts[0],
                    nameParts[1] || ''
                ]
            };
            //create account and update user with account identifier
            helper.createAccountAndUpdateUser(req, fieldsToSet, workflow.user, function(err, user){
                if(err){
                    return workflow.emit('exception', err);
                }
                else{
                    return workflow.emit('sendWelcomeEmail');
                }
            });
        });
        /*
            Send a welcome email to the new registered user
        */
        workflow.on('sendWelcomeEmail', function() {
            helper.sendWelcomeEmail(req,res, workflow.user.username, workflow.email, function(err){
                workflow.emit('populateUser');
            });
        });
        /*
            Populate user instance with roles data including their own groups
        */
        workflow.on('populateUser', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Populating user.`});

            var user = workflow.user;
            //populate user with roles data.
            user.populate('roles.admin roles.account', function(err, user){
                if(err){
                    logClient.Log({ level:"ERROR", category : `AD login`, message : `Error populating user with roles data. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                if (user && user.roles && user.roles.admin) {
                    //populate admin instance with admin groups data.
                    user.roles.admin.populate("groups", function(err, admin) {
                        if(err){
                            logClient.Log({ level:"ERROR", category : `AD login`, message : `Error populating user with groups data. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }
                        workflow.user = user;
                        return workflow.emit('logUserIn');
                    });
                }
                else {
                    workflow.user = user;
                    return workflow.emit('logUserIn');
                }
            });
        });
        /*
            Create a new server session in order to store user information between their navigation in backoffice
        */
        workflow.on('logUserIn', function(){
            logClient.Log({ level:"DEBUG", category : `AD login`, message : `Log user in.`});
            req.login(workflow.user, function(err) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `AD login`, message : `Error in user login. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.outcome.defaultReturnUrl = workflow.user.defaultReturnUrl();
                workflow.outcome.user = helper.filterUser(req.user);

                return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Login',user:workflow.user.id, message: `Successfully social login with AD account`}, function(err){
                    if(err){
                        return workflow.emit('exception', err);
                    }
                    workflow.emit('createUserSession');
                });
            });
        });
        /*
            Create a new user session instance, retrieving a session token to clients authenticate their requests to REST API
        */
        workflow.on('createUserSession', function(){
            helper.createUserSession(req, workflow.user, function(err, tokenSessionInstance){
                if(err){
                     workflow.emit('exception', err);
                }
                // sends token session instance to client in response
                workflow.outcome.userSession = tokenSessionInstance;
                delete workflow.outcome.user;
                logClient.Log({ level:"INFO", category : `AD login`, message : `Log user in Successfully.`});
                workflow.emit('response');
            });
        })
        workflow.emit('validate');
    },
    /*
        Invalidates user session.
        It searches by user session to which belongs the authorization token received and invalidates it, changing its expiration time to current time.
    */
    logout: function(req, res){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `external logout`, message : `Starting external logout workflow.`});

        /*
            Analize authorization header and retrieves the session token.
            It also checks if the authorization token received follows Beared strategy
        */
        workflow.on('catchCredentials', function(){
            logClient.Log({ level:"DEBUG", category : `external logout`, message : `Catching credentials from http headers.`});

            if (!req.headers.authorization) {
                logClient.Log({ level:"ERROR", category : `external logout`, message : `Error: no credentials received.`});
                workflow.outcome.errors.push(`Error: no credentials received.`);
                return workflow.emit('response');

            } else {
                helper.validateAuthHeader(req.headers.authorization, workflow, "invalidateToken");
            }
        });
        /*
            Update user session instance changing expiration time to current time.
        */
        workflow.on('invalidateToken', function(){
            logClient.Log({ level:"DEBUG", category : `external logout`, message : `Invalidating user session.`});

            var conditions = {
                token : workflow.token
            }
            var fieldsToSet = {
                expirationDate: Date.now()
            };
            req.app.db.models.UserSession.findOneAndUpdate(conditions, fieldsToSet, function(err, usersession) {
                if(err){
                    logClient.Log({ level:"ERROR", category : `forgot password`, message : `Error finding and updating user session. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                if(!usersession){
                    logClient.Log({ level:"ERROR", category : `external logout`, message : `Invalid request: user session not found.`});
                    workflow.outcome.errors.push(`Invalid request: user session not found.`);
                    return workflow.emit('response');
                }
                return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Logout',user:usersession.user.id, message: 'Successfully logout'}, function(err){
                    if(err){
                        return workflow.emit('exception', err);
                    }
                    return workflow.emit('response');
                });

            });
        });

        workflow.emit('catchCredentials');

    },
    loginGoogle: function(req, res, next){
        return socialLogin('google', req, res, next);
    },
    loginFacebook: function(req, res, next){
        return socialLogin('facebook', req, res, next);
    },
    loginLinkedIn: function(req, res, next){
        return socialLogin('linkedin', req, res, next);
    },
    /*
        It starts a forgot password workflow.
        User sends an email and it is generated a reset password token that is sent by email to the owner
    */
    forgotPassword: function(req, res, next){

        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `forgot password`, message : `Starting forgot workflow.`});

        // validates if an email was received
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `forgot password`, message : `Validating data received.`});

            if (!req.body.email) {
                logClient.Log({ level:"ERROR", category : `local login`, message : `Error in login. Error: ${err.message}`});
                workflow.outcome.errfor.email = 'required';
                return workflow.emit('response');
            }
            workflow.emit('generateToken');
        });

        //generate a reset password token that needs to be used to reset password
        workflow.on('generateToken', function() {
            logClient.Log({ level:"DEBUG", category : `forgot password`, message : `Generating token.`});

            var crypto = require('crypto');
            crypto.randomBytes(21, function(err, buf) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `forgot password`, message : `Error creating crypt buffer. Error: ${err.message}`});
                    return next(err);
                }

                var token = buf.toString('hex');
                req.app.db.models.User.encryptPassword(token, function(err, hash) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `forgot password`, message : `Error in password encryption. Error: ${err.message}`});
                        return next(err);
                    }

                    workflow.emit('patchUser', token, hash);
                });
            });
        });
        //stores reset token and its expire date in user instance
        workflow.on('patchUser', function(token, hash) {
            logClient.Log({ level:"DEBUG", category : `forgot password`, message : `Patching user.`});

            var conditions = { email: req.body.email.toLowerCase() };
            var fieldsToSet = {
                resetPasswordToken: hash,
                resetPasswordExpires: Date.now() + 10000000
            };
            req.app.db.models.User.findOneAndUpdate(conditions, fieldsToSet, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `forgot password`, message : `Error finding and updating user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                if (!user) {
                    return workflow.emit('response');
                }

                workflow.emit('sendEmail', token, user);
            });
        });
        //send an email to the provided email with information about how to reset user password
        workflow.on('sendEmail', function(token, user) {
            logClient.Log({ level:"DEBUG", category : `forgot password`, message : `Sending email.`});

            req.app.utility.sendmail(req, res, {
                from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
                to: user.email,
                subject: 'Reset your '+ req.app.config.projectName +' password',
                textPath: 'login/forgot/email-text',
                htmlPath: 'login/forgot/email-html',
                locals: {
                    username: user.username,
                    resetLink: req.protocol +'://'+ req.headers.host +'/login/reset/'+ user.email +'/'+ token +'/',
                    projectName: req.app.config.projectName
                },
                success: function(message) {
                    helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'ForgotPassword',user:user.id, message: 'Forgot password process succeeded'}, function(err){
                        if(err){
                            return workflow.emit('exception', err);
                        }
                        logClient.Log({ level:"INFO", category : `reset password`, message : `Reset password email sent`});
                        workflow.emit('response');
                    });

                },
                error: function(err) {
                    logClient.Log({ level:"ERROR", category : `forgot password`, message : `Error sending email. Error: ${err.message}`});
                    workflow.outcome.errors.push('Error Sending: '+ err);
                    workflow.emit('response');
                }
            });
        });

        workflow.emit('validate');
    },
    /*
        Starts reset password workflow
        It validates if received data constains a password and a password confirmation and if they match
        Then user is found by provided email, and if reset password expiration date was not outdated the new
        password is stored in user instance
    */
    resetPassword: function(req, res){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `reset password`, message : `Starting reset password workflow.`});

        //validates if password and confirmation was provided and if they match
        workflow.on('validate', function() {
            if (!req.body.password) {
                workflow.outcome.errfor.password = 'required';
            }

            if (!req.body.confirm) {
                workflow.outcome.errfor.confirm = 'required';
            }

            if (req.body.password !== req.body.confirm) {
                workflow.outcome.errors.push('Passwords do not match.');
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `reset password`, message : `Invalid data received. Error: ${workflow.outcome}`});
                return workflow.emit('response');
            }

            workflow.emit('findUser');
        });
        //find user that match with provided email
        workflow.on('findUser', function() {
            logClient.Log({ level:"DEBUG", category : `reset password`, message : `Finding user.`});

            var conditions = {
                email: req.params.email,
                resetPasswordExpires: { $gt: Date.now() }
            };
            req.app.db.models.User.findOne(conditions, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `reset password`, message : `Error finding user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                if (!user) {
                    // not user found. Can not exist user or the user for given email dont have a valid reset password date
                    logClient.Log({ level:"ERROR", category : `reset password`, message : `Invalid request`});
                    workflow.outcome.errors.push('Invalid request.');
                    return workflow.emit('response');
                }
                if(user.resetPasswordToken){
                    //check if provided token matches with reset password token stored
                    req.app.db.models.User.validatePassword(req.params.token, user.resetPasswordToken, function(err, isValid) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `reset password`, message : `Error validating reset password token. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }
                        if (!isValid) {
                            //tokens dont match
                            logClient.Log({ level:"ERROR", category : `reset password`, message : `Reset password tokens dont match`});
                            workflow.outcome.errors.push('Invalid request.');
                            return workflow.emit('response');
                        }

                        workflow.emit('patchUser', user);
                    });
                }
                else{
                    logClient.Log({ level:"ERROR", category : `reset password`, message : `It wasnt provided a reset password token. User: ${user.id}`});
                    workflow.outcome.errors.push(`Does not exist a reset password token. User: ${user.id}`);
                    return workflow.emit('response');
                }

            });
        });
        /*
            Update user information with new password
        */
        workflow.on('patchUser', function(user) {
            logClient.Log({ level:"DEBUG", category : `reset password`, message : `Patching user`});
            //encrypt password
            req.app.db.models.User.encryptPassword(req.body.password, function(err, hash) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `reset password`, message : `Error in password encryption. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                var fieldsToSet = { password: hash, resetPasswordToken: '' };
                //find and update user information
                req.app.db.models.User.findByIdAndUpdate(user._id, fieldsToSet, function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `reset password`, message : `Error finding and updating user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    return helper.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'ResetPassword',user:user.id, message: 'Forgot password process succeeded'}, function(err){
                        if(err){
                            return workflow.emit('exception', err);
                        }
                        logClient.Log({ level:"INFO", category : `reset password`, message : `Successfuly reset password`});
                        workflow.emit('response');
                    });
                });
            });
        });
        workflow.emit('validate');
    },
    /*
        It receives an authorization token in request headers and a set of group identifiers in request body.
        It verifies if the session token is valid and if the user belongs to provided groups.
    */
    authorize: function(req, res){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `authorize token`, message : `Starting authorize token workflow`});

        //find current user data from an user session token
        var credentials = req.headers.authorization.split(' ');
        if(credentials[0] != 'Bearer'){
            logClient.Log({ level:"ERROR", category : `find current user`, message : `Error: authorization scheme must follow Bearer strategy.`});
            workflow.outcome.errors.push(`Error: authorization scheme must follow Bearer strategy.`);
            return workflow.emit('response');
        }
        helper.findCurrentUserByAuthTokenWorkflow(req.app,credentials[1],workflow,'validate','checkGroups');

        /*
            Check if current user belongs the groups provided
        */
        workflow.on('checkGroups', function() {
            logClient.Log({ level:"DEBUG", category : `authorize token`, message : `Checking groups`});

            var groups  = req.body.groups;

            // no groups provided so user is authorized
            if(!groups){
                workflow.outcome.user = workflow.user.id;
                return workflow.emit("response");
            }
            //check if groups data is valid
            if(groups && ! (groups instanceof Array)){
                logClient.Log({ level:"ERROR", category : `authorize token`, message : `Invalid request. Groups must be an array of group identifiers`});
                workflow.outcome.errors.push('Invalid request. Groups must be an array of group identifiers');
                return workflow.emit('response');
            }
            else{
                var authorizedAccount = false;
                //populate user account role with their groups
                workflow.user.roles.account.populate('groups', function(err, account){
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `authorize token`, message : `Error populating account. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    //check if user is authorized, if belongs at least to one of the provided groups
                    if(groups.length === 0){
                        authorizedAccount = true;
                    }
                    else{
                        for(var group of groups){
                            let authGroup = account.isMemberOf(group);
                            if(!authGroup){
                            }
                            authorizedAccount = authorizedAccount || authGroup;
                        }
                    }

                    if(!authorizedAccount){
                        workflow.outcome.errors.push('User does not belong to any authorized group');
                        logClient.Log({ level:"ERROR", category : `authorize token`, message : `Unauthorized user. ${workflow.outcome.errfor}`});
                    }
                    else{
                        workflow.outcome.user = workflow.user.id;
                    }
                    workflow.emit("response");
                })

            }
        });
        workflow.emit('validate');
    }
};

module.exports = security;
