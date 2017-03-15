angular.module('admin.account-groups.index', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource']);
angular.module('admin.account-groups.index').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/account-groups', {
      templateUrl: 'admin/account-groups/account-groups.tpl.html',
      controller: 'AccountGroupsIndexCtrl',
      title: 'Manage Account Groups',
      resolve: {
        groups: ['$q', '$location', '$log', 'securityAuthorization', 'adminResource', function($q, $location, $log, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              //handles url with query(search) parameter
              return adminResource.findAccountGroups($location.search());
            }, function(reason){
              //rejected either user is un-authorized or un-authenticated
              redirectUrl = reason === 'unauthorized-client'? '/account': '/login';
              return $q.reject();
            })
            .catch(function(){
              redirectUrl = redirectUrl || '/account';
              $location.search({});
              $location.path(redirectUrl);
              return $q.reject();
            });
          return promise;
        }]
      },
      reloadOnSearch: false
    });
}]);
angular.module('admin.account-groups.index').controller('AccountGroupsIndexCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'groups',
  function($scope, $route, $location, $log, utility, adminResource, data){
    // local var
    var deserializeData = function(data){
      $scope.items = data.items;
      $scope.pages = data.pages;
      $scope.filters = data.filters;
      $scope.groups = data.data;
    };

    var fetchAccountGroups = function(){
      adminResource.findAccountGroups($scope.filters).then(function(data){
        deserializeData(data);

        //update url in browser addr bar
        $location.search($scope.filters);
      }, function(e){
        $log.error(e);
      });
    };

    // $scope methods
    $scope.canSave = utility.canSave;
    $scope.filtersUpdated = function(){
      //reset pagination after filter(s) is updated
      $scope.filters.page = undefined;
      fetchAccountGroups();
    };
    $scope.prev = function(){
      $scope.filters.page = $scope.pages.prev;
      fetchAccountGroups();
    };
    $scope.next = function(){
      $scope.filters.page = $scope.pages.next;
      fetchAccountGroups();
    };
    $scope.addGroup = function(){
      adminResource.addAccountGroup($scope.groupname).then(function(data){
        $scope.groupname = '';
        if(data.success){
          $route.reload();
        }else if (data.errors && data.errors.length > 0){
          alert(data.errors[0]);
        }else {
          alert('unknown error.');
        }
      }, function(e){
        $scope.groupname = '';
        $log.error(e);
      });
    };

    // $scope vars
    //select elements and their associating options
    $scope.sorts = [
      {label: "id \u25B2", value: "_id"},
      {label: "id \u25BC", value: "-_id"},
      {label: "name \u25B2", value: "name"},
      {label: "name \u25BC", value: "-name"}
    ];
    $scope.limits = [
      {label: "10 items", value: 10},
      {label: "20 items", value: 20},
      {label: "50 items", value: 50},
      {label: "100 items", value: 100}
    ];

    //initialize $scope variables
    deserializeData(data);
  }
]);
