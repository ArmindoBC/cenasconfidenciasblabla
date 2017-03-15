angular.module('admin.usersessions.detail', ['ngRoute', 'security.authorization', 'services.utility', 'services.adminResource', 'ui.bootstrap']);
angular.module('admin.usersessions.detail').config(['$routeProvider', function($routeProvider){
    $routeProvider
    .when('/admin/usersessions/:id', {
        templateUrl: 'admin/usersessions/admin-usersession.tpl.html',
        controller: 'AdminUserSessionsDetailCtrl',
        title: 'User Sessions / Details',
        resolve: {
            usersession: ['$q', '$route', '$location', 'securityAuthorization', 'adminResource', function($q, $route, $location, securityAuthorization, adminResource){
                //get app stats only for admin-user, otherwise redirect to /account
                var redirectUrl;
                var promise = securityAuthorization.requireAdminUser()
                .then(function(){
                    var id = $route.current.params.id || '';
                    if(id){
                        return adminResource.findUserSession(id);
                    }else{
                        redirectUrl = '/admin/usersessions';
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
angular.module('admin.usersessions.detail').controller('AdminUserSessionsDetailCtrl', ['$scope', '$route', '$location', '$log', 'utility', 'adminResource', 'usersession',
function($scope, $route, $location, $log, utility, adminResource, data) {
    // local vars
    var deserializeData = function(data){
        $scope.usersession = data;
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
    $scope.invalidateUserSession = function(){
        $scope.detailAlerts = [];
        
        if(confirm('Are you sure?')){
            adminResource.invalidateUserSession($scope.usersession._id).then(function(result){
                if(result.success){
                    deserializeData(result.usersession);
                    $scope.detailAlerts.push({ type: 'info', msg: 'Changes have been saved.'});
                }else{
                    angular.forEach(result.errors, function(err, index){
                        $scope.detailAlerts.push({ type: 'danger', msg: err });
                    });
                }
            }, function(x){
                $scope.detailAlerts.push({ type: 'danger', msg: 'Error updating usersession: ' + x });
            });
        }
    };

    //initialize
    deserializeData(data);
}
]);
