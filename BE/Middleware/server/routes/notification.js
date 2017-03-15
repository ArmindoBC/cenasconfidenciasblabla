'use strict';
var jsong = require('falcor-json-graph'),
  async = require('async-q'),
  GenericManager = new (require('../managers/GenericManager'))('notification'),
  LogClient = require('../clients/log'),
  AuthClient = require('../clients/auth');

/**
 * Routes related to notification operations
 */
module.exports = [
    /**
     * Route used to access notification list
     *
     */
     {
         route: "notification.list",
         call: function(callpath, args) {
             let query = args[0];
             this.authToken = args[1];

             LogClient.Log({
                 level: "DEBUG",
                 category: "incoming requests",
                 message: `Received request in route notification.list`
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
                     return GenericManager.getDocList(query, this.authToken)
                 }
             })
             .then((notificationsData) => {

                 LogClient.Log({
                     level: "DEBUG",
                     category: "information",
                     message: `Notifications list data received successfully`
                 });

                 return {
                     path: ["notification","list"],
                     value: jsong.atom(notificationsData)
                 };
             })
             .catch((err) => {
                 LogClient.Log({
                     level: "ERROR",
                     category: "notification.list route",
                     message: `Error getting notifications list data. ${err.message}`
                 });
                 return {
                     path: ["notification","list"],
                     value: jsong.error(err.message)
                 };

             });
         }
     },
     /**
      * Route used to save a notifications
      * It receives data about the notifications
     */
     {
       route: "notification.save",
       call: function(callpath, args) {
           let notificationData = args[0];
           this.authToken = args[1];

           return AuthClient.Authorize({
               token : this.authToken,
               groups : ['admin']
           })
           .then((res)=> {
               if(!res.success){
                   throw new Error("Unauthorized request.");
               }
               else{
                   return GenericManager.Create(notificationData, this.authToken)
               }
           })
           .then((notification) => {
               LogClient.Log({
                   level: "DEBUG",
                   category: "information",
                   message: `notification saved successfully`
               });
               return {
                   path: ["notification"],
                   value: jsong.atom(notification)
               };

           })
           .catch((err)=>{
               LogClient.Log({
                   level: "ERROR",
                   category: "notification.save route",
                   message: `Error saving notification. ${err.message}`
               });

               return {
                   path: ["notification"],
                   value: jsong.error(err.message)
               };
           });
       }
     },
     /**
      * Route used to access notification entity
      */
      {
          route: "notification[{keys:ids}]",
          get: function(pathSet) {
              var id = pathSet.ids;
              LogClient.Log({
                  level: "DEBUG",
                  category: "incoming requests",
                  message: `Received request in route 'notification[{keys:ids}]'`
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
              .then((notificationData) => {

                  LogClient.Log({
                      level: "DEBUG",
                      category: "information",
                      message: `notification data received successfully`
                  });

                  return {
                      path: ["notification",],
                      value: jsong.atom(notificationData)
                  };
              })
              .catch((err) => {
                  LogClient.Log({
                      level: "ERROR",
                      category: "notification[{keys:ids}] route",
                      message: `Error getting notification data. ${err.message}`
                  });
                  return {
                      path: ["notification"],
                      value: jsong.error(err.message)
                  };

              });
          }
      },
      /**
       * Route used to update an notification
       * It receives data about the notification
      */
      {
        route: "notification.update",
        call: function(callpath, args) {
            let notificationData = args[0];
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
                    return GenericManager.Patch(notificationData, this.authToken)
                }
            })
            .then((notification) => {
                LogClient.Log({
                    level: "DEBUG",
                    category: "information",
                    message: `notification updated successfully`
                });
                return {
                    path: ["notification"],
                    value: jsong.atom(notification)
                };

            })
            .catch((err)=>{
                LogClient.Log({
                    level: "ERROR",
                    category: "notification.update route",
                    message: `Error saving notificationData. ${err.message}`
                });
                return {
                    path: ["notification"],
                    value: jsong.error(err.message)
                };
            });
        }
      },
      /**
       * Route used to delete an notification
       * It receives data about the notification
      */
      {
        route: "notification.delete",
        call: function(callpath, args) {
            let notificationData = args[0];
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
                    return GenericManager.Delete(notificationData.id, this.authToken)
                }
            })
            .then((notification) => {
                LogClient.Log({
                    level: "DEBUG",
                    category: "information",
                    message: `notification deleted successfully`
                });
                return {
                    path: ["notification"],
                    value: jsong.atom(notification)
                };

            })
            .catch((err)=>{
                LogClient.Log({
                    level: "ERROR",
                    category: "notification.delete route",
                    message: `Error deleting notificationData. ${err.message}`
                });
                return {
                    path: ["notification"],
                    value: jsong.error(err.message)
                };
            });
        }
      }


];
