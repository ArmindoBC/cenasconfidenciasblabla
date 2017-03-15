"use strict";
app.controller('AppController', ["$scope", "WindowService","Configs","$location", function($scope, WindowService,Configs,$location) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "AppController started"
    });

    //Loads the configuration currency
    $scope.configs = Configs;

    //Feedback Message Modal configuration, this will allow the show and hide of the modal message displayed
    $scope.FeedbackMessageModalConfigure = function(){

        $('#feedbackMessageModal').on('hidden.bs.modal', function (e) {
            $scope.feedbackMessage = undefined;
        })
    }
    $scope.AddFeedbackMessage = function(message){
        $scope.feedbackMessage = message;
        $('#feedbackMessageModal').modal('show');
    }
    $scope.GoTo = function(link){
        if(link){
            $location.url(link);
        }
        $('.modal').modal('hide');
    }
    $scope.Init = function() {
        $scope.FeedbackMessageModalConfigure();
    };
    $scope.Init();

    $scope.ClaimManagementModal  = function()
    {
        $('#ClaimManagementModal').modal('show');
    }
    
}]);
