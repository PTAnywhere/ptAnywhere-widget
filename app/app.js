angular.module('ptAnywhere', ['ngRoute'])
    .config(['$injector', '$provide', function($injector, $provide) {
        // Let's make sure that the following config sections have the constants available even
        // when they have not been defined by the user.
        var constants = {
            baseUrl: '',
            apiUrl: ''
        };

        for (var constantName in constants) {
            try {
                $injector.get(constantName);  // TODO Would $injector.has() work too?
                //constant exists
            } catch(e){
                console.log('Setting default value for non existing "baseUrl" constant: "' + constants[constantName] + '"');
                $provide.constant(constantName, constants[constantName]);  // Set default value
            }
        }
    }])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('HttpErrorsInterceptor');
    }])
    .config(['$routeProvider', 'baseUrl', function($routeProvider, baseUrl) {
        // configure the routing rules here
        $routeProvider.when('/', {
            template: '',
            controller: 'SessionCreatorController'
        }).when('/not-found', {
            templateUrl: baseUrl + '/html/not-found.html'
        }).when('/loading/:id', {
            templateUrl: baseUrl + '/html/loading.html'
        }).when('/s/:id', {
            controller: 'WidgetController',
            controllerAs: 'widget',
            template: '<div class="network networkMap" ng-model="widget.network"></div><div class="creation-menu"></div>'
        }).otherwise('/');
    }]);