/*
*   Directive to build each one of the insurance choice parts
    It receives a type, the item, the index and a parameter if the is a modification
    of a existing item or the insertion of a new element
*/

app.directive('insuranceChoicePart', function () {
   return {
       restrict: 'EA', //E = element, A = attribute, C = class, M = comment
       scope: {
           //@ reads the attribute value, = provides two-way binding, & works with functions
           type: '@', //type of the insurance choice item, vehicles, persons or properties
           part: '=part', //the item
           index: '=index', //the index of the content on the list of items
           new: '=' //new item or modifying an existing item
         },
       templateUrl: 'app/views/directives/insuranceChoicePart.html',
       link: function ($scope, element, attrs) {
           //bind scope methods to parent controller methods in order to enable access it
           $scope.addChoice = $scope.$parent.addChoice;
           $scope.errors = $scope.$parent.errors;
           $scope.ValidateChoiceForm = $scope.$parent.ValidateChoiceForm;
           $scope.RemoveItem = $scope.$parent.RemoveItem;
           $scope.CancelNewItem = $scope.$parent.CancelNewItem;
           $scope.ToogleEditItem = $scope.$parent.ToogleEditItem;
       }
   };
});
