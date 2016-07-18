angular.module('ptAnywhere.widget', ['ngRoute', 'ui.bootstrap',
                                     'ptAnywhere.locale', 'ptAnywhere.widget.configuration', 'ptAnywhere.api.http',
                                     'ptAnywhere.widget.console', 'ptAnywhere.widget.create', 'ptAnywhere.widget.link',
                                     'ptAnywhere.widget.map', 'ptAnywhere.widget.update'])
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
    }])
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('HttpErrorInterceptor');
    }])
    .run(['HttpErrorInterceptor', function(interceptor) {
        interceptor.setRedirectionPath('/not-found');
    }]);