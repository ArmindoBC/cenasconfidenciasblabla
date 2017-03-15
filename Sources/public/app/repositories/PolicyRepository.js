app.service('PolicyRepository', ["RequestService", function(RequestService) {
  var logClient = new LogClient();

  /*

  */
  this.SavePolicy = function(policyData) {
    logClient.SendLog({
      level:'DEBUG',
      category : "information",
      message :"policy.save route from Middleware called"
    });

    var data = {} ;
    angular.copy(policyData, data);
    
    if(data.selectedCoverages){
        data.selectedCoverages = [].concat(data.selectedCoverages.basic, data.selectedCoverages.recommended, data.selectedCoverages.premium);
    }
    /*
    * save policy
    */
    return RequestService.GetFalcorModel().call("policy.save", [data])
        .then(function(value) {
            logClient.SendLog({
              level:'DEBUG',
              category : "information",
              message :"data received from Middleware policy.save route"
            });
            return(value.json.policy);
        })
        .catch(function(err){
            logClient.SendLog({
                level:'ERROR',
                category : "information",
                message :"policy.save route from Middleware retrieved an error: " + err.message
            });
            console.log(err);
            throw err;
        });
    };

  /*
   * Get all policies available. Some additional paramaters can be added in order to filter by specific criteria
   */
    this.GetPolicyList = function(authToken, params) {
    logClient.SendLog({
      level:'DEBUG',
      category : "information",
      message :"policy.list route from Middleware called"
    });

    return RequestService.GetFalcorModel().call("policy.list", [params, authToken])
        .then(function(value){
            logClient.SendLog({
              level:'DEBUG',
              category : "information",
              message :"data received from Middleware policy.list route"
            });
            return value.json.policy.list;
        })
        .catch(function(err){
            logClient.SendLog({
                level:'ERROR',
                category : "information",
                message :"policy.list route from Middleware retrieved an error: " + err.message
            });
            throw err;
        });
    };

}]);
