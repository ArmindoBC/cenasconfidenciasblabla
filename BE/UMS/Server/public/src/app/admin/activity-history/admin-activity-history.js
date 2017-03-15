angular.module('admin.activities-history.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'ui.bootstrap']);
angular.module('admin.activities-history.detail').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/admin/activities-history/:id', {
      templateUrl: 'admin/activity-history/admin-activity-history.tpl.html',
      controller: 'AdminActivitiesHistoryDetailCtrl',
      title: 'User Sessions / Details',
      resolve: {
        activityHistory: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
          //get app stats only for admin-user, otherwise redirect to /account
          var redirectUrl;
          var promise = securityAuthorization.requireAdminUser()
            .then(function(){
              var id = $route.current.params.id || '';
              if(id){
                return adminResource.findActivityHistory(id);
              }else{
                redirectUrl = '/admin/activities-history';
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
angular.module('admin.activities-history.detail').controller('AdminActivitiesHistoryDetailCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'activityHistory',
  function($scope, $route, $location, $log, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
      $scope.activityHistory = data;
    };
    var closeAlert = function(alert, ind){
      alert.splice(ind, 1);
    };
    //$scope vars
    $scope.detailAlerts = [];
    $scope.deleteAlerts = [];
    $scope.canSave = utility.canSave;
    $scope.hasError = utility.hasError;
    $scope.showError = utility.showError;
    $scope.closeDetailAlert = function(ind){
      closeAlert($scope.detailAlerts, ind);
    };
    $scope.closeDeleteAlert = function(ind){
      closeAlert($scope.deleteAlerts, ind);
    };

    $scope.deleteActivityHistory = function(){
      $scope.deleteAlerts =[];
      if(confirm('Are you sure?')){
        adminResource.deleteActivityHistory($scope.activityHistory._id).then(function(result){
          if(result.success){
            //redirect to admin admin-groups index page
            $location.path('/admin/activities-history');
          }else{
            //error due to server side validation
            angular.forEach(result.errors, function(err, index){
              $scope.deleteAlerts.push({ type: 'danger', msg: err});
            });
          }
        }, function(x){
          $scope.deleteAlerts.push({ type: 'danger', msg: 'Error deleting history activity: ' + x });
        });
      }
    };

    //initialize
    deserializeData(data);
  }
]);
