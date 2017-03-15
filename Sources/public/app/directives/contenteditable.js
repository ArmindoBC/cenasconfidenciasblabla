//directive to edit content inline
app.directive("contenteditable",[ "Configs", function(Configs) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            var placeholder = attrs.placeholder || "";

            //reads value
            function read() {
                var html = element.html();
                html = html.replace(/&nbsp;/g, "");
                if(html.trim() === ""){
                    element.html("&nbsp;");
                    ngModel.$setViewValue(undefined);

                }
                else{
                    ngModel.$setViewValue(html);
                }

            }

            //render model value on view
            ngModel.$render = function() {
                //if currency-editable attribute it prepends currency symbol on view
                if(attrs.currencyEditable != undefined  &&  ngModel.$viewValue){
                    element.html(Configs.currency + " " + ngModel.$viewValue);
                }
                else{
                    element.html(ngModel.$viewValue || placeholder);
                }
            };

            //prevent enter on content editable elements
            element.keydown(function(e) {
                if(e.keyCode == 13){
                    e.preventDefault();
                }
            });

            //on focus, if no value exists it adds a non content character
            element.bind("focus", function() {
                if(!ngModel.$viewValue){
                    element.html("&nbsp;");
                }
                else{
                    element.html(ngModel.$viewValue);
                }
            });
            //on blur, keyup or change events it reads content and stores it on model variable
            element.bind("blur keyup change", function(e) {
                scope.$apply(read);
                if(e.type === "blur") {
                    //on blur, if no content it shows a placeholder or if currency-editable attribute it appends currency symbol
                    if(!ngModel.$viewValue || ngModel.$viewValue.trim() === ""){
                        ngModel.$viewValue= undefined
                        element.html(placeholder);
                    }
                    else{
                        if(attrs.currencyEditable != undefined){
                            element.html(Configs.currency + " " + ngModel.$viewValue);
                        }
                        ngModel.$viewValue = ngModel.$viewValue.replace(/&nbsp;/g, "");

                    }
                }
            });
        }
    };
}]);
