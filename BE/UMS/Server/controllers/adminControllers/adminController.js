'use strict';

// public api
var admin = {
    /*
        Retrieves current status of the system as number of users, accounts, administrators, admin groups and account groups
    */
    getStats: function(req, res, next){
        var counts = {};
        var collections = ['User', 'Account', 'Admin', 'AdminGroup', 'AccountGroup'];
        var queries = [];

        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin api`, message : `Getting stats.`});

        //for each collection search the number of entities
        collections.forEach(function(collection, i, arr){
            queries.push(function(done){
                req.app.db.models[collection].count({}, function(err, count){
                    if(err){
                        logClient.Log({ level:"DEBUG", category : `admin api`, message : `Error getting stats. Error: ${err.message}`});
                        return done(err);
                    }
                    counts[collection] = count;
                    done();
                });
            });
        });

        var asyncFinally = function(err, results){
            if(err){
                return next(err);
            }
            res.status(200).json(counts);
        };

        require('async').parallel(queries, asyncFinally);
    },

    /*
        It receives only one string and use it to search users, accounts and administrators
    */
    search: function (req, res, next) {
        req.query.q = req.query.q ? req.query.q : '';
        var regexQuery = new RegExp('^.*?' + req.query.q + '.*$', 'i');
        var outcome = {};
        var logClient = req.app.utility.logClient;
        logClient.Log({ level:"DEBUG", category : `admin api`, message : `Getting stats.`});

        //search users by their usernames
        var searchUsers = function (done) {
            logClient.Log({ level:"DEBUG", category : `admin api`, message : `Searching users.`});
            req.app.db.models.User.find({search: regexQuery}, 'username').sort('username').limit(10).lean().exec(function (err, results) {
                if (err) {
                    logClient.Log({ level:"DEBUG", category : `admin api`, message : `Error searching users. Error: ${err.message}`});
                    return done(err, null);
                }

                outcome.users = results;
                done(null, 'searchUsers');
            });
        };

        //search accounts by their full name
        var searchAccounts = function (done) {
            logClient.Log({ level:"DEBUG", category : `admin api`, message : `Searching accounts.`});
            req.app.db.models.Account.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function (err, results) {
                if (err) {
                    logClient.Log({ level:"DEBUG", category : `admin api`, message : `Error searching accounts. Error: ${err.message}`});
                    return done(err, null);
                }

                outcome.accounts = results;
                return done(null, 'searchAccounts');
            });
        };
        //search administrators by their full name
        var searchAdministrators = function (done) {
            logClient.Log({ level:"DEBUG", category : `admin api`, message : `Searching administrators.`});
            req.app.db.models.Admin.find({search: regexQuery}, 'name.full').sort('name.full').limit(10).lean().exec(function (err, results) {
                if (err) {
                    logClient.Log({ level:"DEBUG", category : `admin api`, message : `Error searching administrators. Error: ${err.message}`});
                    return done(err, null);
                }

                outcome.administrators = results;
                return done(null, 'searchAdministrators');
            });
        };

        var asyncFinally = function (err, results) {
            if (err) {
                return next(err, null);
            }

            //res.send(outcome);
            res.status(200).json(outcome);
        };

        require('async').parallel([searchUsers, searchAccounts, searchAdministrators], asyncFinally);
    }
};
module.exports = admin;
