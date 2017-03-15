angular.module('admin.activities-history.index', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource']);
angular.module('admin.activities-history.index').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/activities-history', {
      templateUrl: 'admin/activity-history/admin-activities-history.tpl.html',
      controller: 'ActivitiesHistoryIndexCtrl',
      title: 'Manage User Sessions',
      resolve: {
        activitiesHistory: ['$q', '$location', '$log', 'securityAuthorization', 'adminResource', function($q, $location, $log, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              //handles url with query(search) parameter
              return adminResource.findActivitiesHistory($location.search());
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
angular.module('admin.activities-history.index').controller('ActivitiesHistoryIndexCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'activitiesHistory',
  function($scope, $route, $location, $log, utility, adminResource, data){
    // local var
    var deserializeData = function(data){
      $scope.items = data.items;
      $scope.pages = data.pages;
      $scope.filters = data.filters;
      $scope.activitiesHistory = data.data;
    };

    var fetchActivitiesHistory = function(){
      adminResource.findActivitiesHistory($scope.filters).then(function(data){
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
      fetchActivitiesHistory();
    };
    $scope.prev = function(){
      $scope.filters.page = $scope.pages.prev;
      fetchActivitiesHistory();
    };
    $scope.next = function(){
      $scope.filters.page = $scope.pages.next;
      fetchActivitiesHistory();
    };
    $scope.addActivityHistory = function(){
      adminResource.addActivityHistory($scope.add).then(function(data){
        $scope.add = {};
        if(data.success){
          $route.reload();
        }else if (data.errors && data.errors.length > 0){
          alert(data.errors[0]);
        }else {
          alert('unknown error.');
        }
      }, function(e){
        $scope.add = {};
        $log.error(e);
      });
    };

    // $scope vars
    //select elements and their associating options
    $scope.sorts = [
      {label: "timestamp \u25B2", value: "timestamp"},
      {label: "timestamp \u25BC", value: "-timestamp"},
      {label: "category \u25B2", value: "category"},
      {label: "category \u25BC", value: "-category"},
      {label: "message \u25B2", value: "message"},
      {label: "message \u25BC", value: "-message"}
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
