angular.module('ptAnywhere.locale', [])
    .config(['$injector', '$provide', function($injector, $provide) {
        $log = console;  // FIXME Apparently $log injection does not work in my tests.

        // default selection (this constant is already provided in the distributed JS).
        var selectedLocale = 'locale_en';
        try {
            selectedLocale = $injector.get('use');
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
    }]);