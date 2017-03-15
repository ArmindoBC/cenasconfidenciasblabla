'use strict';
var logConfigs = require('./config'),
mongo = logConfigs.mongoConfigs;
var mongoose = require('mongoose');
mongoose.connect('mongodb://'+mongo.host+'/insurance');

/**
 *
 * Database connection to the test suite
 *
 */

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	  });
var newLog = mongoose.Schema({
	level: String,
	timestamp: String,
	machineName: String,
	projectName: String,
	category: String,
	message: String,
	additionalNotes: String
});
class DatabaseConnect {
	writeLog(msg){
		var msg_string = msg.content.toString();
		var testLog = new WritteLog(
		{
			level: JSON.parse(msg_string).level,
			timestamp: JSON.parse(msg_string).timestamp,
			machineName: JSON.parse(msg_string).machineName,
			projectName: JSON.parse(msg_string).projectName,
			category: JSON.parse(msg_string).category,
			message: JSON.parse(msg_string).message,
			optionalData: JSON.parse(msg_string).optionalData
		});
		testLog.save(function (err, data) {
		});
	}
	count(filter){
		filter = filter ? filter : {};
		var WritteLog = mongoose.model('Log', newLog);
		var deferred = Promise.defer();
		WritteLog.count(filter, function(err, c) {
			deferred.resolve(c);
		});
		return deferred.promise;
	}
}

module.exports = new DatabaseConnect();