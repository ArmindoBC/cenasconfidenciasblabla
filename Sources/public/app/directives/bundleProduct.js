/*
* This directive is used to render the bundle products
*/


app.directive('bundleProduct', function () {
   return {
       restrict: 'EA', //E = element, A = attribute, C = class, M = comment
       scope: {
           //@ reads the attribute value, = provides two-way binding, & works with functions
           title: '@',
           product: '=product',
         },
       templateUrl: 'app/views/directives/bundleProduct.html',
       link: function ($scope, element, attrs) {

           $scope.ToggleCoverageSelection = $scope.$parent.ToggleCoverageSelection;
           $scope.DisabledPackage = $scope.$parent.DisabledPackage;
           $scope.SelectedCoverage = $scope.$parent.SelectedCoverage;
           $scope.selectedCoverages = $scope.$parent.selectedCoverages;

           $scope.basicFilter = function (product) {
               return product.type === 'basic';
           };
           $scope.recommendedFilter = function (product) {
               return product.type === 'recommended';
           };
           $scope.premiumFilter = function (product) {
               return product.type === 'premium';
           };
       } //DOM manipulation
   }
});
