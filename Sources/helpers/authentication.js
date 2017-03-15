'use strict';

exports = module.exports = function(app, passport) {
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    LinkedInStrategy = require('passport-linkedin').Strategy,
    ConfigurationService = require('../services/ConfigurationService');



    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user)
    });

    //Google
    passport.use(new GoogleStrategy({
        clientID: ConfigurationService.GetGoogleConfigurations().clientID,
        clientSecret: ConfigurationService.GetGoogleConfigurations().clientSecret,
        callbackURL: "/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        done(null, {
            accessToken: accessToken,
            refreshToken: refreshToken,
            profile: profile
        });
    }
));

//Facebook
passport.use(new FacebookStrategy({
    clientID: ConfigurationService.GetFacebookConfigurations().clientID,
    clientSecret: ConfigurationService.GetFacebookConfigurations().clientSecret,
    callbackURL: "/auth/facebook/callback",
    profileFields: ['id', 'email', 'gender', 'link', 'locale', 'name', 'timezone','photos', 'displayName'],
},
function(accessToken, refreshToken, profile, done) {
    done(null, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
    });
}
));

//LinkedIn
passport.use(new LinkedInStrategy({
    consumerKey: ConfigurationService.GetLinkedinConfigurations().clientID,
    consumerSecret: ConfigurationService.GetLinkedinConfigurations().clientSecret,
    callbackURL: "/auth/linkedin/callback",
    profileFields: ['id', 'first-name', 'last-name', 'email-address', 'headline','picture-url'],
},
function(accessToken, refreshToken, profile, done) {
    done(null, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile
    });
}
));

//Google
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile email']
}));
app.get('/auth/google/callback', function(req, res, next) {
    req._passport.instance.authenticate('google', function(err, info) {
        if (info) {
            req.session.user = info.profile
            return res.sendStatus(200);
        } else {
            return res.sendStatus(400);
        }
    })(req, res, next);
});


//Facebook
app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['email']
}));
app.get('/auth/facebook/callback', function(req, res, next) {
    req._passport.instance.authenticate('facebook', function(err, info) {
        if (info) {
            req.session.user = info.profile
            
            return res.sendStatus(200);
        } else {
            return res.sendStatus(400);
        }
    })(req, res, next);
});

//LinkedIn
app.get('/auth/linkedin', passport.authenticate('linkedin', {
    scope: ['r_basicprofile', 'r_emailaddress']
}));
app.get('/auth/linkedin/callback', function(req, res, next) {
    req._passport.instance.authenticate('linkedin', function(err, info) {
        if (info) {
            req.session.user = info.profile
            return res.sendStatus(200);
        } else {
            return res.sendStatus(400);
        }
    })(req, res, next);
});


app.get('/api/me', function(req, res) {
    if (req.session.user) {
        res.send(req.session.user);
        req.session.destroy();

    } else {
        res.status(404).send("Not Found");
    }
});

}
