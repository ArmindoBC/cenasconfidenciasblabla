/*
Controller to handle the operations on the bundle screen
*/
"use strict";
app.controller('BundleController', ["$scope","UserService", "$location","$filter", "ProductsRepository", "QuoteInfoRepository","PolicyRepository", function($scope,UserService, $location,$filter, ProductsRepository, QuoteInfoRepository,PolicyRepository) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "BundleController started"
    });

    /*
    Variable that will have the Products choosen by the client as the prices for the different bundles, regarding the products selected. Also, it has the number of products selected under each bundle
    */
    $scope.Products = {
        coveragesNumber: {
            basic: 0,
            recommended: 0,
            premium: 0
        },
        prices: {
            basic: 0,
            recommended: 0,
            premium: 0,
            personalized: 0
        },
        list: []
    };

    /*
    Get global variables to local variables.
    */
    $scope.selectedCoverages = QuoteInfoRepository.bundle.selectedCoverages;
    $scope.businessType = QuoteInfoRepository.bundle.userInfoData.businessType.text;


    /*
    Function to get the coverages taking into account the bundle passed as a parameter
    */
    $scope.SelectPackage = function(type) {

        var selectCoverages = function(type) {
            for (var index in $scope.Products.list) {
                var product = $scope.Products.list[index];

                for (var covIndex in product.coverageList) {
                    if (product.coverageList[covIndex].type === type) {
                        $scope.selectedCoverages[type].push(product.coverageList[covIndex]);
                    }
                }
            }
        }

        $scope.selectedCoverages.basic = [];
        $scope.selectedCoverages.recommended = [];
        $scope.selectedCoverages.premium = [];

        if (type === 'basic') {
            selectCoverages('basic');
        } else if (type === 'recommended') {
            selectCoverages('basic');
            selectCoverages('recommended');
        } else if (type === 'premium') {
            selectCoverages('basic');
            selectCoverages('recommended');
            selectCoverages('premium');
        }
        QuoteInfoRepository.bundle.packageSelected = $scope.packageSelected;
        $scope.GetSelectPackage();

    }

    /*
    Function to know if a specific coverage is selected
    */
    $scope.SelectedCoverage = function(coverage, type) {

        for (var index in $scope.selectedCoverages[type]) {
            if ($scope.selectedCoverages[type][index].id === coverage.id) {
                return true;
            }
        }
        return false;
    }

    /*
    Based on the coverages that are selected, this function "calculates" what is the related bundle
    */
    $scope.GetSelectPackage = function() {
        if($scope.Products.list.length === 0){
            $scope.packageSelected = undefined;
        }
        else if ($scope.selectedCoverages.basic.length === $scope.Products.coveragesNumber.basic && $scope.selectedCoverages.recommended.length === 0 && $scope.selectedCoverages.premium.length === 0) {

            //all basic coverages are selected
            $scope.packageSelected = "basic";
        } else if ($scope.selectedCoverages.basic.length === $scope.Products.coveragesNumber.basic && $scope.selectedCoverages.recommended.length === $scope.Products.coveragesNumber.recommended && $scope.selectedCoverages.premium.length === 0) {

            //all basic and recommended coverages are selected
            $scope.packageSelected = "recommended";
        } else if ($scope.selectedCoverages.basic.length === $scope.Products.coveragesNumber.basic && $scope.selectedCoverages.recommended.length === $scope.Products.coveragesNumber.recommended && $scope.selectedCoverages.premium.length === $scope.Products.coveragesNumber.premium) {

            //all basic, recommended and premium coverages are selected
            $scope.packageSelected = "premium";
        } else if ($scope.selectedCoverages.basic.length > 0 || $scope.selectedCoverages.recommended.length > 0 || $scope.selectedCoverages.premium.length > 0) {
            $scope.packageSelected = "personalized";
        } else {
            $scope.packageSelected = undefined;
        }

        QuoteInfoRepository.bundle.packageSelected = $scope.packageSelected;
        QuoteInfoRepository.bundle.price.month = $scope.Products.prices[$scope.packageSelected];
    }
    /*
    Function to know if there isn't any coverages selected of a specific type
    */
    $scope.DisabledPackage = function(productid, type) {
        if ($filter('filter')($scope.selectedCoverages[type], {productid: productid}).length === 0) {
            return true;
        } else {
            return false;
        }

    }
    /*
        When a coverage is checked or unchecked it will get the selected package according
        the selected coverages and if the package is "personalized" it calculates the bundle premium
    */
    $scope.ToggleCoverageSelection = function(coverage) {
        $scope.GetSelectPackage();

        //calculate package price only if package is personalized
        if ($scope.packageSelected === 'personalized') {
            $scope.CalculatePersonalizedPrice();
            QuoteInfoRepository.bundle.price.month = $scope.Products.prices[$scope.packageSelected];
        } else {
            $scope.Products.prices.personalized = 0;
        }

    }

    /*
        Calculates the price for personalized package
    */
    $scope.CalculatePersonalizedPrice = function() {
        $scope.Products.prices.personalized = 0;
        var numberOfInsured = {};

        //get the number of insured by product
        for (var index in $scope.Products.list) {
            var product = $scope.Products.list[index];

            var number = 0;

            //get the number of parts insured for each type of product
            if(product.title === "Motor"){
                number = QuoteInfoRepository.bundle.insured.vehicles.length;
            }
            else if(product.title === "Content"){
                number = QuoteInfoRepository.bundle.insured.properties.length;
            }
            else if(product.title === "Workers Compensation"){
                number = QuoteInfoRepository.bundle.insured.persons.length;
            }

            numberOfInsured[product.id] = number;
        }

        //iterate through selected coverages and sum each coverage
        for (var coverageType in $scope.selectedCoverages) {
            for (var index in $scope.selectedCoverages[coverageType]) {
                //calculate price attending number of parts insured by product
                $scope.Products.prices.personalized += $scope.selectedCoverages[coverageType][index].premium * numberOfInsured[$scope.selectedCoverages[coverageType][index].productid];
            }
        }
    }

    /*
        Access Products from backend attending the insured parts
        it only accesses the product for which has insured parts
    */
    $scope.GetProducts = function() {
        var products = [];

        var insuredParts = QuoteInfoRepository.bundle.insured;

        //select product ids regarding to insured parts
        if(insuredParts.properties.length > 0){
            products.push(ProductsRepository.productsID.content);
        }
        if(insuredParts.vehicles.length > 0){
            products.push(ProductsRepository.productsID.motor);
        }
        if(insuredParts.persons.length > 0){
            products.push(ProductsRepository.productsID.workers);
        }
        //access products information
        return ProductsRepository.GetProductsByIDs(products)
        .then(function(productList) {
            return productList;
        })
        .catch(function(err) {
            console.error(err);
        })

    }

    /*
        it saves a policy in their current state.
        As the policy will be associated to an user, user needs to be logged in to save a policy
    */
    $scope.SavePolicy = function(){

        //open login modal
        if(!UserService.IsLogged()){
            $('#AccountNeededModal').modal('show');
        }
        else{
            var policyData = {
                id : QuoteInfoRepository.bundle.id,
                userId : UserService.CurrentUser._id,
                businessName: QuoteInfoRepository.bundle.userInfoData.businessName,
                userName: QuoteInfoRepository.bundle.userInfoData.name,
                businessType : QuoteInfoRepository.bundle.userInfoData.businessType,
                zipCode1: QuoteInfoRepository.bundle.userInfoData.zipCode1,
                zipCode2: QuoteInfoRepository.bundle.userInfoData.zipCode2,
                income: QuoteInfoRepository.bundle.userInfoData.income,
                numberEmployees : QuoteInfoRepository.bundle.userInfoData.numberEmployees,
                packageSelected : QuoteInfoRepository.bundle.packageSelected,
                selectedCoverages : QuoteInfoRepository.bundle.selectedCoverages,
                paymentProperties : QuoteInfoRepository.bundle.paymentProperties,
                receiveMethods : QuoteInfoRepository.bundle.receiveMethods,
                insured : QuoteInfoRepository.bundle.insured,
                state : QuoteInfoRepository.bundle.state,
            }

            //send data to backend
            PolicyRepository.SavePolicy(policyData)
            .then(function(policy){
                QuoteInfoRepository.bundle.id = policy.id;
                QuoteInfoRepository.bundle.state = policy.state;

                $scope.AddFeedbackMessage({
                    title: "Policy Saved as Favourite",
                });
                $scope.$apply();
            })
            .catch(function(err){
                $scope.AddFeedbackMessage({
                    title: "Error Saving Policy",
                });
                $scope.$apply();
            })
        }
    };

    //redirect to quote last step
    $scope.FinalizeQuote = function() {
        $location.path('/quote/3');
    };

    //it enables proceed to payment button
    $scope.ProceedEnabled = function(){
        return QuoteInfoRepository.CoveragesFilled();
    };
    $scope.Init = function() {
        $("body").scrollTop(0);

        //retrieves product list
        $scope.GetProducts().then(function(productList) {

            $scope.Products.list = productList;
            //count how many coverages exist by type
            for (var index in $scope.Products.list) {
                var product = $scope.Products.list[index];

                var numberOfInsured = 0;
                if(product.title === "Motor"){
                    numberOfInsured = QuoteInfoRepository.bundle.insured.vehicles.length;
                }
                else if(product.title === "Content"){
                    numberOfInsured = QuoteInfoRepository.bundle.insured.properties.length;
                }
                else if(product.title === "Workers Compensation"){
                    numberOfInsured = QuoteInfoRepository.bundle.insured.persons.length;
                }

                for (var covIndex in product.coverageList) {
                    var coverage = product.coverageList[covIndex];

                    //count the number of basic,recommended and premium
                    //calculate the price of each package
                    if (coverage.type === 'basic') {
                        $scope.Products.coveragesNumber.basic++;
                        $scope.Products.prices.basic += coverage.premium * numberOfInsured;
                    } else if (coverage.type === 'recommended') {
                        $scope.Products.coveragesNumber.recommended++;
                        $scope.Products.prices.recommended += coverage.premium * numberOfInsured;
                    } else if (coverage.type === 'premium') {
                        $scope.Products.coveragesNumber.premium++;
                        $scope.Products.prices.premium += coverage.premium * numberOfInsured;
                    }
                }
            }


            $scope.packageSelected = QuoteInfoRepository.bundle.packageSelected;
            //select package according QuoteInfoRepository data
            if ($scope.packageSelected) {
                $scope.SelectPackage($scope.packageSelected);
            }
            else if($scope.Products.list.length > 0){
                $scope.SelectPackage("recommended");
            }
            //build recommended and premium prices
            $scope.Products.prices.recommended += $scope.Products.prices.basic;
            $scope.Products.prices.premium += $scope.Products.prices.recommended;

            $scope.GetSelectPackage();

            $scope.$apply();
        });
    };
    $scope.Init();
}]);
