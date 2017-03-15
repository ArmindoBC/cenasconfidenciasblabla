/*
    Formats correctly the data introduced regarding the car plate
*/
app.directive("carPlate", function(Configs) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            element.bind("change keydown keyup", function(e) {
                //dont apply if backspace
                if(e.keyCode != 8){
                    if(element[0].value.match(/^[A-Za-z0-9]{2}$/)){
                        element[0].value += '-';
                    }
                    else if(element[0].value.match(/^[A-Za-z0-9]{2}-[A-Za-z0-9]{2}$/)){
                        element[0].value += '-';
                    }
                }
            });
        }
    };
});
