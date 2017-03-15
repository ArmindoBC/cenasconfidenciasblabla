"use strict";
/*
    Angular controller for admin screen,
    It has all the necessary methods to ensure system management
*/
app.controller('AdminController', ["$scope","UserService","UserRepository","NotificationRepository", function($scope, UserService, UserRepository, NotificationRepository) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "AdminController started"
    });
    $scope.users =[];
    $scope.notificationData = {};

    //it saves , "sends",  a new notitication for a specific user
    $scope.SaveNotification = function(){
        return NotificationRepository.SaveNotification(UserService.SessionToken, $scope.notificationData)
        .then(function(notification){
            $scope.notificationData = {};
            $scope.AddFeedbackMessage({
                title: "Notification Successfuly Sent",
            });
            $scope.$apply();
            return;
        })
        .catch(function(error){
            console.log(error);
            $scope.AddFeedbackMessage({
                title: "Error Sending Notification",
            });
            $scope.$apply();
        });
    };

    //initialize admin controller.
    //it gathers all necessary data for the admin context
    $scope.Init = function(){
        return UserRepository.GetUserList(UserService.SessionToken)
        .then(function(users){
            $scope.users = users;
            $scope.$apply();
        });
    };

    $scope.Init();

}]);
