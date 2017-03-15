/*
    Controller responsible for the tasks related with authentication
    All controller mehtods necessary to perform login and sign up are implemented here
*/
app.controller('LoginController', ["$scope",'$http','$location',"UserService", function($scope, $http,$location, UserService) {
    $scope.currentUser = undefined;

    //where data from signup process are stored
    $scope.newUser = {};

    //where data from login process are stored
    $scope.loginUser = {};

    //session remember condition
    $scope.rememberChecked = false;

    //signup conditions accepted.
    $scope.conditionsAccepted = false;


    //it does social authentication with providers like facebook, google and linkedin
    $scope.socialLogin = function(provider) {

        return UserService.SocialLogin(provider, true)
        .then(function(){
            if($scope.quoteContext){
                history.back();
            }
            else{
                $location.path('/overview');
            }
            $scope.$apply();
        })
        .catch(function(err) {
            console.error(err);
            //alert(err.message);
        });
    };

    //it provides signup feature.
    //it checks if conditions are accepted, and then it calls user service in order to create a new user account
    $scope.submitSignupForm = function() {

        if(!$scope.conditionsAccepted){
            alert("You must accept the terms of services");
            return;
            }
            else{
                return UserService.Signup($scope.newUser, true)
                .then(function(){
                    if($scope.quoteContext){
                        history.back();
                    }
                    else{
                        $location.path('/overview');
                    }
                    $scope.$apply();
                })
                .catch(function(err){
                    console.error(err);
                    if(err[0].value.errors){
                        var message = err[0].value.errors.join(',');
                    }
                    if(err[0].value.errfor){
                        message = JSON.stringify(err[0].value.errfor);
                    }
                    if(message){
                        alert(message);
                    }
                    else{
                        alert(err.message || "Error in signup. Please contact your system administrator ");
                    }

                });
            }
        };

        //it provides login feature.
        //it calls user service in order to create a new user session
        $scope.submitLoginForm = function() {
            return UserService.Login($scope.loginUser, $scope.rememberChecked)
            .then(function(){
                if($scope.quoteContext){
                    history.back();
                }
                else{
                    $location.path('/overview');
                }
                $scope.$apply();
            })
            .catch(function(err) {
                console.error(err);
                if(err[0].value.errors){
                    var message = err[0].value.errors.join(',');
                }
                if(err[0].value.errfor){
                    message = JSON.stringify(err[0].value.errfor);
                }
                alert(message || "Error in login. Please contact your system administrator ");
            });
        };

        $scope.replaceScreen = function(url){
            if($scope.quoteContext){
                $location.url(url + '?quote=true').replace();
            }
            else{
                $location.url(url).replace();
            }
        }

        $scope.init = function(){
            $scope.quoteContext = $location.search().quote==='true' ? true : false;
        }

        $scope.init();
    }]);
