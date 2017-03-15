
var AuthClient = (function(){

    function AuthClient(authToken){
        var headers = {};
        if(authToken){
            headers.Authorization = "Bearer " + authToken;
        }
        this.falcorModel = new falcor.Model({
            source: new falcor.HttpDataSource(configurations.FalcorRouterConfigs.host+':'+configurations.FalcorRouterConfigs.port+configurations.FalcorRouterConfigs.authPath,
            {
                headers: headers,
                crossDomain: true
            }
        )});


        this.logClient = new LogClient();
    }

    AuthClient.prototype.openPopup = function(provider){
        return new Promise(function(resolve, reject){
            var popup = window.open('/auth/' + provider + '/', "Authentication Window", 600, 400);
            var timer = setInterval(function() {
                try{
                    if (popup.location.href == null) {
                        clearInterval(timer);
                        resolve();
                        return;
                    }
                    if (popup.location.href.indexOf("code=") > 0 || popup.location.href.indexOf("oauth_token=") > 0) {
                        popup.close();
                        resolve();
                        clearInterval(timer);
                    }
                }
                catch(err){}

            },500);
        })
    }
    AuthClient.prototype.CallFalcorRouter = function(route, data){
        return this.falcorModel.call(route, [data])
        .then(function (response) {
            return response;
        });
    }
    AuthClient.prototype.GetFalcorRouter = function(route, data){
        return this.falcorModel.get(route)
        .then(function (response) {
            return response;
        });
    }
    AuthClient.prototype.SocialLogin = function(provider, userData){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Social Login started with " + provider + ' provider.' });

        if(provider && userData){
            return this.CallFalcorRouter(['socialLogin', [provider]], userData)
            .then(function(res){
                if(res){
                    self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Social login data received from " + provider + ' provider.' });
                    return res.json.socialLogin[provider]
                }
                else{
                    self.logClient.SendLog({ level:'WARN', category : "information", message :"No data received from social login with " + provider + ' provider.' });
                    return res;
                }
            });
        }
        else{
            self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Social login not allowed because provider or user data was not received." });
            return Promise.reject(false);
        }
    }

    AuthClient.prototype.Signup = function(userData){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Signup a local account" });
        return this.CallFalcorRouter(['signup'], userData)
        .then(function(res){
            if(res){
                self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Signup data received." });
                return res.json.signup;
            }
            else{
                self.logClient.SendLog({ level:'WARN', category : "information", message :"No data received from local  signup." });
                return res;
            }
        });
    }

    AuthClient.prototype.Login = function(userData){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Login with a local account" });

        if(userData){
            return this.CallFalcorRouter(['login'], userData)
            .then(function(res){
                if(res){
                    self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Login data received." });
                    return res.json.login;
                }
                else{
                    self.logClient.SendLog({ level:'WARN', category : "information", message :"No data received from local login." });
                    return res;
                }
            });
        }
        else{
            self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Local login not allowed because user data was not received." });
            return Promise.reject(false);
        }
    }
    AuthClient.prototype.LoginAD = function(userData){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Login with a Active Directory account" });

        if(userData){
            return this.CallFalcorRouter(['login-ad'], userData)
            .then(function(res){
                if(res){
                    self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Active Directory login data received." });
                    return res.json.login;
                }
                else{
                    self.logClient.SendLog({ level:'WARN', category : "information", message :"No data received from Active Directory login." });
                    return res;
                }
            });
        }
        else{
            self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Active Directory login not allowed because user data was not received." });
            return Promise.reject(false);
        }
    }

    AuthClient.prototype.Authorize = function(token, groups){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Authorize token" });
        if(token){
            var authorizationData = { token : token, groups : groups};
            return this.CallFalcorRouter(['authorize'], authorizationData)
            .then(function(res){
                self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Authorization data received." });
                return res.json.authorize;
            })
        }
        else{
            self.logClient.SendLog({ level:'WARN', category : "information", message :"Authorization failed because token was not provided." });
            return Promise.reject(false);
        }
    }
    AuthClient.prototype.Logout = function(token){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Logout: invalidating usersession" });
        if(token){
            var logoutData = { token : token };
            return this.CallFalcorRouter(['logout'], logoutData)
            .then(function(res){
                self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Logout data received." });
                return res.json.logout;
            })
            .catch(function(err){
                throw err;
            });
        }
        else{
            self.logClient.SendLog({ level:'WARN', category : "information", message :"Logout failed because token was not provided." });
            return Promise.reject(false);
        }
    }

    AuthClient.prototype.CurrentUser = function(token){
        var self = this;
        self.logClient.SendLog({ level:'DEBUG', category : "information", message :"CurrentUser: obtaining current user data" });
        return this.GetFalcorRouter(['currentUser'])
            .then(function(res){
                self.logClient.SendLog({ level:'DEBUG', category : "information", message :"Current user data received." });
                return res.json.currentUser;
            })
            .catch(function(err){
                throw err;
            });

    }

    return AuthClient;
})()
