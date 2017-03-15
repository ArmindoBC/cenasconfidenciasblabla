"use strict";
app.controller('OverviewController', ["$scope", "$filter", "$location", "PolicyRepository", "UserService", "ChartService","QuoteInfoRepository", function($scope, $filter, $location, PolicyRepository, UserService, ChartService, QuoteInfoRepository) {

	//Initialize LogClient()
	var logClient = new LogClient();
	//Notify PortfolioController.js was started
	logClient.SendLog({
		level: 'TRACE',
		category: "information",
		message: "PortfolioController started"
	});

	//control variable that allows to show or hide companies list on new policy popup
	$scope.showPopupCompaniesList = false;

	//Get all active policies (exclude quotes) for the user logged in
	$scope.getPolicyList = function() {
		return PolicyRepository.GetPolicyList(UserService.SessionToken,{userId: UserService.CurrentUser.id, state: 'policy'})
		.then( function(result) {
			return result;
		} );
	};

	//Redirect the user to Portfolio Screen
	$scope.goToPortfolio = function() {
		$location.url('/portfolio');
	}

	
	//Render graphic data with information from all current user's policies
	$scope.renderDoughnutChartData = function() {
		//Doughnut Chart data - assign the values which were previously computed when the policy was activated
		var motorCosts = 0, contentCosts = 0, workersCompensationCosts = 0, i;
		if($scope.annualMonth) {
			for(i=0; i<$scope.policies.length; i++) {
				motorCosts += $scope.policies[i].price.month.Motor;
				contentCosts += $scope.policies[i].price.month.Content;
				workersCompensationCosts += $scope.policies[i].price.month.WorkersCompensation;
			}
		} else {
			for(i=0; i<$scope.policies.length; i++) {
				motorCosts += $scope.policies[i].price.annual.Motor;
				contentCosts += $scope.policies[i].price.annual.Content;
				workersCompensationCosts += $scope.policies[i].price.annual.WorkersCompensation;
			}
		}

		$scope.TotalCosts = motorCosts + contentCosts + workersCompensationCosts;

		$scope.chartData = [{
			value : motorCosts,
			color: '#56ffd4',
			label : "Motor"
		},
		{
			value : contentCosts,
			color: '#1cceff',
			label : "Content"
		},
		{
			value : workersCompensationCosts,
			color: '#0e86e8',
			label : "Workers Compensation"
		}];

		if(!$scope.DoughnutTextInsideChart){
			$scope.DoughnutTextInsideChart = new Chart($('#doughnut')[0].getContext('2d')).DoughnutTextInside($scope.chartData, {
				responsive: true,
				percentageInnerCutout: 70
			});
		}
		else{
			$scope.DoughnutTextInsideChart.segments.forEach(function (dataItem, i) {
				dataItem.value = $scope.chartData[i].value;
			});
			$scope.DoughnutTextInsideChart.update();
		}

		$scope.$applyAsync();
	}

	//Render graphic data with information from all current user's policies
	$scope.renderHistogramData = function() {
		var noVehicles = 0, noPersons = 0, noProperties = 0, i;

		for(i=0; i<$scope.policies.length; i++) {
			noVehicles += $scope.policies[i].insured.vehicles.length;
			noPersons += $scope.policies[i].insured.persons.length;
			noProperties += $scope.policies[i].insured.properties.length;
		}

		var myElement = document.getElementById("histogram").getContext("2d"),
		barChartData = {
			labels: ["Vehicles", "Persons", "Properties"],
			datasets:
			[{
				fillColor: "#f13879",
				data: [noVehicles, noPersons, noProperties]
			}]
		}, options = {
			showTooltips : false,
			scaleShowLabels  : false,
			scaleShowGridLines : false,
			scaleLineColor: 'transparent',
			scaleFontColor: "#262626",
			scaleFontSize: 15,
			barValueSpacing : 25,
			scaleFontFamily : 'monteserrat-bold',
			curvature: 0.15,
			barStrokeWidth: 0

		};

		// Draw Visitors Graph Line
		var myBar = new Chart(myElement).BarLayout(barChartData, options);

		$scope.$applyAsync();
	}

	//Show annual or monthly premiums
	$scope.toggleAnnualMonth = function (state){
		$scope.annualMonth = state;
		$scope.renderDoughnutChartData();
	}


	//it opens the new policy popup
	$scope.OpenNewPolicyPopup = function(){
		$('#newPolicyModal').modal('show');
	};

	//method that allows to show or hide companies list on new policy popup
	$scope.TooglePopupCompaniesList = function(){
		$scope.showPopupCompaniesList = !$scope.showPopupCompaniesList;
	}

	//on companies blur hide options menu
	$scope.CompaniesBlur = function(){
		//$scope.showPopupCompaniesList = false;
	}

	//redirects user to the bundle screens allowing to update a policy
	$scope.UpdatePolicy = function( policy ){
		$('#newPolicyModal').modal('hide');

		var basicCoverages = [], recommendedCoverages = [], premiumCoverages = [];

		//Initialize quote repository with the information of the current policy
		QuoteInfoRepository.bundle.id = policy.id;
		QuoteInfoRepository.bundle.userInfoData.businessName = policy.businessName;
		QuoteInfoRepository.bundle.userInfoData.name = policy.userName;
		QuoteInfoRepository.bundle.userInfoData.businessType = policy.businessType;
		QuoteInfoRepository.bundle.userInfoData.zipCode1 = policy.zipCode1;
		QuoteInfoRepository.bundle.userInfoData.zipCode2 = policy.zipCode2;
		QuoteInfoRepository.bundle.userInfoData.income = policy.income;
		QuoteInfoRepository.bundle.userInfoData.numberEmployees = policy.numberEmployees;
		//	QuoteInfoRepository.bundle.packageSelected = policy.packageSelected;

		for(var i=0; i<policy.selectedCoverages.length; i++) {
			if (policy.selectedCoverages[i].type === 'basic') {
				basicCoverages.push(policy.selectedCoverages[i]);
			} else if (policy.selectedCoverages[i].type === 'recommended') {
				recommendedCoverages.push(policy.selectedCoverages[i]);
			} else {
				premiumCoverages.push(policy.selectedCoverages[i]);
			}
		}

		//QuoteInfoRepository.bundle.selectedCoverages = {basic: basicCoverages, recommended: recommendedCoverages, premium: premiumCoverages};
		QuoteInfoRepository.bundle.price = policy.price;
		QuoteInfoRepository.bundle.paymentProperties = policy.paymentProperties;
		QuoteInfoRepository.bundle.receiveMethods = policy.receiveMethods;
		QuoteInfoRepository.bundle.insured = policy.insured;

		//The policy's state is passed in order to notify we are updating an existing policy instead of creating a new one
		QuoteInfoRepository.bundle.state = policy.state;

		$location.path('/quote/1');
	}

	$scope.NewPolicy = function(){
		$('#newPolicyModal').modal('hide');
		$location.url('/#user_info');
	}



	$scope.init = function(){

		//$scope.expensesGraph();
	     $scope.getPolicyList()
		.then(function(policies){
			$scope.policies = policies;
			$scope.userName = UserService.FirstName();
			$scope.fullName = UserService.FullName();
			$scope.userPicture = UserService.ProfileImage();

			$scope.$apply();
			if($scope.policies.length!==0){
				$scope.HasPolicies = true;
				$scope.$apply();
				$scope.renderHistogramData();
				$scope.renderDoughnutChartData();
			} else{
				$scope.NoPolicies = true;
				$scope.$apply();
			}

		})
	}


}]);
	