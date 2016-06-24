angular.module('ptAnywhere')
    .controller('SessionCreatorController', ['$location', 'PTAnywhereAPIService', 'fileToOpen',
                                              function($location, api, fileToOpen) {
        api.createSession(fileToOpen, null)
            .then(function(sessionId) {
                $location.path('/loading/' + sessionId);
            });
    }])
    .controller('SessionLoadingController', ['$location', '$routeParams', 'PTAnywhereAPIService', 'NetworkMapData',
                                             'baseUrl', 'locale_en',
                                              function($location, $routeParams, api, mapData, baseUrl, loc) {
        var self = this;
        self.baseUrl = baseUrl;  // FIXME An URL with the {{ baseUrl }} is going to be loaded before this is set!
        self.loading = loc.network.loading;
        self.message = 'blablabla';

        api.startSession($routeParams.id);
        api.getNetwork()
            .then(function(response) {
                        mapData.load(response.data);
                        $location.path('/s/' + $routeParams.id);
                    });
    }])
    .controller('WidgetController', ['$location', '$routeParams', 'PTAnywhereAPIService', 'NetworkMapData',
                                      function($location, $routeParams, api, mapData) {
        var self = this;

        if (!mapData.isLoaded()) {
            $location.path('/loading/' + $routeParams.id);
        } else {
            self.network = mapData.getNodes();
        }
    }]);