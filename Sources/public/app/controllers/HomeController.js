"use strict";
app.controller('HomeController', ["$scope","$location", "$rootScope", "$anchorScroll","QuoteInfoRepository", function($scope,$location, $anchorScroll, $rootScope,QuoteInfoRepository) {
  var logClient = new LogClient(); //jshint ignore:line
  logClient.SendLog({
    level: 'TRACE',
    category: "information",
    message: "HomeController started"
  });

  /*
    Initialize Home controller, if location has has for the sections, fullpage plugin moves page to the proper section
  */
  $scope.Init = function() {
      if($location.hash() === 'welcome'){
          $.fn.fullpage.moveTo(1);
      }
      else if($location.hash() === 'user_info'){
          $.fn.fullpage.moveTo(2);
      }
      else{
          $("body").scrollTop(0);
      }

  };
  $scope.currency = $rootScope.currency;
  $scope.Init();
}]);
