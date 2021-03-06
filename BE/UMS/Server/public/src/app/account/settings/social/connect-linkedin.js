angular.module('account.settings.social.linkedin', ['security']);
angular.module('account.settings.social.linkedin').config(['$routeProvider', function($routeProvider){
  $routeProvider
    .when('/account/settings/linkedin/callback', {
      resolve: {
        connect: ['$log', '$q', '$location', '$route', 'security', function($log, $q, $location, $route, security){
          var code = $route.current.params.code || '';
          var search = {};
          var promise = security.socialConnect('linkedin', code)
            .then(function(data){
              if(data.success){
                search.success = 'true';
              }else{
                search.success = 'false';
                search.reason = data.errors[0];
              }
              return $q.reject();
            })
            .catch(function(){
              search.provider = 'linkedin';
              search.success = search.success || 'false';
              $location.search({}); //remove search param "code" added by linkedin
              $location.search(search);
              $location.path('/account/settings');
              return $q.reject();
            });
          return promise;
        }]
      },
      reloadOnSearch: false
    });
}]);
