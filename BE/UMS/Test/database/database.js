'use strict';
var configs = require('../configs/config'),
	mongoose = require('mongoose');


mongoose.connect(`mongodb://${configs.mongoConfigsUMS.host}:${configs.mongoConfigsUMS.port}/${configs.mongoConfigsUMS.database}`);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	var UsersSchema = new mongoose.Schema({}, { strict: false });
	var UsersModel = mongoose.model('users', UsersSchema);

	var UserSessionSchema = new mongoose.Schema({}, { strict: false });
	var UserSessionModel = mongoose.model('usersessions', UsersSchema);

	exports.UsersModel = UsersModel;
	exports.UserSessionModel = UserSessionModel;
});
