'use strict';

exports = module.exports = function(app, mongoose) {
  var accountSchema = new mongoose.Schema({
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' }
    },
    isVerified: { type: String, default: '' },
    verificationToken: { type: String, default: '' },
    name: {
      first: { type: String, default: '' },
      middle: { type: String, default: '' },
      last: { type: String, default: '' },
      full: { type: String, default: '' }
    },
    company: { type: String, default: '' },
    phone: { type: String, default: '' },
    zip: { type: String, default: '' },
    userCreated: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: '' },
      time: { type: Date, default: Date.now }
    },
    search: [String],
    groups: [{ type: String, ref: 'AccountGroup' }]
  });
  accountSchema.methods.hasPermissionTo = function(something) {
    //check group permissions
    var groupHasPermission = false;
    for (var i = 0 ; i < this.groups.length ; i++) {
      for (var j = 0 ; j < this.groups[i].permissions.length ; j++) {
        if (this.groups[i].permissions[j].name === something) {
          if (this.groups[i].permissions[j].permit) {
            groupHasPermission = true;
          }
        }
      }
    }

    //check account permissions
    for (var k = 0 ; k < this.permissions.length ; k++) {
      if (this.permissions[k].name === something) {
        if (this.permissions[k].permit) {
          return true;
        }

        return false;
      }
    }

    return groupHasPermission;
  };
  accountSchema.methods.isMemberOf = function(group) {
    for (var i = 0 ; i < this.groups.length ; i++) {
      if (this.groups[i]._id === group) {
        return true;
      }
    }

    return false;
  };
  accountSchema.plugin(require('./plugins/pagedFind'));
  accountSchema.index({ user: 1 });
  accountSchema.index({ search: 1 });
  accountSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Account', accountSchema);
};
