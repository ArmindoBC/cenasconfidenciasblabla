angular.module('services.accountResource', ['security.service']).factory('accountResource', ['$http', '$q', '$log', 'security','$sessionStorage', function ($http, $q, $log, security, $sessionStorage) {
  // local variable
  var baseUrl = '/api';
  var processResponse = function(res){
    return res.data;
  };
  var processError = function(e){
    var msg = [];
    if(e.status)         { msg.push(e.status); }
    if(e.statusText)     { msg.push(e.statusText); }
    if(msg.length === 0) { msg.push('Unknown Server Error'); }
    return $q.reject(msg.join(' '));
  };
  // public api
  var resource = {};
  resource.sendMessage = function(data){
    return $http.post(baseUrl + '/sendMessage', data).then(processResponse, processError);
  };

  resource.getAccountDetails = function(){
    return $http({
        method:'GET',
        url:baseUrl + '/account/settings',
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.setAccountDetails = function(data){
    return $http({
        method:'PUT',
        url:baseUrl + '/account/settings',
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.setIdentity = function(data){
      return $http({
          method:'PUT',
          url:baseUrl + '/account/settings/identity',
          data: data,
          headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
      }).then(processResponse, processError);
  };
  resource.setPassword = function(data){
      return $http({
          method:'PUT',
          url:baseUrl + '/account/settings/password',
          data: data,
          headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
      }).then(processResponse, processError);
  };

  resource.resendVerification = function(email){
      return $http({
          method:'POST',
          url:baseUrl + '/account/verification',
          data: {email: email},
          headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
      }).then(processResponse, processError);
  };

  resource.upsertVerification = function(){
      return $http({
          method:'GET',
          url:baseUrl + '/account/verification',
          headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
      }).then(processResponse, processError);
  };

  resource.verifyAccount = function(token){
      return $http({
          method:'GET',
          url:baseUrl + '/account/verification'+ token,
          headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
      }).then(processResponse, processError)
      .then(function(data){
        //this saves us another round trip to backend to retrieve the latest currentUser obj
        if(data.success && data.user){
          security.setCurrentUser(data.user);
        }
        return data;
      });
  };
  return resource;
}]);
