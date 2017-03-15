/*
* Directive to build the footer
*/
app.directive('footer', function () {
   return {
       restrict: 'EA', //E = element, A = attribute, C = class, M = comment
       templateUrl: 'app/views/directives/footer.html',
       link: function ($scope, element, attrs) { } //DOM manipulation
   }
});
