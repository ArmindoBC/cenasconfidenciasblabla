/*
    Directive to build a paginator
    it can receive next and previous links
*/

app.directive('paginator',["$location", function ($location) {
   return {
       restrict: 'EA', //E = element, A = attribute, C = class, M = comment
       scope: {
           //@ reads the attribute value, = provides two-way binding, & works with functions
           next: '=next',
           previous: '=previous'
         },
       templateUrl: 'app/views/directives/paginator.html',
       link: function ($scope, element, attrs) {
           //if next or previous links are empty they are assigned to undefined
           if($scope.next == ''){
               $scope.next = undefined;
           }
           if($scope.previous == ''){
               $scope.previous = undefined;
           }
           $scope.GoTo = function(path){
               $location.url(path);
           }
        }
   }
}]);
