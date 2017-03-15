/**
 * Created by arcarvalho on 23-05-2016.
 */
app.directive('availableDates',["$location", "$sessionStorage","UserService",  function ($location, $sessionStorage, UserService) {
    return {
        restrict: 'EA', //E = element, A = attribute, C = class, M = comment
        scope: {
            collapsed: '@collapsed',
            color: '@color', //makes the background of the bar colored or not
            welcome: '@welcome', // the navbar for the welcome page, it's different from the other pages
            hidebar: '@hidebar' // makes the navbar hidden on the top
        },
        templateUrl: 'app/views/directives/available-dates.html',
        link: function ($scope, element, attrs) {
    
        }
    }
}]);