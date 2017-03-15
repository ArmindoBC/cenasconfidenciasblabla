/**
*
* Navbar directive: this renders the navbar and accepts parameters to get the different navbars across the project
*
*/


app.directive('dashboardContainer', function ($location, UserService, PolicyRepository) {
    return {
        restrict: 'E', //E = element, A = attribute, C = class, M = comment
        templateUrl: 'app/views/directives/dashboardContainer.html',
        transclude: true,
        scope: {
            //@ reads the attribute value, = provides two-way binding, & works with functions
            optionSelected: '@',
        },
        link: function ($scope, element, attrs) {
            $scope.UserService = UserService;

            $scope.UserService = UserService;
            //load profile photo from social networks
            $scope.userImage = UserService.ProfileImage();
            $scope.GoTo = function(path){
                $location.path(path);
            }
            $scope.CheckPoliciesAndGoTo  = function(path){
                if($scope.numberPolicies > 0){
                    $location.path(path);
                }

            }
            $scope.init =  function(){
                return PolicyRepository.GetPolicyList(UserService.SessionToken,{userId: UserService.CurrentUser.id, state: 'policy'})
                .then(function(policies){
                    $scope.numberPolicies = policies.length;
                    $scope.$apply();

                })
                .catch(function(err){
                    console.error(err);
                    $scope.numberPolicies = 0;
                    $scope.$apply();
                });
            }

            $scope.init();
        } //DOM manipulation
    }
});
