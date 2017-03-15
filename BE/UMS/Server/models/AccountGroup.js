'use strict';

exports = module.exports = function(app, mongoose) {
  var accountGroupSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String, default: '' },
    permissions: [{ name: String, permit: Boolean }]
  });
  accountGroupSchema.plugin(require('./plugins/pagedFind'));
  accountGroupSchema.index({ name: 1 }, { unique: true });
  accountGroupSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('AccountGroup', accountGroupSchema);
};
