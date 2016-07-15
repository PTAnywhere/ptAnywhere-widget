angular.module('ptAnywhere.widget', ['ngRoute', 'ui.bootstrap', 'ptAnywhere', 'ptAnywhere.locale', 'ptAnywhere.api.http'])
    .config(['$injector', '$provide', function($injector, $provide) {
        // Let's make sure that the following config sections have the constants available even
        // when they have not been defined by the user.
        var defaults = {
            baseUrl: '',
            imagesUrl: ''
        };
        for (var constantName in defaults) {
            try {
                $injector.get(constantName);
                //constant exists
            } catch(e) {
                var valueIfUndefined = defaults[constantName];
                $log.log('Setting default value for non existing "' + constantName + '" constant: "' + valueIfUndefined + '"');
                $provide.constant(constantName, valueIfUndefined);  // Set default value
            }
        }
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