angular.module('admin.accounts.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'directives.serverError', 'ui.bootstrap']);
angular.module('admin.accounts.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/accounts/:id', {
      templateUrl: 'admin/accounts/admin-account.tpl.html',
      controller: 'AccountsDetailCtrl',
      title: 'Accounts / Details',
      resolve: {
        account: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findAccount(id);
              }else{
                redirectUrl = '/admin/accounts';
                return $q.reject();
              }
            }, function(reason){
              //rejected either user is un-authorized or un-authenticated
              redirectUrl = reason === 'unauthorized-client'? '/account': '/login';
              return $q.reject();
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/account';
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise;
        }]
      }
    });
}]);
angular.module('admin.accounts.detail').controller('AccountsDetailCtrl', ['$scope', '$route', '$location', 'utility', 'adminResource', 'account',
  function($scope, $route, $location, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
      $scope.groups = data.accountGroups;
      deserializeAccount(data.record);
    };
    var deserializeAccount = function(account){
      $scope.account = account;
    };
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };
    var isExistingGroup = function(selectedGroup){
      var flag = false;
      var groups = $scope.account.groups;
      angular.forEach(groups, function(group, ind){
        if(group._id === selectedGroup._id){
          flag = true;
        }
      });
      return flag;
    };
    // $scope vars
    $scope.contactAlerts = [];
    $scope.loginAlerts = [];
    $scope.deleteAlerts = [];
    $scope.canSave = utility.canSave;
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.closeContactAlert = function(ind){
      closeAlert($scope.contactAlerts, ind);
    };
    $scope.closeLoginAlert = function(ind){
      closeAlert($scope.loginAlerts, ind);
    };
    $scope.closeDeleteAlert = function(ind){
      closeAlert($scope.deleteAlerts, ind);
    };
    $scope.formatTime = function(timestamp, replace){
      var res = moment(timestamp).from();
      return replace? res.replace('ago', replace): res;
    };
    $scope.updateAccount = function(){
      var data = {
        first:   $scope.account.name.first,
        middle:  $scope.account.name.middle,
        last:    $scope.account.name.last,
        company: $scope.account.company,
        phone:   $scope.account.phone,
        zip:     $scope.account.zip
      };
      $scope.contactAlerts = [];
      adminResource.updateAccount($scope.account._id, data).then(function(result){
        if(result.success){
          deserializeAccount(result.account);
          $scope.contactAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
        }else{
          angular.forEach(result.errors, function(err, index){
            $scope.contactAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function(x){
        $scope.contactAlerts.push({ type: 'danger', msg: 'Error updating account: ' + x });
      });
    };
    $scope.linkUser = function () {
      $scope.loginAlerts = [];
      var newUsername = $scope.account.newUsername;
      $scope.account.newUsername = '';
      adminResource.linkUser($scope.account._id, { newUsername: newUsername }).then(function (result) {
        $scope.loginForm.$setPristine();
        if (result.success) {
          deserializeAccount(result.account);
        } else {
          angular.forEach(result.errors, function (err, index) {
            $scope.loginAlerts.push({ type: 'danger', msg: err });
          });
        }
      }, function (x) {
        $scope.loginAlerts.push({ type: 'danger', msg: 'Error linking user: ' + x });
      });
    };
    $scope.unlinkUser = function () {
      $scope.loginAlerts = [];
      if (confirm('Are you sure?')) {
        adminResource.unlinkUser($scope.account._id).then(function (result) {
          if (result.success) {
            deserializeAccount(result.account);
          } else {
            angular.forEach(result.errors, function (err, index) {
              $scope.loginAlerts.push({type: 'danger', msg: err});
            });
          }
        }, function (x) {
          $scope.loginAlerts.push({ type: 'danger', msg: 'Error unlinking user: ' + x });
        });
      }
    };
    $scope.deleteAccount = function(){

      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteAccount($scope.account._id).then(function(result){
          if(result.success){
            // redirect to admin users index page
            $location.path('/admin/accounts');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting account: ' + x });
        });
      }
  };
    $scope.addGroup = function(){
      if(!$scope.selectedNewGroup){
        alert('Please select a group.');
      } else if(isExistingGroup($scope.selectedNewGroup)){
        alert('That group already exists.');
      }else{
        $scope.account.groups.push(angular.copy($scope.selectedNewGroup));
      }
      $scope.selectedNewGroup = null;  //reset selectedGroup after user interaction
    };
    $scope.deleteGroup = function(index){
      if(confirm('Are you sure?')){
        $scope.account.groups.splice(index, 1);
      }
    };
    $scope.saveGroups = function(){
      $scope.groupAlerts = [];
      var groups = $scope.account.groups;
      adminResource.saveAccountGroups($scope.account._id, {groups: groups}).then(function (result) {
        if (result.success) {
          $scope.groupAlerts.push({type: 'info', msg: 'Changes have been saved.'});
          deserializeAccount(result.account);
        } else {
          //error due to server side validation
          angular.forEach(result.errors, function (err, index) {
            $scope.groupAlerts.push({type: 'danger', msg: err});
          });
        }
      }, function (x) {
        $scope.groupAlerts.push({type: 'danger', msg: 'Error saving account groups: ' + x});
      });
    };
    //initialize
    deserializeData(data);
  }
]);
