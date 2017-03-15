'use strict';

exports = module.exports = function(app, mongoose) {

    var categories = ['Error', 'Signup', 'Login', 'Logout','ForgotPassword', 'ResetPassword',
                        'SocialConnect', 'SocialDisconnect', 'ForgotPassword', 'ResetPassword', 'ChangePassword'];

    var activityHistorySchema = new mongoose.Schema({
        timestamp: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        machineName: { type: String},
        category: { type: String , enum : categories},
        message: {type: String }
    });
    activityHistorySchema.plugin(require('./plugins/pagedFind'));
    activityHistorySchema.index({ 'user': 1 });
    activityHistorySchema.index({ 'category': 1 });
    activityHistorySchema.set('autoIndex', (app.get('env') === 'development'));
    app.db.model('ActivityHistory', activityHistorySchema);
};
