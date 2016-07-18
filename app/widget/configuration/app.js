angular.module('ptAnywhere.widget.configuration', [])
    .config(['$injector', '$provide', function($injector, $provide) {
        // Let's make sure that the following config sections have the constants available even
        // when they have not been defined by the user.
        var defaults = {
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
    }]);