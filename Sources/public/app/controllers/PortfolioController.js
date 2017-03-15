"use strict";
app.controller('PortfolioController', ["$scope", "$filter", "$location","$timeout", "PolicyRepository", "ProductsRepository", "QuoteInfoRepository", 'UserService', "ChartService","policies",
function($scope, $filter, $location, $timeout, PolicyRepository, ProductsRepository, QuoteInfoRepository, UserService, ChartService, policies) {

	//Initialize LogClient()
	var logClient = new LogClient(); //jshint ignore:line
	//Notify PortfolioController.js was started
	logClient.SendLog({
		level: 'TRACE',
		category: "information",
		message: "PortfolioController started"
	});

	//Get all active policies (exclude quotes) for the user logged in
	$scope.getPolicyList = function() {
		return PolicyRepository.GetPolicyList(UserService.SessionToken,{userId: UserService.CurrentUser.id, state: 'policy'})
		.then( function(result) {
			return result;
		} );
	};

	//Get all the necessary data which will be presented regarding a specific company
	$scope.showCompanyData = function( policy ) {
		$scope.policyIdToShow = policy.id;
		$scope.policy = policy;

		$scope.computeRenovationDate(policy.activationDate);
		$scope.renderGraphicData(policy);

		return;
	}

	//Render graphic with overall information regarding each product
	$scope.renderGraphicData = function( policy ) {
		//Graphic data - assign the values which were previously computed when the policy was activated
		var motorCosts = 0, contentCosts = 0, workersCompensationCosts = 0;
		if($scope.annualMonth) {
			motorCosts = policy.price.month.Motor;
			contentCosts = policy.price.month.Content;
			workersCompensationCosts = policy.price.month.WorkersCompensation;
		} else {
			motorCosts = policy.price.annual.Motor;
			contentCosts = policy.price.annual.Content;
			workersCompensationCosts = policy.price.annual.WorkersCompensation;
		}

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

	//Compute the renovation date based on the policy's activation date
	$scope.computeRenovationDate = function( date ) {
		$scope.renovationDate = new Date(date).setFullYear(new Date(date).getFullYear() + 1);
	}

	//Show/Hide insured product details
	$scope.showProductDetails = function( product ) {
		if(product.showDetails) {
			product.showDetails = false;
		}
		else {
			product.showDetails = true;
		}
	};

	//Get all available products and their coverages
	$scope.getAllCoverages = function () {
		return ProductsRepository.GetProductsByUserData()
		.then( function(products) {
			$scope.ContentProducts = products.products[0];
			$scope.MotorProducts = products.products[1];
			$scope.WorkersCompensationProducts = products.products[2];
			$scope.$apply();
		} );
	}

	//Checks if a given coverage was selected by the policy which is currently presented
	$scope.InSelectedCoverages = function( policy, coverage ) {
		var selectedCoverages = policy.selectedCoverages;
		var exists = false;
		for(var i=0; i<selectedCoverages.length; i++) {
			if(coverage.id===selectedCoverages[i].id) {
				exists = true;
			}
		}
		return exists;
	}

	//Show annual or monthly premiums
	$scope.toggleAnnualMonth = function (state, policy){
		$scope.annualMonth = state;
		$scope.renderGraphicData(policy);
	}

	//Update the current policy
	$scope.UpdatePolicy = function( policy ){
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

		$location.url('/quote/1');
	}
	$scope.init = function(){
		return new Promise(function(resolve, reject){
			$scope.policies = policies;
			$scope.productsID = ProductsRepository.productsID;
			resolve();
		})
		.then(function(){
			$scope.$apply();
			//By default, show information about the first policy
			$scope.showCompanyData(policies[0]);
		})



	}
}]);
