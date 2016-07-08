angular.module('ptAnywhere', ['ngRoute', 'ui.bootstrap'])
    .config(['$injector', '$provide', function($injector, $provide) {
        $log = console;  // FIXME Apparently $log injection does not work in my tests.

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
            } catch(e) {
                $log.log('Setting default value for non existing "baseUrl" constant: "' + constants[constantName] + '"');
                $provide.constant(constantName, constants[constantName]);  // Set default value
            }
        }

        // default selection (this constant is already provided in the distributed JS).
        var selectedLocale = 'locale_en';
        try {
            selectedLocale = $injector.get('useLocale');
        } catch(e) {
            $log.debug('Locales to use were not defined: using default ones.');
        }

        var locales;
        try {
            locales = $injector.get(selectedLocale);
            $provide.constant('locale', locales);
            $log.debug('Locales loaded from: ' + selectedLocale);
        } catch(e) {
            $log.error('Locales to use could not be loaded from constant:' + selectedLocale + '.');
        }
    }])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('HttpErrorsInterceptor');
    }])
    .config(['$routeProvider', 'locale',  function($routeProvider, locale) {
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