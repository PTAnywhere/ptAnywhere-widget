angular.module('ptAnywhere')
    .controller('LinkController', ['$scope', 'baseUrl', 'PTAnywhereAPIService', 'NetworkMapData',
                                    function($scope, baseUrl, api, mapData) {
        var self = this;
        self.fromDevice = null;
        self.toDevice = null;
        self.fromInterfaces = null;
        self.toInterfaces = null;
        self.selectedFromIface = null;
        self.selectedToIface = null;

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
                            self.selectedFromIface = self.fromInterfaces[0];
                            self.selectedToIface = self.toInterfaces[0];
                            if(!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, function() {
                            console.error('Not loaded!');
                        });
            }
        };

        self.submit = function() {
            console.log('Connecting...', self.selectedFromIface, self.selectedToIface);
        };
    }]);