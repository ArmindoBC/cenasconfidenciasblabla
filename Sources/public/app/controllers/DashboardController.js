/**
 * Created by arcarvalho on 06-07-2016.
 */
app.controller('DashboardController', ["$scope", "$filter", "$location", "PolicyRepository", "UserService", "ChartService","QuoteInfoRepository",
    function($scope, $filter, $location, PolicyRepository, UserService, ChartService, QuoteInfoRepository) {

        $scope.expensesGraph = function () {
            var area = new Morris.Area({
                element: 'revenue-chart',
                resize: true,
                data: [
                    {y: '2011 Q1', item1: 2666, item2: 2666},
                    {y: '2011 Q2', item1: 2778, item2: 2294},
                    {y: '2011 Q3', item1: 4912, item2: 1969},
                    {y: '2011 Q4', item1: 3767, item2: 3597},
                    {y: '2012 Q1', item1: 6810, item2: 1914},
                    {y: '2012 Q2', item1: 5670, item2: 4293},
                    {y: '2012 Q3', item1: 4820, item2: 3795},
                    {y: '2012 Q4', item1: 15073, item2: 5967},
                    {y: '2013 Q1', item1: 10687, item2: 4460},
                    {y: '2013 Q2', item1: 8432, item2: 5713}
                ],
                xkey: 'y',
                ykeys: ['item1', 'item2'],
                labels: ['Item 1', 'Item 2'],
                lineColors: ['rgb(38, 198,218)', 'rgb(69,90,100)'],
                hideHover: 'auto'
            });
        }

        $scope.init = function () {
            $scope.expensesGraph();
            $scope.getPolicyList()
                .then(function (policies) {
                    $scope.policies = policies;
                    $scope.userName = UserService.FirstName();
                    $scope.fullName = UserService.FullName();
                    $scope.userPicture = UserService.ProfileImage();

                    $scope.$apply();
                    if ($scope.policies.length !== 0) {
                        $scope.HasPolicies = true;
                        $scope.$apply();
                        $scope.renderHistogramData();
                        $scope.renderDoughnutChartData();
                    } else {
                        $scope.NoPolicies = true;
                        $scope.$apply();
                    }

                })
        }
    }]);
