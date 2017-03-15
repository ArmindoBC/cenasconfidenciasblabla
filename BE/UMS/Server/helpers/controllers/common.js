//============================= Security

/**
*   Filter user information in order to reduce the amount of data sended without being necessary
*/
exports.filterUser = function (user) {
    if (user) {
        return {
            id: user._id,
            email: user.email,
            username : user.username,
            //firstName: user.firstName,
            //lastName: user.lastName,
            admin: !!(user.roles && user.roles.admin),
            isVerified: !!(user.roles && user.roles.account && user.roles.account.isVerified && user.roles.account.isVerified === 'yes')
        };
    }
    return null;
};

/**
*   Builds social callback url depending on which social provider is in use
*/
exports.getSocialCallbackUrl = function(serverAddress, provider){
    return serverAddress + '/login/' + provider + '/callback';
};

/**
    It receives a user and creates a user section instance to him
*/
exports.createUserSession = function(req, user, callback){
    req.app.utility.logClient.Log({ level:"DEBUG", category : `user session`, message : `Creating session token.`});

    var user = {
        id : user.id,
        username : user.username
    }
    req.app.db.models.UserSession.create({user : user}, function(err, tokenSessionInstance) {
        if (err) {
            req.app.utility.logClient.Log({ level:"ERROR", category : `user session`, message : `Error creating session token. Error: ${err.message}`});
            callback(err);
        }
        callback(null, tokenSessionInstance);
    });
}

/*
    Sends and welcome email to new registered emails
*/
exports.sendWelcomeEmail = function(req,res, username, email, callback){
    req.app.utility.logClient.Log({ level:"DEBUG", category : `send welcome email`, message : `Sending welcome email for created user.`});

    if(!email){
        return callback(true);
    }
    if(!req.app.config.sendWelcomeEmail){
        return callback(true);
    }

    req.app.utility.sendmail(req, res, {
        from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
        to: email,
        subject: 'Your '+ req.app.config.projectName +' Account',
        textPath: 'signup/email-text',
        htmlPath: 'signup/email-html',
        locals: {
            username: username,
            email: email.toLowerCase(),
            loginURL: req.protocol +'://'+ req.headers.host +'/login/',
            projectName: req.app.config.projectName
        },
        success: function(message) {
            req.app.utility.logClient.Log({ level:"DEBUG", category : `send welcome email`, message : `Welcome email sent to user ${username}.`});
            callback(false);
        },
        error: function(err) {
            req.app.utility.logClient.Log({ level:"ERROR", category : `send welcome email`, message : `Error Sending Welcome Email. Error: ${err.message}`});
            console.log('Error Sending Welcome Email: '+ err);
            callback(err);

        }
    });
}

/*
    creates a new account instance and update user with created data
*/
exports.createAccountAndUpdateUser = function(req,fieldsToSet, user, callback){
    var logClient = req.app.utility.logClient;
    //create a new account instance
    req.app.db.models.Account.create(fieldsToSet, function(err, account) {
        if (err) {
            logClient.Log({ level:"ERROR", category : `create account`, message : `Error creating account instance with ${provider} data. Error: ${err.message}`});
            return callback(err);
        }
        //update user with account data
        user.roles.account = account._id;
        user.save(function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `create account`, message : `Error updating account instance with roles information. Error: ${err.message}`});
                return callback(err);
            }
            exports.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'Signup',user:user.id, message: 'Social account created successfuly'}, function(err){
                if(err){
                    return callback(err);
                }
                callback(null, user)
            });
        });
    });
};
/*
    Validates authentication header.
    Checks if it follows Bearer startegy
*/
exports.validateAuthHeader = function(authHeader,workflow, nextStep){
    var credentials = authHeader.split(' ');
    if(credentials[0] != 'Bearer'){
        logClient.Log({ level:"ERROR", category : `find current user`, message : `Error: authorization scheme must follow Bearer strategy.`});
        workflow.outcome.errors.push(`Error: authorization scheme must follow Bearer strategy.`);
        return workflow.emit('response');
    }
    workflow.token = credentials[1];
    workflow.emit(nextStep);
}
/*
    It receives an authenticated request which has an authorization token and finds to which user it belongs
    retrieving current user data. It needs to find usersession instance related to session token, finds user and
    gets all data about that user, including account and admin data as well as related groups.
*/
exports.findCurrentUserByAuthTokenWorkflow = function(app, token,workflow, firstStep, nextStep){
    var logClient = app.utility.logClient;
    logClient.Log({ level:"DEBUG", category : `find current user`, message : `Starting workflow to find current user by auth token`});

    //it checks if an authorization token was received in http request and if it follows expected authorization scheme
    workflow.on(firstStep, function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Validating data`});

        if (!token) {
            return workflow.emit('exception', 'Token not found');
        } /*else {
            exports.validateAuthHeader(req.headers.authorization, workflow, "findUserSession");
        }*/
        workflow.token = token;
        return workflow.emit('findUserSession')
    });
    /*
        finds an user session instance associated to the received session token
    */
    workflow.on('findUserSession', function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Finding user session.`});

        var conditions = {
            token: workflow.token,
        };
        app.db.models.UserSession.findOne(conditions, function(err, usersession) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `find current user`, message : `Error finding user session. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            if (!usersession) {
                logClient.Log({ level:"ERROR", category : `find current user`, message : `Invalid token received. It does not match with any user session.`});
                workflow.outcome.errors.push('Invalid token received. It does not match with any user session.');
                return workflow.emit('response');
            }
            else{
                //validate if token is expired
                workflow.usersession = usersession
                if(usersession.expirationDate < Date.now()){
                    logClient.Log({ level:"ERROR", category : `find current user`, message : `Token received is already expired`});
                    workflow.outcome.errors.push('Token received is already expired');
                    workflow.outcome.tokenExpired = true;
                    return workflow.emit('response');
                }
                else{
                    return workflow.emit('findUser');
                }
            }
        });
    });
    /*
        finds an user using user id present on user session token
    */
    workflow.on('findUser', function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Finding user.`});

        app.db.models.User.findById(workflow.usersession.user.id).exec(function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `find current user`, message : `Error finding user by id. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }

            if (!user) {
                logClient.Log({ level:"ERROR", category : `find current user`, message : `Invalid request. Does not exist users matching provided id`});
                workflow.outcome.errors.push('Invalid request. Does not exist users matching provided id');
                return workflow.emit('response');
            }
            else{
                workflow.user = user;
                return workflow.emit('populateUser');
            }
        })
    });
    /*
        It populates user instance with all account information including account groups memberships
    */
    workflow.on('populateUser', function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Patching account`});

        workflow.user.populate('roles.account roles.admin','groups',function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `find current user`, message : `Error populating user. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            if(!user.roles.account){
                logClient.Log({ level:"ERROR", category : `find current user`, message : `User does can not play role account.`});
                workflow.outcome.errors.push('User does can not play role account.');
                return workflow.emit('response');
            }

            workflow.outcome.user = user;
            return workflow.emit('populateAdmin');
        });
    });
    /*
        It populates admin instance with information about groups that admin belongs
    */
    workflow.on('populateAdmin', function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Populating user admin`});
        if(workflow.user.roles.admin){
            workflow.user.roles.admin.populate('groups',function(err, admin) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `find current user`, message : `Error populating user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.outcome.user.roles.admin = admin;
                return workflow.emit('populateAccount');
            });
        }
        else{
            return workflow.emit('populateAccount');
        }

    });
    /*
        It populates account instance with information about groups that admin belongs
    */
    workflow.on('populateAccount', function() {
        logClient.Log({ level:"DEBUG", category : `find current user`, message : `Populating user account`});
        if(workflow.user.roles.account){
            workflow.user.roles.account.populate('groups',function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `find current user`, message : `Error populating user account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }
                workflow.outcome.user.roles.account = account;
                nextStep = nextStep || 'response';
                return workflow.emit(nextStep);
            });
        }
        else{
            nextStep = nextStep || 'response';
            return workflow.emit(nextStep);
        }

    });
};

/*
    It checks if cliend reached the maximum number of login attempts
    It has in consideration the number of attempts attending to the ip and user that makes the request
*/
exports.checkAbuseFilterWorkflow = function(req,workflow, nextStep){
    var logClient = req.app.utility.logClient;

    logClient.Log({ level:"DEBUG", category : `check abuse filter`, message : `Processing abuse filter.`});
    //get number of login attempts by ip address
    var getIpCount = function(done) {
        var conditions = { ip: req.ip };
        req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `check abuse filter`, message : `Error counting login attemps by request ip. Error: ${err.message}`});
                return done(err);
            }

            done(null, count);
        });
    };
    //get number of login attempts by ip address and username
    var getIpUserCount = function(done) {
        var conditions = { ip: req.ip, user: req.body.username };
        req.app.db.models.LoginAttempt.count(conditions, function(err, count) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `check abuse filter`, message : `Error counting login attemps by request ip and username. Error: ${err.message}`});
                return done(err);
            }

            done(null, count);
        });
    };

    var asyncFinally = function(err, results) {
        if (err) {
            logClient.Log({ level:"ERROR", category : `local login`, message : `Error processing abuse filter. Error: ${err.message}`});
            return workflow.emit('exception', err);
        }

        if (results.ip >= req.app.config.loginAttempts.forIp || results.ipUser >= req.app.config.loginAttempts.forIpAndUser) {
            workflow.outcome.errors.push('You\'ve reached the maximum number of login attempts. Please try again later.');
            return workflow.emit('response');
        }
        else {
            workflow.emit('attemptLogin');
        }
    };

    require('async').parallel({ ip: getIpCount, ipUser: getIpUserCount }, asyncFinally);
};


/*
    Save user after being updated with new linked data from providers
*/
exports.saveLinkUser = function(req, user, callback){
    var logClient = req.app.utility.LogClient;

    user.save(function(err, user){
        if (err) {
            logClient.Log({ level:"ERROR", category : `save link user`, message : `Error linking user. Error: ${err.message}`});
            callback(err);
        }
        //also makes sure to update account isVerified is set to true assuming user has been verified with social provider
        var fieldsToSet = { isVerified: 'yes', verificationToken: '' };
        req.app.db.models.Account.findByIdAndUpdate(user.roles.account, fieldsToSet, function(err, account) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `save link user`, message : `Error finding and updating user account. Error: ${err.message}`});
                callback(err);
            }
            callback(null,user);
        });
    });
};

/*
    create and activity history, in order to log importante actions on login server
*/
exports.createActivityHistory = function(req, data, callback){
    req.app.db.models.ActivityHistory.create(data, function(err, activityHistory){
        if(err){
            logClient.Log({ level:"ERROR", category : `create activity history`, message : `Error creating activity history instance. Error: ${err.message}`});
            callback(err);
        }
        else{
            callback(false);
        }
    })
};

//============================= Account

/*
    Builds a callback url to be used when a new social account is connected
*/
exports.getCallbackUrl = function(serverAddress, provider){
    return serverAddress + '/account/settings/' + provider + '/callback';
};


/*
    Send verification email in order to clients verify their account
*/
exports.sendVerificationEmail = function(req, res, options) {
    var logClient = req.app.utility.logClient;
    logClient.Log({ level:"DEBUG", category : `send verification email`, message : `Starting send verification email workflow.`});

    req.app.utility.sendmail(req, res, {
        from: req.app.config.smtp.from.name +' <'+ req.app.config.smtp.from.address +'>',
        to: options.email,
        subject: 'Verify Your '+ req.app.config.projectName +' Account',
        textPath: 'account/verification/email-text',
        htmlPath: 'account/verification/email-html',
        locals: {
            verifyURL: req.protocol +'://'+ req.headers.host +'/account/verification/' + options.verificationToken,
            projectName: req.app.config.projectName
        },
        success: function() {
            logClient.Log({ level:"INFO", category : `send verification email`, message : `Email sent successfuly`});

            options.onSuccess();
        },
        error: function(err) {
            logClient.Log({ level:"ERROR", category : `send verification email`, message : `Error sending verification email: ${err.message}`});
            options.onError(err);
        }
    });
};

/*
    Disconnects social accounts from user
    It updates user data deleting all data associated to provider
*/
exports.disconnectSocial = function(provider, req, res, next){
    var logClient = req.app.utility.logClient;
    logClient.Log({ level:"DEBUG", category : `disconnect social ${provider}`, message : `Disconnection social account.`});

    provider = provider.toLowerCase();
    var outcome = {};
    var fieldsToSet = {};
    fieldsToSet[provider] = { id: undefined };
    //deletes provider data
    req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function (err, user) {
        if (err) {
            logClient.Log({ level:"ERROR", category : `disconnect social ${provider}`, message : `Error disconnecting user from their ${provider} account.`});

            outcome.errors = ['error disconnecting user from their '+ provider + ' account'];
            outcome.success = false;
            return res.status(200).json(outcome);
        }
        exports.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'SocialDisconnect',user:user.id, message: `Successfully disconnected to ${provider} account`}, function(err){
            if(err){
                return workflow.emit('exception', err);
            }
            logClient.Log({ level:"INFO", category : `disconnect social ${provider}`, message : `Social account disconnected successfuly`});
            outcome.success = true;
            return res.status(200).json(outcome);
        });
    });
};
/*
    Connects a social account to a existing user instance.
    It authenticates user with provider account, finds existing user in database and
    if there is no provider account connected to this user it links social data to the user.
*/
exports.connectSocial = function(provider, req, res, next){
    var logClient = req.app.utility.logClient;
    logClient.Log({ level:"DEBUG", category : `connect social ${provider}`, message : `Starting social account connection workflow.`});

    provider = provider.toLowerCase();
    var workflow = req.app.utility.workflow(req, res);

    /*
        Redirect user to provider authentication page and if authentication succeeds it retrieves
        social data to be linked to current user
    */
    workflow.on('loginSocial', function(){
        logClient.Log({ level:"DEBUG", category : `connect social ${provider}`, message : `Loging  with social account `});

        req._passport.instance.authenticate(provider, { callbackURL: exports.getCallbackUrl(req.app.config.serverAddress, provider) }, function(err, user, info) {
            if(err){
                logClient.Log({ level:"ERROR", category : `connect social ${provider}`, message : `Error authenticating user ${provider} provider. Error: ${err.message}`});
                return workflow.emit('exception', err);
            }
            //cannot find social user
            if (!info || !info.profile) {
                logClient.Log({ level:"ERROR", category : `connect social ${provider}`, message : `User not found`});

                workflow.outcome.errors.push(provider + '  user not found');
                return workflow.emit('response');
            }

            workflow.profile = info.profile;
            return workflow.emit('findUser');
        })(req, res, next);
    });
    /*
        It checks if exists some user diferent from current that are connected to current social account
    */
    workflow.on('findUser', function(){
        logClient.Log({ level:"DEBUG", category : `connect social ${provider}`, message : `Finding user in our database`});

        var option = { _id: { $ne: req.user.id } };
        option[provider +'.id'] = workflow.profile.id;
        req.app.db.models.User.findOne(option, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `connect social ${provider}`, message : `Error finding user. Error: ${err.message}`});

                return workflow.emit('exception', err);
            }

            //another user is already connected with this social account
            if (user) {
                logClient.Log({ level:"ERROR", category : `connect social ${provider}`, message : `Another user has already connected with that ${provider} account.`});

                //found another existing user already connects to provider
                workflow.outcome.errors.push('Another user has already connected with that '+ provider +' account.');
                return workflow.emit('response');
            }
            else {
                return workflow.emit('linkUser');
            }
        });
    });

    /*
        Update user instance with social data received
    */
    workflow.on('linkUser', function(){
        logClient.Log({ level:"DEBUG", category : `connect social ${provider}`, message : `Linking user to existing user instance`});

        var fieldsToSet = {};
        fieldsToSet[provider] = {
            id: workflow.profile.id,
            profile: workflow.profile
        };

        req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `connect social ${provider}`, message : `Error finding user. Error: ${err.message}`});

                return workflow.emit('exception', err);
            }
            exports.createActivityHistory(req, {machineName: req.app.config.machineName, category: 'SocialConnect',user:user.id, message: `Successfully connected to ${provider} account`}, function(err){
                if(err){
                    return workflow.emit('exception', err);
                }
                logClient.Log({ level:"INFO", category : `connect social ${provider}`, message : `Social account connected.`});
                return workflow.emit('response');
            });
        });
    });
    workflow.emit('loginSocial');
};
