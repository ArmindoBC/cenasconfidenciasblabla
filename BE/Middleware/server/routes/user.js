'use strict';
var jsong = require('falcor-json-graph'),
  async = require('async-q'),
  GenericManager = new (require('../managers/GenericManager'))('user'),
  LogClient = require('../clients/log'),
  AuthClient = require('../clients/auth');

/**
 * Routes related to user operations
 */
module.exports = [
    /**
     * Route used to access user list
     *
     */
     {
         route: "user.list",
         call: function(callpath, args) {
             let query = args[0];
             this.authToken = args[1];

             LogClient.Log({
                 level: "DEBUG",
                 category: "incoming requests",
                 message: `Received request in route user.list`
             });

             return AuthClient.Authorize({
                 token : this.authToken,
                 groups : ['admin']
             })
             .then((res)=> {
                 if(!res.success){
                     throw new Error("Unauthorized request.");
                 }
                 else{
                     return GenericManager.getDocList(query, this.authToken)
                 }
             })
             .then((usersData) => {

                 LogClient.Log({
                     level: "DEBUG",
                     category: "information",
                     message: `Users list data received successfully`
                 });

                 return {
                     path: ["user","list"],
                     value: jsong.atom(usersData)
                 };
             })
             .catch((err) => {
                 LogClient.Log({
                     level: "ERROR",
                     category: "user.list route",
                     message: `Error getting users list data. ${err.message}`
                 });
                 return {
                     path: ["user","list"],
                     value: jsong.error(err.message)
                 };

             });
         }
     },
     /**
      * Route used to access user entity
      */
      {
          route: "user[{keys:ids}]",
          get: function(pathSet) {
              var id = pathSet.ids;
              LogClient.Log({
                  level: "DEBUG",
                  category: "incoming requests",
                  message: `Received request in route 'user[{keys:ids}]'`
              });

              return AuthClient.Authorize({
                  token : this.authToken,
                  groups : ['admin','general']
              })
              .then((res)=> {
                  if(!res.success){
                      throw new Error("Unauthorized request.");
                  }
                  else{
                      return GenericManager.getDocById(id, this.authToken)
                  }
              })
              .then((userData) => {

                  LogClient.Log({
                      level: "DEBUG",
                      category: "information",
                      message: `user data received successfully`
                  });

                  return {
                      path: ["user"],
                      value: jsong.atom(userData)
                  };
              })
              .catch((err) => {
                  LogClient.Log({
                      level: "ERROR",
                      category: "user[{keys:ids}] route",
                      message: `Error getting user data. ${err.message}`
                  });
                  return {
                      path: ["user"],
                      value: jsong.error(err.message)
                  };

              });
          }
      },
      /**
       * Route used to update an user
       * It receives data about the user
      */
      {
        route: "user.update",
        call: function(callpath, args) {
            let userData = args[0];
            this.authToken = args[1];

            return AuthClient.Authorize({
                token : this.authToken,
                groups : ['admin','general']
            })
            .then((res)=> {
                if(!res.success){
                    throw new Error("Unauthorized request.");
                }
                else{
                    return GenericManager.Patch(userData, this.authToken)
                }
            })
            .then((user) => {
                LogClient.Log({
                    level: "DEBUG",
                    category: "information",
                    message: `user updated successfully`
                });
                return {
                    path: ["user"],
                    value: jsong.atom(user)
                };

            })
            .catch((err)=>{
                LogClient.Log({
                    level: "ERROR",
                    category: "user.update route",
                    message: `Error saving userData. ${err.message}`
                });
                return {
                    path: ["user"],
                    value: jsong.error(err.message)
                };
            });
        }
      }

];
