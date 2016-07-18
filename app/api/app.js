//angular.module('ptAnywhere.api', ['ptAnywhere.api.http', 'ptAnywhere.api.websocket']);

angular.module('ptAnywhere.api.http', ['ptAnywhere'])
    .config(['$injector', '$provide', function($injector, $provide) {
        var $log = console; // FIXME Apparently $log injection does not work in my tests.
        var constantName = 'url';
        var valueIfUndefined = '';
        try {
            $injector.get(constantName);
            //constant exists
        } catch(e) {
            $log.log('Setting default value for non existing "' + constantName + '" constant: "' + valueIfUndefined + '"');
            $provide.constant(constantName, valueIfUndefined);  // Set default value
        }
    }]);