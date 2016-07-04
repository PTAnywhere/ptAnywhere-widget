angular.module('ptAnywhere')
    .controller('LinkController', ['$scope', 'baseUrl', 'PTAnywhereAPIService', 'NetworkMapData',
                                    function($scope, baseUrl, api, mapData) {
        var self = this;
        self.fromDevice = null;
        self.toDevice = null;
        self.fromInterfaces = null;
        self.toInterfaces = null;

        self.load = function() {
            if (self.fromDevice!==null && self.toDevice!==null) {
                var arrayOfPromises = [
                    api.getAvailablePorts(self.fromDevice),
                    api.getAvailablePorts(self.toDevice)
                ];
                Promise.all(arrayOfPromises)
                        .then(function(arrayOfResponses) {
                            self.fromInterfaces = arrayOfResponses[0];
                            self.toInterfaces = arrayOfResponses[1];
                            if(!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, function() {
                            console.error('Not loaded!');
                        });
            }
        };

        self.submit = function() {
            var fromIf = self.selected.fromIface;
            var toIf = self.selected.toIface;
            console.log('Connecting...', fromIf, toIf);
            api.createLink(fromIf.url, toIf.url)
               .then(function(newLink) {
                    mapData.connect(self.fromDevice, self.toDevice, newLink.id, newLink.url,
                                    fromIf.portName, toIf.portName);
               }, function(error) {
                    self.submitError = 'Link could not be created (' + error.statusText + ').';
                    console.error('Link creation', error);
               });
        };
    }]);