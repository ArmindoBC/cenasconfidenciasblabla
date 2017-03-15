"use strict";
app.controller('FinalizeBundleController', ["$scope","UserService","QuoteInfoRepository","ProductsRepository","PolicyRepository", "Configs", function($scope,UserService, QuoteInfoRepository, ProductsRepository, PolicyRepository, Configs) {
    var logClient = new LogClient(); //jshint ignore:line
    logClient.SendLog({
        level: 'TRACE',
        category: "information",
        message: "FinalizeBundleController started"
    });
    //Configuration and services loading
    $scope.configs = Configs;
    $scope.bundle = QuoteInfoRepository.bundle;
    $scope.insured = QuoteInfoRepository.bundle.insured;

    //Selected coverages for the finalize bundle
    $scope.selectedCoverages = [].concat($scope.bundle.selectedCoverages.basic, $scope.bundle.selectedCoverages.recommended, $scope.bundle.selectedCoverages.premium);

    //Loads the products from the Middleware
    $scope.productsID = ProductsRepository.productsID;

    //change payment period property
    $scope.TooglePaymentPeriod = function(periodType){
        $scope.bundle.paymentProperties.period = periodType;
    };

    //change payment method property
    $scope.TooglePaymentMethod = function(paymentMethod){
        $scope.bundle.paymentProperties.method = paymentMethod;
    };

    //change receive invoice method property
    $scope.ToogleReceiveInvoices = function(method){
        $scope.bundle.receiveMethods.invoices = method;
    };

    //change receive policy method property
    $scope.ToogleReceivePolicies = function(method){
        $scope.bundle.receiveMethods.policies = method;
    };

    //Pays the bundle and saves it, checks first if is already saved
    $scope.PayBundle = function(){
        if(!UserService.IsLogged()){
            console.log($('#AccountNeededModal'))
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
                state : "policy"
            }
            PolicyRepository.SavePolicy(policyData)
            .then(function(policy){
                QuoteInfoRepository.bundle.id = policy.id;
                QuoteInfoRepository.bundle.state = policy.state;
                $scope.AddFeedbackMessage({
                    title: "Policy Subscribed",
                    returnLink: "/"
                });
                $scope.$apply();
            })
            .catch(function(err){
                $scope.AddFeedbackMessage({
                    title: "Error Subscribing Policy",
                });
                $scope.$apply();
            });
        }
    }

    //send the page navigation to the top
    $scope.Init = function() {
        $("body").scrollTop(0);

        $scope.price = {
            month : 0,
            annual : 0
        };

        var numberOfInsured = {},
            products = [];

        //select product ids regarding to insured parts
        if(QuoteInfoRepository.bundle.insured.properties.length > 0){
            products.push(ProductsRepository.productsID.content);
        }
        if(QuoteInfoRepository.bundle.insured.vehicles.length > 0){
            products.push(ProductsRepository.productsID.motor);
        }
        if(QuoteInfoRepository.bundle.insured.persons.length > 0){
            products.push(ProductsRepository.productsID.workers);
        }

        return ProductsRepository.GetProductsByIDs(products)
        .then(function(productList) {

            for (var index in productList) {
                var product = productList[index];
                var number = 0;

                //collect the number of insured parts by
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
            for (var index in $scope.selectedCoverages) {
                //calculate price attending number of parts insured by product
                $scope.price.month += $scope.selectedCoverages[index].premium * numberOfInsured[$scope.selectedCoverages[index].productid];
            }
            $scope.price.annual = $scope.price.month * 12;

            $scope.$apply();
            return;
        })
    };

    $scope.Init();
}]);
