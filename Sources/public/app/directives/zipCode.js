/*
    Formats correctly the data introduced regarding the birth date
*/
app.directive("zipCode", function(Configs) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            element.bind("change keydown keyup", function(e) {
                //dont apply if backspace
                if(e.keyCode != 8){
                    if(element[0].value.match(/^[0-9]{4}$/)){
                        element[0].value += '-';
                    }
                }
            });
        }
    };
});
