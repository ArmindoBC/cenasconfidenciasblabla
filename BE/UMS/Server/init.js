var workflow = new (require('events').EventEmitter)();
var async = require('async');
var prompt = require('prompt');
var config = require('./config');

workflow.on('collectUserInput', function(){
  prompt.message = ''; prompt.delimiter = '';
  async.waterfall([function(cb){
    //1. admin username, email, and password
    console.log('=====Create admin user=====');
    var schema = {
      properties: {
        username: {
          description: 'username',
          type: 'string',                 // Specify the type of input to expect.
          pattern: /^\w+$/,
          message: 'Username must be letters',
          default: 'root'
        },
        email: {
          description: 'email',
          pattern: /^[a-zA-Z0-9\-\_\.\+]+@[a-zA-Z0-9\-\_\.]+\.[a-zA-Z0-9\-\_]+$/,
          message: 'Not a valid email address',
          required: true
        },
        password: {
          description: 'password',     // Prompt displayed to the user. If not supplied name will be used.
          type: 'string',                 // Specify the type of input to expect.
          pattern: /^\w+$/,                  // Regular expression that input must be valid against.
          message: 'Password must be letters', // Warning message to display if validation fails.
          hidden: true,                        // If true, characters entered will not be output to console.
          required: true
        }
      }
    };
    prompt.start();
    prompt.get(schema, function (err, result) {
      if(err){
        return cb(err);
      }
      workflow.admin = {
        username: result.username,
        email:    result.email,
        password: result.password
      };
      cb();
    });
  }], function(err, res){
    if(err){
      console.log('Error collecting config info, please try again.');
      process.exit(-1);
    }
    return workflow.emit('checkDbConnection');
  })
});


workflow.on('checkDbConnection', function(){
// Connection URL

  workflow.mongo = {uri : config.mongodb.uri };
  require('mongodb').MongoClient.connect(workflow.mongo.uri, function(err, db) {
    if(err){
      console.log('error connecting to db, please verify Mongodb setting then try again.');
      process.exit(-1);
    }else if(db){
      workflow.db = db;
    }
    return workflow.emit('initDb');
  });
});

workflow.on('initDb', function(){
  var db = workflow.db;
  async.waterfall([function(cb){
    // drop db if exists
    db.dropDatabase(function(err, result){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one admingroup doc
    db.collection('admingroups').insert({ _id: 'root', name: 'Root' }, function(err, res){
      return err? cb(err): cb();
    });
  },
  function(cb){
    // insert one admingroup doc
    db.collection('accountgroups').insert({ _id: 'general', name: 'General' }, function(err, res){
      return err? cb(err): cb();
    });
  },
  function(cb){
    // insert one admingroup doc
    db.collection('accountgroups').insert({ _id: 'admin', name: 'Admins' }, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one admin doc
    var admins = db.collection('admins');
    admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] }, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // insert one account doc
    db.collection('accounts').insert({isVerified: 'yes',groups: ['admin']}, function(err, res){
      return err? cb(err): cb();
    });
  }, function(cb){
    // encrypt password
    var bcrypt = require('bcryptjs');
    bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        return cb(err);
      }
      bcrypt.hash(workflow.admin.password, salt, function(err, hash) {
        cb(err, hash);
      });
    });
  }, function(hash, cb){
    // insert one user doc
    db.collection('admins').findOne(function(err, admin){
      if(err) return cb(err);
      db.collection('accounts').findOne(function(err, account){
        if(err) return cb(err);
        var user = {
          username: workflow.admin.username,
          password: hash,
          isActive: 'yes',
          email: workflow.admin.email,
          roles: {
            admin: admin._id,
            account: account._id
          }
        };
        db.collection('users').insert(user, function(err, res){
          return cb(err, admin._id, account._id);
        });
      });
    });
  }, function(adminId, accountId, cb){
    //patch admin
    db.collection('users').findOne(function(err, user){
      if(err) {
        return cb(err);
      }
      db.collection('admins').update({_id: adminId}, {$set: { user: { id: user._id, name: user.username } }}, function(err, res){
        return cb(err, accountId, user);
      });
    });
  }, function(accountId, user, cb){
    //patch account
    db.collection('accounts').update({_id: accountId}, {$set: { user: { id: user._id, name: user.username }}}, function(err, res){
      return err? cb(err): cb();
    });
  }], function(err, result){
    if(err){
      console.log('error initializing mongodb, please try again.');
      process.exit(-1);
    }
    return workflow.emit('complete');
  });
});

workflow.on('complete', function(){
  if(workflow.db){
    workflow.db.close();
  }
  console.log('=====Angular-Drywall initialization complete=====');
  process.exit(0);
});
console.log(123)
workflow.emit('collectUserInput');
