'use strict';
var jsong = require('falcor-json-graph'),
  async = require('async-q'),
  PolicyManager = require('../managers/PolicyManager'),
  LogClient = require('../clients/log'),
  AuthClient = require('../clients/auth');

/**
 * Routes related to bundle operations
 */
module.exports = [
  /**
   * Route used to save the policy bundle wanted by the user.
   * It receives data about user, company and selected coverages, insured properties and payment methods
  */
  {
    route: "policy.save",
    call: function(callpath, args) {

        let policyData = args[0];

        return Promise.resolve()
        .then(() => {
            if(policyData.id){
                return PolicyManager.Update(policyData, this.authToken)
            }
            else{
                return PolicyManager.Create(policyData, this.authToken)
            }
        })
        .then((policy) => {
            LogClient.Log({
                level: "DEBUG",
                category: "information",
                message: `Policy saved successfully`
            });
            return {
                path: ["policy"],
                value: jsong.atom(policy)
            };

        })
        .catch((err)=>{
            console.log(err.stack)
            LogClient.Log({
                level: "ERROR",
                category: "policy.save route",
                message: `Error saving policy. ${err.message}`
            });

            return {
                path: ["policy"],
                value: jsong.error(err.message)
            };
        });
    }
  },
  /**
   * Route used to access policy list
   *
  */
  {
    route: "policy.list",
    call: function(callpath, args) {
        let query = args[0];
        this.authToken = args[1];

        LogClient.Log({
          level: "DEBUG",
          category: "incoming requests",
          message: `Received request in route policy.list`
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
            return PolicyManager.getPolicyList(query, this.authToken)
          }
        })
        .then((policyData) => {
          LogClient.Log({
            level: "DEBUG",
            category: "information",
            message: `Policy list data received successfully`
          });

          return {
            path: ["policy","list"],
            value: jsong.atom(policyData)
          };
        })
        .catch((err) => {
          LogClient.Log({
            level: "ERROR",
            category: "policy.list route",
            message: `Error getting policy list data. ${err.message}`
          });
          return {
            path: ["policy","list"],
            value: jsong.error(err.message)
          };

        });
    }
  }
];
