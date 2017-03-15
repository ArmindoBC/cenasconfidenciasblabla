'use strict';
var expirationTime = require('../config').sessionTokenExpiration;

exports = module.exports = function(app, mongoose) {
    var userSessionSchema = new mongoose.Schema({
        token: { type: String, unique: true},
        user: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String, default: '' },
        },
        createdDate: { type: Date, default: Date.now },
        expirationDate: { type: Date, default: Date.now }
    });
    /*
    Before create user session instance, it generates a random token and calculates expiration data attending configurations
    */
    userSessionSchema.pre('save', function(next) {
        if (this.isNew) {

            var self = this;
            var crypto = require('crypto');
            for(var key in expirationTime){
                self.expirationDate = dateAdd(self.expirationDate, key, expirationTime[key]);
                console.log(self.expirationDate)
            }

            crypto.randomBytes(21, function(err, buf) {
                if (err) {
                    return next(new Error(err.message));
                }
                else{
                    self.token = buf.toString('hex');
                    next()
                }
            });
        }
    });
    userSessionSchema.plugin(require('./plugins/pagedFind'));
    userSessionSchema.index({ 'user.id': 1 });
    userSessionSchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('UserSession', userSessionSchema);
};

function dateAdd(ret, interval, units) {
  switch(interval) {
    case 'year'   :  ret.setFullYear(ret.getFullYear() + units);  break;
    case 'month'  :  ret.setMonth(ret.getMonth() + units);  break;
    case 'day'    :  ret.setDate(ret.getDate() + units);  break;
    case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
    case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
    case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
    default       :  ret = undefined;  break;
  }
  return ret;
}
