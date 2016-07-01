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
        self.message = '';

        api.startSession($routeParams.id);
        api.getNetwork(function(errorExplanation) {
                self.message = errorExplanation;
            })
            .then(function(network) {
                mapData.load(network);
                $location.path('/s/' + $routeParams.id);
            }, function(response) {
                $location.path('/not-found');
            });
    }])
    .controller('WidgetController', ['$location', '$routeParams', 'baseUrl', 'NetworkMapData',
                                      function($location, $routeParams, baseUrl, mapData) {
        var self = this;

        if (!mapData.isLoaded()) {
            $location.path('/loading/' + $routeParams.id);
        } else {
            self.iconsPath =  baseUrl + '/images/';
        }

        self.openConsole = function(consoleEndpoint) {
            var endpoint = 'console?endpoint=' + consoleEndpoint;
            self.openCmdModal(endpoint);  // Set in the controller
        };
        self.onAddDevice = function(x, y) {};
        self.onAddLink = function(fromDevice, toDevice) {
            // Set in the controller
            self.openAddLinkModal(fromDevice, toDevice, function(newLink, toLabel, fromLabel) {  // If success...
                mapData.connect(fromDevice, toDevice, newLink.id, newLink.url, toLabel, fromLabel);
            });
        };
        self.onEditDevice = function(node) {};
        self.onDeleteDevice = function(node) {};
        self.onDeleteLink = function(edge) {};
    }]);