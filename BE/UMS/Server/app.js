'use strict';

//dependencies
var config = require('./config'),
  express = require('express'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  mongoStore = require('connect-mongo')(session),
  path = require('path'),
  passport = require('passport'),
  mongoose = require('mongoose'),
  helmet = require('helmet'),
  csrf = require('csurf');

//create express app
var app = express();

//keep reference to config
app.config = config;

//setup the web server
if (app.config.httpMode) {
  var http = require('http');
  app.httpServer = http.createServer(app);
}

if (app.config.httpsMode) {
  var https = require('https'),
    fs = require('fs');
  app.httpsServer = https.createServer({
    key: fs.readFileSync(app.config.httpsModeKeyPath),
    cert: fs.readFileSync(app.config.httpsModeCertPath)
  }, app);
}

//setup mongoose
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function() {
  //and... we have a data store
});

//config data models
require('./models')(app, mongoose);

//settings
app.disable('x-powered-by');
app.set('port', config.httpPort);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//middleware
app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('serve-static')(path.join(__dirname, 'public/dist')));
app.use(require('method-override')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser(config.cryptoKey));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.cryptoKey,
  store: new mongoStore({
    url: config.mongodb.uri
  })
}));
app.use(passport.initialize());


//setup custom routes to be used from outside of website. Before csrf is appended to the app stack
require('./routes/routes').exposedRoutes(app, passport);

app.use(csrf({ cookie: { signed: true } }));
helmet(app);

//response locals
app.use(function(req, res, next) {
  res.cookie('_csrfToken', req.csrfToken());
  res.locals.user = {};
  res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
  res.locals.user.username = req.user && req.user.username;
  next();
});

//global locals
app.locals.projectName = app.config.projectName;
app.locals.copyrightYear = new Date().getFullYear();
app.locals.copyrightName = app.config.companyName;
app.locals.cacheBreaker = 'br34k-01';

//setup passport
require('./helpers/authentication/passport')(app, passport);

//setup routes
require('./routes/routes').nonExposedRoutes(app, passport);

//custom (friendly) error handler
app.use(require('./helpers/controllers/http').http500);

//setup utilities
app.utility = {};
app.utility.sendmail = require('./helpers/sendmail');
app.utility.slugify = require('./helpers/slugify');
app.utility.workflow = require('./helpers/workflow');
app.utility.logClient = require('./clients/log');

//listen up
if (app.config.httpMode) {
  app.httpServer.listen(app.config.httpPort, function() {
    //and... we're live
    console.log("Drywall HTTP is Running...")
  });
}

if (app.config.httpsMode) {
  app.httpsServer.listen(app.config.httpsPort, function() {
    //and... we're live
    console.log("Drywall HTTPS is Running...")
  });
}
