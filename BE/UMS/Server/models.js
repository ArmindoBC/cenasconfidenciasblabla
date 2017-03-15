'use strict';

exports = module.exports = function(app, mongoose) {

  //then regular docs
  require('./models/User')(app, mongoose);
  require('./models/Admin')(app, mongoose);
  require('./models/AdminGroup')(app, mongoose);
  require('./models/Account')(app, mongoose);
  require('./models/AccountGroup')(app, mongoose);
  require('./models/LoginAttempt')(app, mongoose);

  //custom modules
  require('./models/UserSession')(app, mongoose);
  require('./models/ActivityHistory')(app, mongoose);

};
