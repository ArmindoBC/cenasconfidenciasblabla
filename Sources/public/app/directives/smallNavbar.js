/**
 *
 * Navbar directive: this renders the navbar and accepts parameters to get the different navbars across the project
 *
 */


app.directive('smallNavbar',["$location", "$sessionStorage","UserService",  function ($location, $sessionStorage, UserService) {
   return {
       restrict: 'EA', //E = element, A = attribute, C = class, M = comment
       scope: {
         collapsed: '@collapsed',
           color: '@color', //makes the background of the bar colored or not
           welcome: '@welcome', // the navbar for the welcome page, it's different from the other pages
           hidebar: '@hidebar' // makes the navbar hidden on the top
         },
       templateUrl: 'app/views/directives/smallNavbar.html',
       link: function ($scope, element, attrs) {
           $scope.GoTo = function(url){
               $location.url(url);
           }

           $scope.openedDropdown = false;

           $scope.OpenDropdown = function(event){
               $scope.openedDropdown = true;

               var DropdownWidth = $("#menubarDropdown").width();
               var UserIconOffset = $("#userData").offset();
               var IconWidth = $("#userData").width();
               var IconEndPosition = UserIconOffset.left + IconWidth;
               $("#menubarDropdown").css({
                 left: IconEndPosition - DropdownWidth - 7 // (IconWidth / 2) - DropdownWidth + 35
               }).fadeIn(150);
               $("#MenuBarUserButton").addClass("MenuBarUserButtonSelected");

           }
           $scope.CloseDropdown = function(){
               $scope.openedDropdown = false;
           }
           $scope.Logout = function(){
               $scope.openedDropdown = false;
               $scope.userData = undefined;

               return UserService.Logout()
               .then(function(){
                   $location.path('/');
                   $scope.$applyAsync();
               });


           }
           $scope.UserService = UserService;
       }
   }
}]);
