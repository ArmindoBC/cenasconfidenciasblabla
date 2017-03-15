"use strict";
//RequestService
//Handles HTTP requests to a Server
app.service('RequestService', ["$http", function($http) {

    this.GetFalcorModel = function(authToken) {

         var headers = {};
          if(authToken){
              headers.Authorization = "Bearer " + authToken;
              headers['content-type'] = "application/x-www-form-urlencoded"
          }
          this.model = new falcor.Model({
              source: new falcor.HttpDataSource(configurations.FalcorRouterConfigs.host+':'+configurations.FalcorRouterConfigs.port+ "/model.json",
              {
                  headers: headers,
                  crossDomain: true
              }
          )});

       return this.model;
     }

    //Request Data Async
    this.RequestAsync = function(requestMethod, address, data, handler, successCallback, errorCallback) {
        //Write Request
        var req = {
            method: requestMethod.toUpperCase(),
            url: address,
            data: (data != null) ? data : null
        };

        //Make Request
        $http(req).success(function(data, status, headers, config) {
            //Success
            successCallback(handler, data);
        }).error(function(data, status, headers, config) {
            //Error
            errorCallback(handler, data);
        });
    };

}]);
