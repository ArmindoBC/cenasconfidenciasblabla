app.service('QuoteInfoRepository', ["$sessionStorage","$rootScope", function($sessionStorage, $rootScope) {
    var logClient = new LogClient();
    var self = this;
    this.businessTypes = [
        {value: 1, text: 'Services'},
        {value: 2, text: 'Industry'},
        {value: 3, text: 'Energy'},
        {value: 4, text: 'Construction'},
        {value: 5, text: 'Commerce'},
        {value: 6, text: 'Transport and Logistics'},
        {value: 7, text: 'Tourism'},
    ];
    this.numberEmployees =  [
        {value: 1, text: '1'},
        {value: 2, text: '2'},
        {value: 3, text: '3'},
        {value: 4, text: '4'},
        {value: 5, text: '5'},
        {value: 6, text: '6'},
        {value: 7, text: '7'},
        {value: 8, text: '8+'},
    ]

    this.bundle = $sessionStorage.bundleTempData;

    //it watches by changes in bundle data and put them on session storage in order to user be able to
    //navigate between different pages without losing data
    $rootScope.$watch(function() {
        return self.bundle //value to be watched;
    }, function(newValue, oldValue) {
        if(newValue){
            $sessionStorage.bundleTempData = newValue;
        }
        else{
            self.bundle = $sessionStorage.bundleTempData;
        }
    }, true);

    //reset bundle data.
    // it is useful when user begins a quote, in order to clean data and use default values in some fields
    this.ResetData = function(){
        this.bundle = {
            userInfoData: {
                businessName: undefined,
                name: undefined,
                businessType: {value:1, text: 'Services'},
                zipCode1 : undefined,
                zipCode2 : undefined,
                income: undefined,
                numberEmployees: {value:1, text:'1'}
            },
            packageSelected : "recommended",
            selectedCoverages : {
                basic: [],
                recommended: [],
                premium: [],
            },
            price: {
                month: 0,
                annual: 0
            },
            paymentProperties : {
                period: "month",
                method: "card"
            },
            receiveMethods : {
                invoices: "email",
                policies: "post"
            },
            insured: {
                vehicles: [],
                persons: [],
                properties: []
            }
        };
    };

    //it checks if user data is filled, allowing users to navigate into second quote screen
    this.UserDataFilled = function(){
        if(!this.bundle.userInfoData.businessName || !this.bundle.userInfoData.name || !this.bundle.userInfoData.zipCode1 || !this.bundle.userInfoData.zipCode2 || !this.bundle.userInfoData.income )
        {
            return false;
        }
        else{
            return true;
        }
    }

    //it checks if user has filled insured parts, allowing to navigate into bundle screen
    this.InsuredFilled = function(){
        if(this.bundle.insured.vehicles.length === 0 && this.bundle.insured.persons.length === 0 && this.bundle.insured.properties.length === 0)
        {
            return false;
        }
        else{
            return true;
        }
    }
    //it checks if user has selected coverages, allowing to navigate into finalize screen
    this.CoveragesFilled = function(){
        if(this.bundle.selectedCoverages.basic.length === 0 && this.bundle.selectedCoverages.recommended.length === 0 && this.bundle.selectedCoverages.premium.length === 0)
        {
            return false;
        }
        else{
            return true;
        }
    }
    this.bundle = undefined;

}]);
