/*
* This directive is used to focus and bind the currency symbol to the inputs
*/
app.directive("currency", ["Configs","$timeout", function(Configs, $timeout) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {

            $timeout(function () {
                if( element[0].value && element[0].value != "" ){
                    element[0].value = Configs.currency +' ' + element[0].value;
                }
            });
            element.bind("focus", function() {
                element[0].value = ngModel.$viewValue;
            });
            element.bind("blur", function(e) {
                if( element[0].value && element[0].value != "" ){
                    element[0].value = Configs.currency +' ' + element[0].value;
                }
            });
            scope.$watch(attrs.ngModel, function (v) {
                if(element[0].disabled){
                    if( element[0].value && element[0].value != "" ){
                        element[0].value = Configs.currency +' ' + element[0].value;
                    }
                }
            });
        }
    };
}]);
