"use strict";
/*
Angular controller for profile screen,
It has all the necessary methods to ensure system management
*/
app.controller('ProfileController', ["$scope","UserService","UserRepository", function($scope, UserService, UserRepository) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "ProfileController started"
    });
    //current user
    $scope.user = undefined;

    //it stores user profile input errors
    $scope.inputErrors = {
        fullName : undefined,
        email : undefined,
        address : undefined,
        birthDate : undefined,
        phone : undefined,
        nif: undefined
    }

    //with this property set to true it is possible to update user data
    $scope.editModeEnabled = false;

    //it cancel all data changes restoring with the data originaly stored in user
    $scope.Cancel = function(){
        $scope.editModeEnabled = false;
        //Clear input errors
        $scope.inputErrors = {};
        $scope.Init();
    };

    //it tests an email string in order to validate if it is an email or not
    $scope.ValidateEmail = function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    //it validates the user data inserted by user
    $scope.ValidateUserData = function(field){
        if(field){
            $scope.inputErrors[field] = undefined;
        }
        var validData = true;

        if(field === "fullName" || !field){
            if(!$scope.user.fullName){
                $scope.inputErrors.fullName = "Name is required";
                validData = false;
            }
            else if($scope.user.fullName.trim() === ''){
                $scope.inputErrors.fullName = "Name value cannot be empty";
                validData = false;
            }
            else if(!$scope.user.fullName.match(/^[A-Za-z_  \u00C0-\u017F\u00AA\u00BA]+$/)){
                $scope.inputErrors.fullName = "Invalid name value";
                validData = false;
            }
        }

        if(field === "email" || !field){
            if(!$scope.user.email){
                $scope.inputErrors.email = "Email is required";
                validData = false;
            }
            else if($scope.user.email.trim() === ''){
                $scope.inputErrors.email = "Email value cannot be empty";
                validData = false;
            }
            else if(!$scope.ValidateEmail($scope.user.email)){
                $scope.inputErrors.email = "Invalid email format";
                validData = false;
            }
        }

        if(field === "address" || !field){
            if( $scope.user.address.trim() != '' && !$scope.user.address.match(/^[A-Za-z_  \u00C0-\u017F\u002d\u00AA\u00BA\u002C\u0030-\u0039\u002E]+$/)){
                $scope.inputErrors.address = "Your address must only contain letters (a-z,A-Z), spaces, numbers, commas and full stops and hiffen.";
                validData = false;
            }
        }

        if(field === "birthDate" || !field){
            if(!$scope.user.birthDate){
                $scope.inputErrors.birthDate = "Birth Date is required";
                validData = false;
            }
            else if($scope.user.birthDate.trim() === ''){
                $scope.inputErrors.birthDate = "Birth Date value cannot be empty";
                validData = false;
            } else if(parseInt($scope.user.birthDate.split('-')[2]) > new Date().getFullYear()-18){
                $scope.inputErrors.birthDate = "You should be, at least, 18 years old";
                validData = false;
            } else if(parseInt($scope.user.birthDate.split('-')[2]) === new Date().getFullYear()-18){
                if(parseInt($scope.user.birthDate.split('-')[1]) > (new Date().getMonth() + 1)){
                    $scope.inputErrors.birthDate = "You should be, at least, 18 years old";
                    validData = false;
                } else if(parseInt($scope.user.birthDate.split('-')[0]) > new Date().getDate()){
                    console.log(new Date().getDate());
                    $scope.inputErrors.birthDate = "You should be, at least, 18 years old";
                    validData = false;
                }
            } else if(parseInt($scope.user.birthDate.split('-')[2]) < new Date().getFullYear()-100){
                $scope.inputErrors.birthDate = "You can't be 100 or more years old";
                validData = false;
            }
        }
        if(field === "phone" || !field){
            if( $scope.user.phone.trim() != '' && !$scope.user.phone.match(/^\+?\d+$/)) {
                $scope.inputErrors.phone = "Phone number value must only contain digits and + symbol";
                validData = false;
            }
        }
        if(field === "nif" || !field){
            if($scope.user.nif.trim() != '' && !$scope.user.nif.match(/^\d+$/)) {
                //Ensure the field is only composed by numbers
                $scope.inputErrors.nif = "NIF value must only contain digits";
                validData = false;
            }

            //Validate NIF according to Portugal law
            var c;
            var checkDigit = 0;
            if($scope.user.nif != null && $scope.user.nif.length == 9){
                c = $scope.user.nif.charAt(0);
                if(c == '1' || c == '2' || c == '5' || c == '6' || c == '8' || c == '9'){
                    checkDigit = c * 9;
                    for(var i = 2; i <= 8; i++){
                        checkDigit += $scope.user.nif.charAt(i-1) * (10-i);
                    }
                    checkDigit = 11 - (checkDigit % 11);
                    if(checkDigit >= 10){
                        checkDigit = 0;
                    }
                    if(checkDigit != $scope.user.nif.charAt(8)){
                        validData = false;
                        $scope.inputErrors.nif = "Invalid NIF";
                    }
                }
            }
        }
        return validData;
    };

    //it updates the user entity
    $scope.UpdateUser = function(){
        if($scope.ValidateUserData()){
            var newUserData = {
                id : UserService.CurrentUser.id,
                fullName : $scope.user.fullName,
                email : $scope.user.email,
                address : $scope.user.address,
                birthDate : $scope.user.birthDate,
                phone : $scope.user.phone,
                nif : $scope.user.nif

            }
            return UserRepository.UpdateUser(UserService.SessionToken, newUserData)
            .then(function(userData){
                var newUserData = angular.extend({}, UserService.CurrentUser, userData);
                UserService.SetCurrentUser(newUserData);
                $scope.AddFeedbackMessage({
                    title: "Profile Updated Successfuly",
                });

                $scope.editModeEnabled = false;
                $scope.$apply();
                return;
            })
            .catch(function(err){
                console.error(err);
                $scope.AddFeedbackMessage({
                    title: "Error Updating Profile",
                });
                $scope.editModeEnabled = false;
                $scope.$apply();
                $scope.Init();
            })
        }

    };

    //it enables the edit mode for profile data
    $scope.EnableEditMode = function(){
        $scope.editModeEnabled = true;
    }

    //initialize profile controller.
    //it gathers alldata about the user logged in
    $scope.Init = function(){
        $scope.user = {
            fullName : UserService.FullName(),
            email : UserService.CurrentUser.email,
            address : UserService.CurrentUser.address,
            birthDate : UserService.CurrentUser.birthDate,
            phone : UserService.CurrentUser.phone,
            nif : UserService.CurrentUser.nif
        }
    };

    $scope.Init();

}]);
