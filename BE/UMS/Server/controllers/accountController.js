'use strict';
var helper = require('../helpers/controllers/common.js');

// public api
var account = {
    /*
        Get account details.
        For user, this method allows to retrieve all its information related with account and user instances
    */
    getAccountDetails: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Getting account details`});

        var outcome = {};

        /*
            Retrives all information of account by user id
        */
        var getAccountData = function(callback) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Getting user data.`});

            req.app.db.models.Account.findById(req.user.roles.account.id, 'name company phone zip').exec(function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error getting account by id. Error: ${err.message}`});
                    return callback(err, null);
                }

                outcome.account = account;
                logClient.Log({ level:"DEBUG", category : `account api`, message : `Account data successfuly obtained.`});
                callback(null, 'done');
            });
        };

        /*
            Retrives user data by user id
        */
        var getUserData = function(callback) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Getting user data.`});

            req.app.db.models.User.findById(req.user.id, 'username email twitter.id github.id facebook.id google.id tumblr.id linkedin.id').exec(function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error getting user by id. Error: ${err.message}`});
                    callback(err, null);
                }

                outcome.user = user;
                logClient.Log({ level:"DEBUG", category : `account api`, message : `User data successfuly obtained.`});
                return callback(null, 'done');
            });
        };

        var asyncFinally = function(err, results) {
            if (err) {
                logClient.Log({ level:"ERROR", category : `account api`, message : `Error getting user or account data. Error: ${err.message}`});
                return next(err);
            }
            res.status(200).json(outcome);
        };
        require('async').parallel([getAccountData, getUserData], asyncFinally);
    },
    /*
        Updates account information.
        It receives new data for account instance, validates, and patches updates account instance.
    */
    update: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Updating account details`});

        /*
            it validates received data. Must ensure that first name and last name are set.
        */
        workflow.on('validate', function() {
            if (!req.body.first) {
                workflow.outcome.errfor.first = 'required';
            }

            if (!req.body.last) {
                workflow.outcome.errfor.last = 'required';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `account api`, message : `Invalid data. ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }
            workflow.emit('patchAccount');
        });

        // catch all received data and updates the account instance
        workflow.on('patchAccount', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching account`});

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
            var options = { select: 'name company phone zip' };

            req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, options, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating account by id. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.account = account;
                return workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },

    /*
        Update user identity, like username and email.
        It validates received data, checks if username and email are already taken by other users and updates account and admin roles With
        received data
    */
    identity: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Account identity workflow.`});

        //received data must contain a valid username and a valid email
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Validating data.`});

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
                logClient.Log({ level:"ERROR", category : `account api`, message : `Invalid data. ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('duplicateUsernameCheck');
        });

        //check if username already exists, if username is already taken the action cannot succeed
        workflow.on('duplicateUsernameCheck', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Checking duplicate username`});

            req.app.db.models.User.findOne({ username: req.body.username, _id: { $ne: req.user.id } }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding user by username. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //username already taken by other user
                if (user) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Username already taken`});
                    workflow.outcome.errfor.username = 'Username already taken';
                    return workflow.emit('response');
                }

                workflow.emit('duplicateEmailCheck');
            });
        });

        //check if email already exists, if email is already taken the action cannot succeed
        workflow.on('duplicateEmailCheck', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Checking duplicate email`});

            req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.user.id } }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding user by email. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //email already taken by other user
                if (user) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Email already taken`});
                    workflow.outcome.errfor.email = 'email already taken';
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });

        // update user instance with received username and email
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching user`});
            var fieldsToSet = {
                username: req.body.username,
                email: req.body.email.toLowerCase(),
                search: [
                    req.body.username,
                    req.body.email
                ]
            };
            var options = { select: 'username email twitter.id github.id facebook.id google.id linkedin.id' };

            req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, options, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.emit('patchAdmin', user);
            });
        });

        //update admin instance in order to refresh the name with new username received
        workflow.on('patchAdmin', function(user) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching admin`});
            if (user.roles.admin) {
                var fieldsToSet = {
                    user: {
                        id: req.user.id,
                        name: user.username
                    }
                };
                req.app.db.models.Admin.findByIdAndUpdate(user.roles.admin, fieldsToSet, function(err, admin) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating admin. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('patchAccount', user);
                });
            }
            else {
                workflow.emit('patchAccount', user);
            }
        });

        //update account instance in order to refresh the name with new username received
        workflow.on('patchAccount', function(user) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching account`});
            if (user.roles.account) {
                var fieldsToSet = {
                    user: {
                        id: req.user.id,
                        name: user.username
                    }
                };
                req.app.db.models.Account.findByIdAndUpdate(user.roles.account, fieldsToSet, function(err, account) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating account. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    workflow.emit('populateRoles', user);
                });
            }
            else {
                workflow.emit('populateRoles', user);
            }
        });

        //populate user with roles data
        workflow.on('populateRoles', function(user) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Populating roles`});
            user.populate('roles.admin roles.account', 'name.full', function(err, populatedUser) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error populating. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.outcome.user = populatedUser;
                workflow.emit('response');
            });
        });

        workflow.emit('validate');
    },
    /*
        Update user password
        It validates received data, and updates the respective user instance
    */
    password: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Account password workflow.`});

        //validates if new password and confirmation were received and if they match
        workflow.on('validate', function() {
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
                logClient.Log({ level:"ERROR", category : `account api`, message : `Invalid data. ${workflow.outcome}`});
                return workflow.emit('response');
            }

            workflow.emit('patchUser');
        });
        //updates user instance with received password.
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching user`});
            //encrypts password before insert it on database
            req.app.db.models.User.encryptPassword(req.body.newPassword, function(err, hash) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error patching user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                var fieldsToSet = { password: hash };
                req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, function(err, user) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    //populate user instance with roles data
                    user.populate('roles.admin roles.account', 'name.full', function(err, user) {
                        if (err) {
                            logClient.Log({ level:"ERROR", category : `account api`, message : `Error populating user roles. Error: ${err.message}`});
                            return workflow.emit('exception', err);
                        }

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
        Starts account verification workflow.
        It inserts or updates a verification token on account instance data.
    */
    upsertVerification: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;

        logClient.Log({ level:"DEBUG", category : `account api`, message : `Starting upsertVerification workflow`});

        //if checks if account is already verified or if already exists a verificationToken
        workflow.on('generateTokenOrSkip', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Generating token or skip workflow`});

            if (req.user.roles.account.isVerified === 'yes') {
                logClient.Log({ level:"ERROR", category : `account api`, message : `Account already verified`});
                workflow.outcome.errors.push('account already verified');
                return workflow.emit('response');
            }
            if (req.user.roles.account.verificationToken !== '') {
                //token generated already
                return workflow.emit('response');
            }

            workflow.emit('generateToken');
        });
        //generates a new verification token and update account
        workflow.on('generateToken', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Generating token`});

            var crypto = require('crypto');
            crypto.randomBytes(21, function(err, buf) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error generating encryption buffer. Error: ${err.message}`});
                    return next(err);
                }

                var token = buf.toString('hex');
                req.app.db.models.User.encryptPassword(token, function(err, hash) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error in password encryption. Error: ${err.message}`});
                        return next(err);
                    }

                    workflow.emit('patchAccount', token, hash);
                });
            });
        });
        //update account with generated verification token
        workflow.on('patchAccount', function(token, hash) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching account`});

            var fieldsToSet = { verificationToken: hash };
            req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //send verification email
                helper.sendVerificationEmail(req, res, {
                    email: req.user.email,
                    verificationToken: token,
                    onSuccess: function() {
                        logClient.Log({ level:"INFO", category : `account api`, message : `Verification email sent`});
                        return workflow.emit('response');
                    },
                    onError: function(err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error sending verification email. Error: ${err.message}`});
                        return next(err);
                    }
                });
            });
        });

        workflow.emit('generateTokenOrSkip');
    },
    /*
        Receives an email to resend the verification token.
        it validates if receives an email, updates user in order to refresh the email, generates and verification token, it patches account and
        resend an email
    */
    resendVerification: function(req, res, next){
        var workflow = req.app.utility.workflow(req, res);
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Starting resend verification email workflow.`});

        //account cannot be already verified
        if (req.user.roles.account.isVerified === 'yes') {
            logClient.Log({ level:"ERROR", category : `account api`, message : `Account already verified.`});
            workflow.outcome.errors.push('account already verified');
            return workflow.emit('response');
        }

        //validates received email
        workflow.on('validate', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Validating data on verification email resend.`});
            if (!req.body.email) {
                workflow.outcome.errfor.email = 'required';
            }
            else if (!/^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/.test(req.body.email)) {
                workflow.outcome.errfor.email = 'invalid email format';
            }

            if (workflow.hasErrors()) {
                logClient.Log({ level:"ERROR", category : `account api`, message : `Invalid data. Error: ${workflow.outcome.errfor}`});
                return workflow.emit('response');
            }

            workflow.emit('duplicateEmailCheck');
        });

        //check if already exists an user instance with received email. It must be unique in the system
        workflow.on('duplicateEmailCheck', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Checking duplicate email`});
            req.app.db.models.User.findOne({ email: req.body.email.toLowerCase(), _id: { $ne: req.user.id } }, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error checking duplicate email. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //email already taken by another user
                if (user) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Email already taken`});
                    workflow.outcome.errfor.email = 'email already taken';
                    return workflow.emit('response');
                }

                workflow.emit('patchUser');
            });
        });

        //update user instance changing the email
        workflow.on('patchUser', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching user for resend verification email`});
            var fieldsToSet = { email: req.body.email.toLowerCase() };
            var options = { new: true };
            req.app.db.models.User.findByIdAndUpdate(req.user.id, fieldsToSet, options, function(err, user) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error patching user. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                workflow.user = user;
                workflow.emit('generateToken');
            });
        });

        //generates a new verification token
        workflow.on('generateToken', function() {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Generating token for resend verification email.`});
            var crypto = require('crypto');
            crypto.randomBytes(21, function(err, buf) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error generating buffer for encryption. Error: ${err.message}`});
                    return next(err);
                }

                var token = buf.toString('hex');
                req.app.db.models.User.encryptPassword(token, function(err, hash) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error encrypting password. Error: ${err.message}`});
                        return next(err);
                    }

                    workflow.emit('patchAccount', token, hash);
                });
            });
        });

        //updates accounts instance in order to store the created verification token
        workflow.on('patchAccount', function(token, hash) {
            logClient.Log({ level:"DEBUG", category : `account api`, message : `Patching account for resend verification email`});
            var fieldsToSet = { verificationToken: hash };
            req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account.id, fieldsToSet, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating account. Error: ${err.message}`});
                    return workflow.emit('exception', err);
                }

                //send verification email
                helper.sendVerificationEmail(req, res, {
                    email: workflow.user.email,
                    verificationToken: token,
                    onSuccess: function() {
                        logClient.Log({ level:"DEBUG", category : `account api`, message : `Verification email resent successfuly`});
                        workflow.emit('response');
                    },
                    onError: function(err) {
                        logClient.Log({ level:"ERROR", category : `account api`, message : `Error resending verification email. Error: ${err.message}`});
                        workflow.outcome.errors.push('Error Sending: '+ err);
                        workflow.emit('response');
                    }
                });
            });
        });

        workflow.emit('validate');
    },
    /*
        Verify account instance.
        It validates received verification token with the token stored in database and if they match it updates account instance
        making it verified.
    */
    verify: function(req, res, next){
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `account api`, message : `Starting email verification workflow.`});

        var outcome = {};
        //validate received token against stored token
        req.app.db.models.User.validatePassword(req.params.token, req.user.roles.account.verificationToken, function(err, isValid) {
            if (!isValid) {
                logClient.Log({ level:"Error", category : `account api`, message : `Invalid verification token.`});
                outcome.errors = ['invalid verification token'];
                outcome.success = false;
                return res.status(200).json(outcome);
            }

            var fieldsToSet = { isVerified: 'yes', verificationToken: '' };
            //update account making it verified
            req.app.db.models.Account.findByIdAndUpdate(req.user.roles.account._id, fieldsToSet, function(err, account) {
                if (err) {
                    logClient.Log({ level:"ERROR", category : `account api`, message : `Error finding and updating account. Error: ${err.message}`});
                    return next(err);
                }
                outcome.success = true;
                outcome.user = {
                    id: req.user._id,
                    email: req.user.email,
                    admin: !!(req.user.roles && req.user.roles.admin),
                    isVerified: true
                };
                return res.status(200).json(outcome);
            });
        });
    },
    /*
        Disconnects current accout from a google account
    */
    disconnectGoogle: function (req, res, next) {
        return helper.disconnectSocial('google', req, res, next);
    },
    /*
        Disconnects current accout from a facebook account
    */
    disconnectFacebook: function(req, res, next){
        return helper.disconnectSocial('facebook', req, res, next);
    },
    /*
        Disconnects current accout from a linkedIn account
    */
    disconnectLinkedIn: function(req, res, next){
        return helper.disconnectSocial('linkedin', req, res, next);
    },
    /*
        Connect an account to a google account
    */
    connectGoogle: function(req, res, next){
        return helper.connectSocial('google', req, res, next);
    },
    /*
        Connect an account to a facebook account
    */
    connectFacebook: function(req, res, next){
        return helper.connectSocial('facebook', req, res, next);
    },
    /*
        Connect an account to a linkedin account
    */
    connectLinkedIn: function(req, res, next){
        return helper.connectSocial('linkedin', req, res, next);
    }
};
module.exports = account;
