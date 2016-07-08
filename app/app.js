angular.module('ptAnywhere', ['ngRoute', 'ui.bootstrap'])
    .config(['$injector', '$provide', function($injector, $provide) {
        // Let's make sure that the following config sections have the constants available even
        // when they have not been defined by the user.
        var constants = {
            baseUrl: '',
            imagesUrl: '',
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
    .config(['$routeProvider', 'locale_en',  function($routeProvider, locale) {
        function createSimpleTemplate(message) {
            return '<div class="row message"><div class="col-md-8 col-md-offset-2 text-center">' +
                   '<h1>' + message.title + '</h1>' + (('content' in message)? message.content: '') + '</div></div>';
        }
        $routeProvider.when('/', {
            template: createSimpleTemplate(locale.session.creating),
            controller: 'SessionCreatorController'
        }).when('/session-unavailable', {
            template: createSimpleTemplate(locale.session.unavailable)
        }).when('/session-error', {
            template: createSimpleTemplate(locale.session.genericError)
        }).when('/not-found', {
            template: createSimpleTemplate(locale.session.notFound)
        }).when('/loading/:id', {
            templateUrl: 'loading.html'
        }).when('/s/:id', {
            templateUrl: 'main-widget.html'
        }).otherwise('/');
    }]);