/**
 *
 * UMS routes config
 *
 */


'use strict';
var jsong = require('falcor-json-graph'),
  authClient = require('../clients/auth'),
  LogClient = require('../clients/log');

module.exports = [{
    route: "socialLogin.[{keys:provider}]",
    call: function(callpath, args) {
      let provider = callpath.provider[0];
      let userData = args[0];

      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route social.login`
      });

      return authClient.SocialLogin(provider, userData)
        .then((result) => {
          if (result.success) {
            LogClient.Log({
              level: "DEBUG",
              category: "information",
              message: `Successfully social login with provider ${provider}`
            });
            return {
              path: ["socialLogin", provider],
              value: jsong.atom(result)
            };
          } else {
            LogClient.Log({
              level: "ERROR",
              category: "social.login route",
              message: `Error in social login with provider ${provider}`
            });
            return {
              path: ["socialLogin", provider],
              value: jsong.error(result)
            };
          }
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "social.login route",
            message: `Error in social login with provider ${provider} : ${err.message}`
          });
          return {
            path: ["socialLogin", provider],
            value: jsong.error(err)
          };
        });

    }
  }, {
    route: "signup",
    call: function(callpath, args) {
      let userData = args[0];

      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route signup`
      });

      return authClient.Signup(userData)
        .then((result) => {
          if (result.success) {
            LogClient.Log({
              level: "DEBUG",
              category: "information",
              message: `Successfully local signup`
            });
            return {
              path: ["signup"],
              value: jsong.atom(result)
            };
          } else {
            LogClient.Log({
              level: "ERROR",
              category: "signup route",
              message: `Error in local signup`
            });
            return {
              path: ["signup"],
              value: jsong.error(result)
            };
          }
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "signup route",
            message: `Error in local signup : ${err.message}`
          });
          return {
            path: ["signup"],
            value: jsong.error(err)
          };
        });

    }
  }, {
    route: "login",
    call: function(callpath, args) {
      let userData = args[0];

      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route login`
      });

      return authClient.Login(userData)
        .then((result) => {
          if (result.success) {
            LogClient.Log({
              level: "DEBUG",
              category: "information",
              message: `Successfully local login`
            });
            return {
              path: ["login"],
              value: jsong.atom(result)
            };
          } else {
            LogClient.Log({
              level: "ERROR",
              category: "login route",
              message: `Error in local login`
            });
            return {
              path: ["login"],
              value: jsong.error(result)
            };
          }
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "login route",
            message: `Error in local login : ${err.message}`
          });
          return {
            path: ["login"],
            value: jsong.error(err)
          };
        });

    }
  },{
        route: "login-ad",
        call: function(callpath, args){
            let userData = args[0];

            LogClient.Log({ level:"INFO", category : "incoming requests", message : `Received request in route login-ad`});

            return authClient.LoginAD(userData)
                .then((result) => {
                    if(result.success){
                        LogClient.Log({ level:"DEBUG", category : "information", message : `Successfully Active Directory login`});
                        return {path: ["login"], value: jsong.atom(result)};
                    }
                    else{
                        LogClient.Log({ level:"ERROR", category : "login-ad route", message : `Error in Active Directory login`});
                        return {path: ["login"], value: jsong.error(result)};
                    }
                })
                .catch((err)=>{
                    LogClient.Log({ level:"ERROR", category : "login-ad route", message : `Error in Active Directory login : ${err.message}`});
                    return {path: ["login"], value: jsong.error(err)};
                });

        }
    }, {
    route: "authorize",
    call: function(callpath, args) {
      let authorizationData = args[0];
      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route authorize`
      });
      return authClient.Authorize(authorizationData)
        .then((result) => {
          if (result.success) {
            LogClient.Log({
              level: "DEBUG",
              category: "information",
              message: `Successfully authorization`
            });
            return {
              path: ["authorize"],
              value: jsong.atom(result)
            };
          } else {
            LogClient.Log({
              level: "ERROR",
              category: "authorize route",
              message: `Error in authorization`
            });
            return {
              path: ["authorize"],
              value: jsong.error(result)
            };
          }
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "authorize route",
            message: `Error in authorization : ${err.message}`
          });
          return {
            path: ["authorize"],
            value: jsong.error(err)
          };
        });

    }
  }, {
    route: "logout",
    call: function(callpath, args) {
      let logoutData = args[0];
      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route logout`
      });
      return authClient.Logout(logoutData.token)
        .then((result) => {
          if (result.success) {
            LogClient.Log({
              level: "DEBUG",
              category: "information",
              message: `Successfully logout`
            });
            return {
              path: ["logout"],
              value: jsong.atom(result)
            };
          } else {
            LogClient.Log({
              level: "ERROR",
              category: "logout route",
              message: `Error in logout`
            });
            return {
              path: ["logout"],
              value: jsong.error(result)
            };
          }
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "logout route",
            message: `Error in logout : ${err.message}`
          });
          return {
            path: ["logout"],
            value: jsong.error(err)
          };
        });
    }
  }, {
    route: "currentUser",
    get: function(pathSet) {
      LogClient.Log({
        level: "INFO",
        category: "incoming requests",
        message: `Received request in route currentUser`
      });
      if (this.authToken) {
        return authClient.CurrentUser(this.authToken)
          .then((result) => {
            if (result.success) {
              LogClient.Log({
                level: "DEBUG",
                category: "information",
                message: `Current user data successfuly obtained`
              });
              return {
                path: ["currentUser"],
                value: jsong.atom(result)
              };
            } else {
              LogClient.Log({
                level: "ERROR",
                category: "currentUser route",
                message: `Error obtaining current user information`
              });
              return {
                path: ["currentUser"],
                value: jsong.error(result)
              };
            }
          })
          .catch((err) => {
            LogClient.Log({
              level: "ERROR",
              category: "currentUser route",
              message: `Error obtaining current user information : ${err.message}`
            });
            return {
              path: ["currentUser"],
              value: jsong.error(err)
            };
          });
      } else {
        LogClient.Log({
          level: "ERROR",
          category: "currentUser route",
          message: `Error obtaining current user information : Authentication token must be provided in authorization header`
        });
        return {
          path: ["currentUser"],
          value: jsong.error("Authentication token must be provided in authorization header")
        };
      }


    }
  }

];
