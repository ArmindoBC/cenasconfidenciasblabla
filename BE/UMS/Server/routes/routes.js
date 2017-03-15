'use strict';

var preAuth = require('../helpers/controllers/pre-auth');
var security = require('../controllers/securityController');
var account = require('../controllers/accountController');
var admin = require('../controllers/adminControllers/adminController');
var adminUser = require('../controllers/adminControllers/userController');
var adminAccount = require('../controllers/adminControllers/accountController');
var adminAdministrator = require('../controllers/adminControllers/administratorController');
var adminGroup = require('../controllers/adminControllers/adminGroupController');
var userSessionController = require('../controllers/adminControllers/userSessionController');
var adminActivityHistory = require('../controllers/adminControllers/activityHistoryController');
var accountGroup = require('../controllers/adminControllers/accountGroupController');

function useAngular(req, res, next){
    res.sendFile(require('path').join(__dirname, '../public/dist/index.html'));
}

function apiEnsureAuthenticated(req, res, next){
     req._passport.instance.authenticate('bearer', { session: false }, function(err, user) {
         if(err){
             next(err);
         }
         if(user){
             req.login(user, function(err) {
                 if (err) {
                     req.app.utility.logClient.Log({ level:"ERROR", category : `local signup`, message : `Error in log user in. Error: ${err.message}`});
                     return next(err);
                 }
                 return next()
             });
         }
         else{
             res.set('X-Auth-Required', 'true');
             req.app.utility.logClient.Log({ level:"WARN", category : `authentication`, message : `User must be authenticated to access route '${req.path}.`})
             res.status(401).send({errors: ['authentication required']});
         }
     })(req, res);
}

function apiEnsureAccount(req, res, next){
    if(req.user.canPlayRoleOf('account')){
        return next();
    }
    req.app.utility.logClient.Log({ level:"WARN", category : `authentication`, message : `User must play role account to access route '${req.path}'. User: ${req.user.id}`})
    res.status(401).send({errors: ['authorization required']});
}

function apiEnsureVerifiedAccount(req, res, next){
    if(!req.app.config.requireAccountVerification){
        return next();
    }
    req.user.isVerified(function(err, flag){
        if(err){
            return next(err);
        }
        if(flag){
            return next();
        }else{
            req.app.utility.logClient.Log({ level:"WARN", category : `authentication`, message : `User account must be verified to access route '${req.path}. User: ${req.user.id}'`})
            return res.status(401).send({errors: ['verification required']});
        }
    });
}

function apiEnsureAdmin(req, res, next){
    if(req.user.canPlayRoleOf('admin')){
        return next();
    }
    req.app.utility.logClient.Log({ level:"WARN", category : `authentication`, message : `User must play role admin to access route '${req.path}. User: ${req.user.id}'`})
    res.status(401).send({errors: ['authorization required']});
}
exports.exposedRoutes = function(app, passport){
    app.post('/api/logout', apiEnsureAuthenticated, security.logout);
    app.post('/api/login/google/', security.loginGoogle);
    app.post('/api/login/facebook/', security.loginFacebook);
    app.post('/api/login/linkedin/', security.loginLinkedIn);

    app.get('/api/current-user', security.sendCurrentUser);
    app.post('/api/signup', security.signup);
    app.post('/api/login', security.login);
    app.post('/api/login-ad', security.loginAD);
    app.post('/api/authorize', security.authorize);
}
exports.nonExposedRoutes = function(app, passport) {
    //******** NEW JSON API ********

    app.post('/api/sendMessage', preAuth.sendMessage);
    app.post('/api/login/forgot', security.forgotPassword);
    app.put('/api/login/reset/:email/:token', security.resetPassword);
    app.get('/api/login/facebook/callback', security.loginFacebook);
    app.get('/api/login/linkedin/callback', security.loginLinkedIn);
    app.get('/api/login/google/callback', security.loginGoogle);

    //-----authentication required api-----
    app.all('/api/account*', apiEnsureAuthenticated);
    app.all('/api/account*', apiEnsureAccount);

    app.get('/api/account/verification', account.upsertVerification);
    app.post('/api/account/verification', account.resendVerification);
    app.get('/api/account/verification/:token/', account.verify);

    app.all('/api/account/settings*', apiEnsureVerifiedAccount);

    app.get('/api/account/settings', account.getAccountDetails);
    app.put('/api/account/settings', account.update);
    app.put('/api/account/settings/identity', account.identity);
    app.put('/api/account/settings/password', account.password);
    app.get('/api/account/settings/google/callback', account.connectGoogle);
    app.get('/api/account/settings/google/disconnect', account.disconnectGoogle);
    app.get('/api/account/settings/facebook/callback', account.connectFacebook);
    app.get('/api/account/settings/facebook/disconnect', account.disconnectFacebook);
    app.get('/api/account/settings/linkedin/callback', account.connectLinkedIn);
    app.get('/api/account/settings/linkedin/disconnect', account.disconnectLinkedIn);

    //-----athorization required api-----
    app.all('/api/admin*', apiEnsureAuthenticated);
    app.all('/api/admin*', apiEnsureAdmin);
    app.get('/api/admin', admin.getStats);

    //admin > users
    app.get('/api/admin/users', adminUser.find);
    app.post('/api/admin/users/', adminUser.create);
    app.get('/api/admin/users/:id', adminUser.read);
    app.put('/api/admin/users/:id', adminUser.update);
    app.put('/api/admin/users/:id/password', adminUser.password);
    app.put('/api/admin/users/:id/role-admin', adminUser.linkAdmin);
    app.delete('/api/admin/users/:id/role-admin', adminUser.unlinkAdmin);
    app.put('/api/admin/users/:id/role-account', adminUser.linkAccount);
    app.delete('/api/admin/users/:id/role-account', adminUser.unlinkAccount);
    app.delete('/api/admin/users/:id', adminUser.delete);

    //admin > administrators
    app.get('/api/admin/administrators', adminAdministrator.find);
    app.post('/api/admin/administrators', adminAdministrator.create);
    app.get('/api/admin/administrators/:id', adminAdministrator.read);
    app.put('/api/admin/administrators/:id', adminAdministrator.update);
    app.put('/api/admin/administrators/:id/permissions', adminAdministrator.permissions);
    app.put('/api/admin/administrators/:id/groups', adminAdministrator.groups);
    app.put('/api/admin/administrators/:id/user', adminAdministrator.linkUser);
    app.delete('/api/admin/administrators/:id/user', adminAdministrator.unlinkUser);
    app.delete('/api/admin/administrators/:id', adminAdministrator.delete);

    //admin > admin groups
    app.get('/api/admin/admin-groups', adminGroup.find);
    app.post('/api/admin/admin-groups', adminGroup.create);
    app.get('/api/admin/admin-groups/:id', adminGroup.read);
    app.put('/api/admin/admin-groups/:id', adminGroup.update);
    app.put('/api/admin/admin-groups/:id/permissions', adminGroup.permissions);
    app.delete('/api/admin/admin-groups/:id', adminGroup.delete);

    //admin > accounts
    app.get('/api/admin/accounts', adminAccount.find);
    app.post('/api/admin/accounts', adminAccount.create);
    app.get('/api/admin/accounts/:id', adminAccount.read);
    app.put('/api/admin/accounts/:id', adminAccount.update);
    app.put('/api/admin/accounts/:id/user', adminAccount.linkUser);
    app.delete('/api/admin/accounts/:id/user', adminAccount.unlinkUser);
    app.delete('/api/admin/accounts/:id', adminAccount.delete);
    app.put('/api/admin/accounts/:id/groups', adminAccount.groups);

    //admin > usersessions
    app.get('/api/admin/usersessions', userSessionController.find);
    app.get('/api/admin/usersessions/:id', userSessionController.read);
    app.put('/api/admin/usersessions/:id/invalidate', userSessionController.invalidate);

    //admin > activities history
    app.get('/api/admin/activity-history', adminActivityHistory.find);
    app.get('/api/admin/activity-history/:id', adminActivityHistory.read);
    app.delete('/api/admin/activity-history/:id', adminActivityHistory.delete);

    //admin > account groups
    app.get('/api/admin/account-groups', accountGroup.find);
    app.post('/api/admin/account-groups', accountGroup.create);
    app.get('/api/admin/account-groups/:id', accountGroup.read);
    app.put('/api/admin/account-groups/:id', accountGroup.update);
    app.put('/api/admin/account-groups/:id/permissions', accountGroup.permissions);
    app.delete('/api/admin/account-groups/:id', accountGroup.delete);

    //admin > search
    app.get('/api/admin/search', admin.search);

    //******** END OF NEW JSON API ********

    //******** Static routes handled by Angular ********
    //public
    app.get('/', useAngular);
    app.get('/about', useAngular);
    app.get('/contact', useAngular);

    //sign up
    app.get('/signup', useAngular);

    //social sign up no-longer needed as user can login with their social account directly
    //this eliminates one more step (collecting email) before user login

    //login/out
    app.get('/login', useAngular);
    app.get('/login/forgot', useAngular);
    app.get('/login/reset', useAngular);
    app.get('/login/reset/:email/:token', useAngular);

    //social login
    //Facebook
    app.get('/login/facebook', passport.authenticate('facebook', { callbackURL: app.config.serverAddress +'/login/facebook/callback', scope: ['email'] }));
    app.get('/login/facebook/callback', useAngular);
    //Google
    app.get('/login/google', passport.authenticate('google', { callbackURL: app.config.serverAddress + '/login/google/callback', scope: ['profile email'] }));
    app.get('/login/google/callback', useAngular);
    //LinkedIn
    app.get('/login/linkedin', passport.authenticate('linkedin', { callbackURL: app.config.serverAddress + '/login/linkedin/callback', scope: ['r_basicprofile', 'r_emailaddress'] }));
    app.get('/login/linkedin/callback', useAngular);

    //account
    app.get('/account', useAngular);

    //account > verification
    app.get('/account/verification', useAngular);
    app.get('/account/verification/:token', useAngular);

    //account > settings
    app.get('/account/settings', useAngular);

    //account > settings > social
    app.get('/account/settings/facebook/', passport.authenticate('facebook', { callbackURL: app.config.serverAddress + '/account/settings/facebook/callback', scope: [ 'email' ]}));
    app.get('/account/settings/facebook/callback', useAngular);
    app.get('/account/settings/linkedin/', passport.authenticate('linkedin', { callbackURL: app.config.serverAddress + '/account/settings/linkedin/callback', scope: ['r_basicprofile', 'r_emailaddress']}));
    app.get('/account/settings/linkedin/callback', useAngular);
    app.get('/account/settings/google/', passport.authenticate('google', { callbackURL: app.config.serverAddress + '/account/settings/google/callback', scope: ['profile email'] }));
    app.get('/account/settings/google/callback', useAngular);

    //admin
    app.get('/admin', useAngular);

    //admin > users
    app.get('/admin/users', useAngular);
    app.get('/admin/users/:id', useAngular);

    //admin > administrators
    app.get('/admin/administrators', useAngular);
    app.get('/admin/administrators/:id', useAngular);

    //admin > admin groups
    app.get('/admin/admin-groups', useAngular);
    app.get('/admin/admin-groups/:id', useAngular);

    //admin > accounts
    app.get('/admin/accounts', useAngular);
    app.get('/admin/accounts/:id', useAngular);

    //other routes not found nor begin with /api is handled by Angular
    app.all(/^(?!\/api).*$/, useAngular);

    //******** End OF static routes ********
};
