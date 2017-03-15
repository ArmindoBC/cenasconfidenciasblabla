angular.module('services.adminResource', []).factory('adminResource', ['$http', '$q', '$sessionStorage', function ($http, $q, $sessionStorage) {
  // local variable
  var baseUrl = '/api';
  var userUrl = baseUrl + '/admin/users';
  var accountUrl = baseUrl + '/admin/accounts';
  var administratorUrl = baseUrl + '/admin/administrators';
  var adminGroupUrl = baseUrl + '/admin/admin-groups';
  var adminUserSessionsUrl = baseUrl + '/admin/usersessions';
  var adminActivitiesUrl = baseUrl + '/admin/activity-history';
  var accountGroupUrl = baseUrl + '/admin/account-groups';

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
  resource.getStats = function(){
    return $http({
        method: 'GET',
        url:baseUrl + '/admin',
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.search = function(query){
    return $http({
        url: baseUrl + '/admin/search',
        params: { q: query },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- users api -----
  resource.findUsers = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method: 'GET',
        url:userUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
     }).then(processResponse, processError);
  };
  resource.addUser = function(username){
    return $http({
        method: "POST",
        url:userUrl,
        data: { username: username },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findUser = function(_id){
    var url = userUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateUser = function(_id, data){
    var url = userUrl + '/' + _id;
    return $http({
        mehtod: 'PUT',
        url:url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.setPassword = function(_id, data){
    var url = userUrl + '/' + _id + '/password';
    return $http({
        method: 'PUT',
        url:url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.linkAdmin = function(_id, data){
    var url = userUrl + '/' + _id + '/role-admin';
    return $http({
        method: 'PUT',
        url: url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.unlinkAdmin = function(_id){
    var url = userUrl + '/' + _id + '/role-admin';
    return $http({
        method: 'DELETE',
        url: url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.linkAccount = function(_id, data){
    var url = userUrl + '/' + _id + '/role-account';
    return $http({
        method: 'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.unlinkAccount = function(_id){
    var url = userUrl + '/' + _id + '/role-account';
    return $http({
        method:'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteUser = function(_id){
    var url = userUrl + '/' + _id;
    return $http({
        method:'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- accounts api -----
  resource.findAccounts = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method:'GET',
        url: accountUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.addAccount = function(fullname){
    return $http({
        method:'POST',
        url:accountUrl,
        data: { 'name.full': fullname },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findAccount = function(_id){
    var url = accountUrl + '/' + _id;
    return $http({
        method: 'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateAccount = function(_id, data){
    var url = accountUrl + '/' + _id;
    return $http({
        method:'PUT',
        url:url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.linkUser = function(_id, data){
    var url = accountUrl + '/' + _id + '/user';
    return $http({
        method: 'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.unlinkUser = function(_id){
    var url = accountUrl + '/' + _id + '/user';
    return $http({
        method: 'DELETE',
        url: url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.newAccountNote = function(_id, data){
    var url = accountUrl + '/' + _id + '/notes';
    return $http({
        method: 'POST',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.newAccountStatus = function(_id, data){
    var url = accountUrl + '/' + _id + '/status';
    return $http({
        method: 'POST',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteAccount = function(_id){
    var url = accountUrl + '/' + _id;
    return $http({
        method:'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.saveAccountGroups = function(_id, data){
    var url = accountUrl + '/' + _id + '/groups';
    return $http({
        method: 'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- administrators api -----
  resource.findAdministrators = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method: 'GET',
        url:administratorUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.addAdministrator = function(fullname){
    return $http({
        method:'POST',
        url:administratorUrl,
        data: { 'name.full': fullname },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findAdministrator = function(_id){
    var url = administratorUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateAdministrator = function(_id, data){
    var url = administratorUrl + '/' + _id;
    return $http({
        method:'PUT',
        url: url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.adminLinkUser = function(_id, data){
    var url = administratorUrl + '/' + _id + '/user';
    return $http({
        method: 'PUT',
        url: url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.adminUnlinkUser = function(_id){
    var url = administratorUrl + '/' + _id + '/user';
    return $http({
        method: 'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.saveAdminGroups = function(_id, data){
    var url = administratorUrl + '/' + _id + '/groups';
    return $http({
        method: 'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.saveAdminPermissions = function(_id, data){
    var url = administratorUrl + '/' + _id + '/permissions';
    return $http({
        method:'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteAdministrator = function(_id){
    var url = administratorUrl + '/' + _id;
    return $http({
        method: 'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- admin-groups api -----
  resource.findAdminGroups = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method:'GET',
        url: adminGroupUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.addAdminGroup = function(name){
    return $http({
        method: 'POST',
        url:adminGroupUrl,
        data: { name: name },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findAdminGroup = function(_id){
    var url = adminGroupUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateAdminGroup = function(_id, data){
    var url = adminGroupUrl + '/' + _id;
    return $http({
        method: 'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.saveAdminGroupPermissions = function(_id, data){
    var url = adminGroupUrl + '/' + _id + '/permissions';
    return $http({
        method: 'PUT',
        url:url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteAdminGroup = function(_id){
    var url = adminGroupUrl + '/' + _id;
    return $http({
        method:'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- usersessions api -----
  resource.findUserSessions = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method:'GET',
        url:adminUserSessionsUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.findUserSession = function(_id){
    var url = adminUserSessionsUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.invalidateUserSession = function(_id){
    var url = adminUserSessionsUrl + '/' + _id + '/invalidate';
    return $http({
        method:'PUT',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- activities history api -----
  resource.findActivitiesHistory = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method:'GET',
        url:adminActivitiesUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.addActivityHistory = function(data){
    return $http({
        method:'POST',
        url:adminActivitiesUrl,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findActivityHistory = function(_id){
    var url = adminActivitiesUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateActivityHistory = function(_id, data){
    var url = adminActivitiesUrl + '/' + _id;
    return $http({
        method:'PUT',
        url:url,
        data:data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteActivityHistory = function(_id){
    var url = adminActivitiesUrl + '/' + _id;
    return $http({
        method: 'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };

  // ----- account-groups api -----
  resource.findAccountGroups = function(filters){
    if(angular.equals({}, filters)){
      filters = undefined;
    }
    return $http({
        method:'GET',
        url:accountGroupUrl,
        params: filters,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.addAccountGroup = function(name){
    return $http({
        method:'POST',
        url: accountGroupUrl,
        data: { name: name },
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processResponse);
  };
  resource.findAccountGroup = function(_id){
    var url = accountGroupUrl + '/' + _id;
    return $http({
        method:'GET',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.updateAccountGroup = function(_id, data){
    var url = accountGroupUrl + '/' + _id;
    return $http({
        method:'PUT',
        url:url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.saveAccountGroupPermissions = function(_id, data){
    var url = accountGroupUrl + '/' + _id + '/permissions';
    return $http({
        method:'PUT',
        url: url,
        data: data,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };
  resource.deleteAccountGroup = function(_id){
    var url = accountGroupUrl + '/' + _id;
    return $http({
        method: 'DELETE',
        url:url,
        headers: {Authorization: $sessionStorage.sessionToken ? 'Bearer ' + $sessionStorage.sessionToken : undefined }
    }).then(processResponse, processError);
  };


  return resource;
}]);
