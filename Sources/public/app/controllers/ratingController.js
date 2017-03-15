/**
 * Created by arcarvalho on 25-05-2016.
 */
app.controller('StarCtrl', ['$scope', function ($scope) {
    $scope.rating = 0;
    $scope.ratings = [{
        current: 5,
        max: 10
    }];

    $scope.getSelectedRating = function (rating) {
        console.log(rating);
    }

    $scope.setMinrate= function(){
        $scope.ratings = [{
            current: 1,
            max: 10
        }];
    }

    $scope.setMaxrate= function(){
        $scope.ratings = [{
            current: 10,
            max: 10
        }];
    }

    $scope.sendRate = function(){
        alert("Thanks for your rates!\n\nFirst Rate: " + $scope.ratings[0].current+"/"+$scope.ratings[0].max
            +"\n"+"Second rate: "+ $scope.ratings[1].current+"/"+$scope.ratings[0].max)
    }
}]);