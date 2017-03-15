'use strict';

exports = module.exports = function(app, passport) {
    var LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    LinkedInStrategy = require('passport-linkedin-oauth2').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    LdapStrategy = require('passport-ldapauth'),
    BearerStrategy = require('passport-http-bearer').Strategy,
    logClient = require('../../clients/log'),
    helper = require('../controllers/common');

    /*
        Initialize Bearer Strategy
        Users must authorize sending an authorization token on each request
    */
    passport.use(new BearerStrategy(
      function(token, done) {

          logClient.Log({ level:"DEBUG", category : `Bearer authentication strategy`, message : "Starting bearer authentication"});

          var workflow = new (require('events').EventEmitter)();
          workflow.outcome = {errors:[]};

          /*
            it starts a workflow to find an user by a session token.
            It finds a session token instance by the provided token, and if token is valid and not yet expired it finds its user owner
          */
          helper.findCurrentUserByAuthTokenWorkflow(app, token,workflow, 'validate','response');

          //when previous workflow ends successfuly
          workflow.on('response', function(){

              if(workflow.outcome.errors.length > 0){
                  logClient.Log({ level:"ERROR", category : `Bearer authentication strategy`, message : workflow.outcome.errors.join(',')});
                  return done(null, false);
              }
              if(workflow.outcome.user){
                  logClient.Log({ level:"DEBUG", category : `Bearer authentication strategy`, message : "Bearer authentication succeeds"});
                  return done(null, workflow.outcome.user);
              }
              else{
                  return done(null, false);
              }
          });

          //when workflow throws an exception
          workflow.on('exception', function(x){
              logClient.Log({ level:"ERROR", category : `bearer authentication strategy`, message : `Exception caught: Error: ${x}`});

              if(typeof x === 'string'){
                  return done(null, false, {message: x});
              }else{
                  return done(null, false, x);
              }
          });
          workflow.emit('validate');
      }
    ));

    /*
        Initialize Local Strategy
        Users authentication using local accounts.
        To authenticate user this strategy must receive an username or email and a password.
        This strategy finds user by username/email, validates received password and if it is valid retrives user information
    */
    passport.use(new LocalStrategy(
        function(username, password, done) {
            logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Starting local authentication workflow.`});

            var workflow = new (require('events').EventEmitter)();

            //it finds user by username or passoword
            workflow.on('findUser', function(){
                logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Finding user`});

                var conditions = {isActive: 'yes'};
                if (username.indexOf('@') === -1) {
                    conditions.username = username;
                }
                else {
                    conditions.email = username;
                }

                app.db.models.User.findOne(conditions, function (err, user) {
                    if(err){
                        logClient.Log({ level:"ERROR", category : `local authentication strategy`, message : `Error finding user. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    if(!user){
                        logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Unknown user`});
                        return workflow.emit('exception', 'Unknown user');
                    }
                    workflow.emit('validatePassword', user)
                });
            });
            //it validates if received password is valid over the database user password
            workflow.on('validatePassword', function(user){
                logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Validating password`});

                app.db.models.User.validatePassword(password, user.password, function(err, isValid) {
                    if (err) {
                        logClient.Log({ level:"ERROR", category : `local authentication strategy`, message : `Error validation password. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }

                    if (!isValid) {
                        logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Invalid password`});
                        return workflow.emit('exception', 'Invalid password');
                    }

                    workflow.emit('populateUser', user);
                });
            });

            //populates user with their account and admin roles data
            workflow.on('populateUser', function(user){
                logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Populating user`});
                user.populate('roles.admin roles.account', function(err, user){
                    if(err){
                        logClient.Log({ level:"ERROR", category : `local authentication strategy`, message : `Error populating user roles. Error: ${err.message}`});
                        return workflow.emit('exception', err);
                    }
                    if (user && user.roles && user.roles.admin) {
                        user.roles.admin.populate("groups", function(err, admin) {
                            if(err){
                                logClient.Log({ level:"ERROR", category : `local authentication strategy`, message : `Error populating groups. Error: ${err.message}`});
                                return workflow.emit('exception', err);
                            }
                            return workflow.emit('result', user);
                        });
                    }
                    else {
                        return workflow.emit('result', user);
                    }
                });
            });

            workflow.on('result', function(user){
                logClient.Log({ level:"DEBUG", category : `local authentication strategy`, message : `Local authentication succeeded`});
                return done(null, user);
            });

            workflow.on('exception', function(x){
                logClient.Log({ level:"ERROR", category : `local authentication strategy`, message : `Exception caught: Error: ${x}`});

                if(typeof x === 'string'){
                    return done(null, false, {message: x});
                }else{
                    return done(null, false, x);
                }
            });

            workflow.emit('findUser');
        }
    ));


/*
Initialize Facebook Strategy in order to provide system clients a way to authenticate with Facebook account
*/
if (app.config.oauth.facebook.key) {
    passport.use(new FacebookStrategy({
        clientID: app.config.oauth.facebook.key,
        clientSecret: app.config.oauth.facebook.secret,
        profileFields: ['id', 'email','gender', 'link', 'locale', 'name', 'timezone'],//set of fields that whe want to get from facebook

    },
    function(accessToken, refreshToken, profile, done) {
        done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
        });
    }
));
}

/*
Initialize LinkedIn Strategy in order to provide system clients a way to authenticate with Linkedin account
*/
if (app.config.oauth.linkedin.key) {
    passport.use(new LinkedInStrategy({
        clientID: app.config.oauth.linkedin.key,
        clientSecret: app.config.oauth.linkedin.secret,
        callbackURL : app.config.serverAddress + '/login/linkedin/callback',
        profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline']
    },
    function(accessToken, refreshToken, profile, done) {
        done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
        });
    }
));
}
/*
Initialize Google  Strategy in order to provide system clients a way to authenticate with Google account
*/
if (app.config.oauth.google.key) {
    passport.use(new GoogleStrategy({
        clientID: app.config.oauth.google.key,
        clientSecret: app.config.oauth.google.secret
    },
    function(accessToken, refreshToken, profile, done) {
        done(null, false, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
        });
    }
));
}

/*
Initialize LDAP strategy in order to authenticate user using an Active Directory server
*/
if(app.config.LDAPopts){
    passport.use(new LdapStrategy(app.config.LDAPopts,
        function(LDAPUser, done) {
            done(null, LDAPUser)
        }
    ));
}
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    app.db.models.User.findOne({ _id: id }).populate('roles.admin').populate('roles.account').exec(function(err, user) {
        if (user && user.roles && user.roles.admin) {
            user.roles.admin.populate("groups", function(err, admin) {
                done(err, user);
            });
        }
        else {
            done(err, user);
        }
    });
});
};
