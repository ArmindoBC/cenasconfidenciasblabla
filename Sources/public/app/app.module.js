"use strict";
var app = angular.module('smallApp', ['ngRoute','xeditable','checklist-model','ngStorage','chart.js','angularSpinner']);

app.config(function($routeProvider, $locationProvider) {

    //Enable HTML5 Location Mode
    $locationProvider.html5Mode(true);

    $routeProvider
    // route for the welcome screen
    .when('/', {
        templateUrl: 'app/views/home/welcome-p2p.html',
        controller: 'HomeController',
        context : ['quote'],
        reloadOnSearch: false,
        resolve : {
            cleanData : function(QuoteInfoRepository, $location){
                //if doesn't have back property, data must be reset
                //this property is only added on back button
                if($location.hash() != 'user_info' && !$location.search().back || $location.search().back != 'true'){
                    QuoteInfoRepository.ResetData();
                }
                $location.search({});
            }
        }
    })
    .when('/choose-plan', {
            templateUrl: 'app/views/quote/choose-plan.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

    })
    .when('/register',{
        templateUrl:'app/views/quote/register.html',
        controller: 'OverviewController',
        access: {
                 requiresLogin: false,
                 allowedGroups: [],
        }
    })
    .when('/quote', {
        redirectTo: '/quote/1'
    })
    .when('/quote/1', {
        templateUrl: 'app/views/quote/insurancechoice.html',
        controller: 'InsuranceChoiceController',
        context : ['quote'],
        resolve: {
            checkData: function($location, QuoteInfoRepository) {
                //it checks if quote data has the user data filled
                //if not the user will be redirected to the previous step of the quote builder
                if(!QuoteInfoRepository.UserDataFilled()){
                    $location.url('/#user_info');
                }
                return;
            }
        }
    })
    .when('/quote/2', {
        templateUrl: 'app/views/quote/bundle.html',
        controller: 'BundleController',
        context : ['quote'],
        resolve: {
            checkData: function($location, QuoteInfoRepository) {
                //it checks if quote data has the necessary data for this step
                //if not the user will be redirected to the previous step of the quote builder
                if(!QuoteInfoRepository.UserDataFilled()){
                    $location.url('/#user_info');
                }
                else if(!QuoteInfoRepository.InsuredFilled()){
                    $location.path('/quote/1');
                }
                return;
            }
        }
    })
    .when('/quote/3', {
        templateUrl: 'app/views/quote/finalize.html',
        controller: 'FinalizeBundleController',
        context : ['quote'],
        resolve: {
            checkData: function($location, QuoteInfoRepository) {
                //it checks if quote data has the necessary data for this step
                //if not the user will be redirected to the previous step of the quote builder
                if(!QuoteInfoRepository.UserDataFilled()){
                    $location.url('/#user_info');
                }
                else if(!QuoteInfoRepository.InsuredFilled()){
                    $location.path('/quote/1');
                }
                else if(!QuoteInfoRepository.CoveragesFilled()){
                    $location.path('/quote/2');
                }
                return;
            }
        }

    })
    .when('/notifications', {
        templateUrl: 'app/views/dashboard/notifications.html',
        controller: 'NotificationsController',
        access: {
            requiresLogin: true,
            allowedGroups: [],
        }

    })
    .when('/portfolio', {
        templateUrl: 'app/views/dashboard/portfolio.html',
        controller: 'PortfolioController',
        access: {
            requiresLogin: true,
            allowedGroups: [],
        },
        resolve: {
            policies: function($location, PolicyRepository, UserService) {
                return PolicyRepository.GetPolicyList(UserService.SessionToken,{userId: UserService.CurrentUser.id, state: 'policy'})
                .then(function(policies){
                    if(policies.length === 0){
                        history.back();
                    }
                    else{
                        return policies;
                    }
                });
            }
        }
    })
    .when('/companies', {
        templateUrl: 'app/views/dashboard/companies.html',
        controller: 'CompaniesController',
        access: {
            requiresLogin: true,
            allowedGroups: [],
        },
        resolve: {
            policies: function($location, PolicyRepository, UserService) {
                return PolicyRepository.GetPolicyList(UserService.SessionToken,{userId: UserService.CurrentUser.id, state: 'policy'})
                .then(function(policies){
                    if(policies.length === 0){
                        history.back();
                    }
                    else{
                        return policies;
                    }
                });
            }
        }
    })
    .when('/profile', {
            templateUrl: 'app/views/dashboard/profile.html',
            controller: 'ProfileController',
            access: {
                requiresLogin: true,
                allowedGroups: [],
            }
        })  
    .when('/claim-management', {
            templateUrl: 'app/views/dashboard/claim-management.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }
        })
    .when('/overview', {
            templateUrl: 'app/views/dashboard/dashboard.html',
            controller: 'DashboardController',
            access: {
                requiresLogin: true,
                allowedGroups: [],
            }

        })
     .when('/communityFeed', {
            templateUrl: 'app/views/dashboard/community-feed.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/user-profile', {
            templateUrl: 'app/views/dashboard/user-profile.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: true,
                allowedGroups: [],
            }

        })
     .when('/user-historic', {
            templateUrl: 'app/views/dashboard/historic.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })   
    .when('/health-advisor', {
            templateUrl: 'app/views/dashboard/health-advisor.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
     .when('/insurance-plan', {
            templateUrl: 'app/views/quote/insurance-plan.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/schedule-visit', {
            templateUrl: 'app/views/schedule-visit/schedule-visit.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/available-specialists', {
            templateUrl: 'app/views/schedule-visit/available-specialists.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/visit-details', {
            templateUrl: 'app/views/schedule-visit/visit-details.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
        .when('/visit-confirmation', {
            templateUrl: 'app/views/schedule-visit/visit-confirm.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/create-community', {
            templateUrl: 'app/views/dashboard/create-community.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/review-visit', {
            templateUrl: 'app/views/schedule-visit/review-visit.html',
            controller: 'OverviewController',
            access: {
                requiresLogin: false,
                allowedGroups: [],
            }

        })
    .when('/signup', {
        templateUrl: 'app/views/signup/signup.html',
        controller: 'LoginController',
        context : ['auth']

    })
    .when('/login', {
        templateUrl: 'app/views/login/login-p2p.html',
        controller: 'LoginController',
        context : ['auth']
    })
    .when('/admin', {
        templateUrl: 'app/views/dashboard/admin.html',
        controller: 'AdminController',
        access: {
            requiresLogin: true,
            allowedGroups: ['admin'],
        }
    })
    //For any other request non defined
    .otherwise({
        redirectTo: '/'
    });

});

app.run(function($rootScope,$sessionStorage,$location, QuoteInfoRepository) {

    //reset data each time application is reloaded
    $rootScope.$on('$viewContentLoaded', function (event, next) {
        if($('#fullPageScroll').length === 0){
            if (typeof $.fn.fullpage.destroy == 'function') {
                $.fn.fullpage.destroy('all');
            }
        }
    });

    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        //clear quote data if user comes from a quote page to a page that not belongs to the same context
        if(current && current.$$route && current.$$route.context && current.$$route.context.indexOf('quote') != -1 &&
            (!next.context || (next.context.indexOf('quote') === -1 && next.context.indexOf('auth') === -1))){
            QuoteInfoRepository.ResetData();
        }
        //checks if next screen has access restrictions
        if (next.access !== undefined) {
            if (next.access.requiresLogin) {
                //if screen requires login and does not exist a session token
                //the user will be redirected to login page
                if (!$sessionStorage.sessionToken) {
                    $location.path('/login').replace();
                    return;
                }
                //if an authorization token is found it will be ckecked if the current User
                //has proper permissions to access the next page
                var authClient = new AuthClient();
                return authClient.Authorize($sessionStorage.sessionToken, next.access.allowedGroups)
                .then(function(res) {
                    if (!res.success) {
                        $location.path('/login');
                        $rootScope.$apply();
                    }

                })
                .catch(function(err) {
                    console.error(err);
                    $location.path('/login');
                    $rootScope.$apply();
                });
            }
        }

    });
});
