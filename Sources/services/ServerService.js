"use strict";
var Express = require('express'),
passport = require('passport'),
session = require('express-session'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
ConfigurationService = require('../services/ConfigurationService.js'),
LogClient = require('../clients/log');

class ServerService {

    constructor() {}

    Initialize() {
        //Start App
        this.app = Express();

        this.app.use(cookieParser('secret'));
        this.app.use(session({
            secret: "keyboard cat",
            saveUninitialized: true,
            resave: true,
            cookie: {
                maxAge: 60000
            }
        }));
        this.app.use(bodyParser.json());
        this.app.use(passport.initialize());
        this.app.use(passport.session());

        //add authentication strategies and endpoints
        require('../helpers/authentication')(this.app, passport);

        //Make Client app available
        this.app.use(Express.static(__dirname + '/../public'));

        //Set EJS Engine
        this.app.set('view engine', 'ejs');
        this.app.get('*', function(req, res) {
            LogClient.Log({
                level: 'TRACE',
                category: "requests received",
                message: "Path / requested"
            });
            res.render('index', {
                configurations: ConfigurationService.GetLogConfigurations()
            });
        });
    }

    Start() {
        if (ConfigurationService.IsHTTPModeEnabled()) {
            var http = require('http');
            this.app.httpServer = http.createServer(this.app);
            this.app.httpServer.listen(ConfigurationService.GetHttpPort(), function() {
                LogClient.Log({
                    level: "INFO",
                    category: "server status",
                    message: `HTTP Listening for connections on ${ConfigurationService.GetHttpPort()}...`
                });
            });
        }

        if (ConfigurationService.IsHTTPSModeEnabled()) {
            var fs = require('fs'),
            https = require('https');
            this.app.httpsServer = https.createServer({
                key: fs.readFileSync(ConfigurationService.GetCertKeyPath()),
                cert: fs.readFileSync(ConfigurationService.GetCertPath())
            }, this.app);
            this.app.httpsServer.listen(ConfigurationService.GetHttpsPort(), function() {
                LogClient.Log({
                    level: "INFO",
                    category: "server status",
                    message: `HTTPS Listening for connections on ${ConfigurationService.GetHttpsPort()}...`
                });
            });
        }
    }

}
module.exports = new ServerService();
