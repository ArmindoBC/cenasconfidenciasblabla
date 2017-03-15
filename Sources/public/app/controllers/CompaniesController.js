"use strict";
/*
Angular controller for profile screen,
It has all the necessary methods to ensure system management
*/
app.controller('CompaniesController', ["$scope","UserService","QuoteInfoRepository","PolicyRepository","policies", function($scope, UserService, QuoteInfoRepository, PolicyRepository, policies) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "ProfileController started"
    });

    //it stores user profile input errors
    $scope.inputErrors = {
        fullName : undefined,
        email : undefined,
        address : undefined,
        birthDate : undefined,
        phone : undefined,
        nif: undefined
    }

    //with this property set to true it is possible to update company data
    $scope.editModeEnabled = false;

    //it changes the selected policy in order to show company details
    $scope.ChangeSelectedPolicy = function(policy){
        $scope.policySelected = angular.copy(policy);

        $scope.policySelected.zipCode = policy.zipCode1 + '-' + policy.zipCode2;
        $scope.editModeEnabled = false;
    }

    //it enables the edit mode for company data
    $scope.EnableEditMode = function(){
        $scope.editModeEnabled = true;
    }

    //it cancel all data changes restoring with the data originaly stored in policy
    $scope.Cancel = function(){
        $scope.editModeEnabled = false;
        //Clear input errors
        $scope.inputErrors = {};
        $scope.Init();
    };

    //it updates the policy entity
    $scope.UpdatePolicy = function(policySelected){
        if($scope.ValidateCompanyData()){

            var zipCodeParts = policySelected.zipCode.split('-');

            var zipCode1 = zipCodeParts[0];
            var zipCode2 = zipCodeParts[1];

            var policyData = {
                id: policySelected.id,
                userId : policySelected.userId,
                businessName : policySelected.businessName,
                businessType : policySelected.businessType,
                numberEmployees : policySelected.numberEmployees,
                income : policySelected.income,
                zipCode1 : zipCode1,
                zipCode2 : zipCode2,
                state : policySelected.state,
            };
            return PolicyRepository.SavePolicy(policyData)
            .then(function(policy){
                $scope.policies[policy.id] = policy;
                $scope.AddFeedbackMessage({
                    title: "Company Updated Successfuly",
                });
                $scope.editModeEnabled = false;
                $scope.$apply();
                return;
            })
            .catch(function(err){
                $scope.AddFeedbackMessage({
                    title: "Error Updating Company",
                });
                $scope.editModeEnabled = false;
                $scope.$apply();
                $scope.Init();
                return;
            })
        }

    }

    //it validates the user data inserted by user
    $scope.ValidateCompanyData = function(field){
        if(field){
            $scope.inputErrors[field] = undefined;
        }
        var validData = true;

        //validates company name
        if(field === "businessName" || !field){
            if(!$scope.policySelected.businessName || $scope.policySelected.businessName.length === 0 ){
                $scope.inputErrors.businessName = "Your business name is required to get a quote."
                validData = false;
            }
        }

        //validates income field. it is required and must only contain digits
        if(field === "income" || !field){
            console.log('comecou');
            if(!$scope.policySelected.income || $scope.policySelected.income.length === 0 ){
                console.log('required');
                $scope.inputErrors.income = "Your income is required to get a quote."
                validData = false;
            }
            else if(!$scope.policySelected.income.match(/^\d+$/)) {
                console.log('so numeros');
                $scope.inputErrors.income = "Your income must only contain digits."
                validData = false;
            }
        }
        if(field === "zipCode" || !field){
            if(!$scope.policySelected.zipCode || $scope.policySelected.income.zipCode === 0 ){
                $scope.inputErrors.zipCode = "Company zip code is required";
                validData = false;
            }
            else if(!$scope.policySelected.zipCode.match(/^[0-9]{4}-[0-9]{3}$/)){
                $scope.inputErrors.zipCode = "Your zip code must follow XXXX-XXX patern"
                validData = false;
            }
        }
        return validData;
    };


    //show and hide business type options menu
    $scope.toogleBusinessTypeOptions = function(){
        $scope.showBusinessType = !$scope.showBusinessType;
    }
    //on businesstype blur hide options menu
	$scope.businessTypeBlur = function(){
		$scope.showBusinessType = false;
	}
    //it changes the business Type option and hides the select menu
    $scope.changeBusinessType = function(value){
        $scope.policySelected.businessType = value;
        $scope.showBusinessType = false;
    }

    //show and hide business type options menu
    $scope.toogleNumberEmployeesOptions = function(){
        $scope.showNumberEmployees = !$scope.showNumberEmployees;
    }
    //on businesstype blur hide options menu
	$scope.numberEmployeesBlur = function(){
		$scope.showNumberEmployees = false;
	}
    //it changes the business Type option and hides the select menu
    $scope.changeNumberEmployees = function(value){
        $scope.policySelected.numberEmployees = value;
        $scope.showNumberEmployees = false;
    }

    //initializes companies controller data
    $scope.Init = function() {
        $scope.policies = {};
        for(var i in policies){
            $scope.policies[policies[i].id] = policies[i];
        }
        $scope.ChangeSelectedPolicy(policies[0]);

        $scope.businessTypes = QuoteInfoRepository.businessTypes;
        $scope.numberEmployees = QuoteInfoRepository.numberEmployees;

    }
}]);
