angular.module('ptAnywhere.widget')
    .controller('WidgetController', ['$q', '$log', '$location', '$routeParams', '$uibModal',
                                     'NetworkMapData', 'HttpApiService',
                                     function($q, $log, $location, $routeParams, $uibModal, mapData, api) {
        var self = this;
        var modalInstance;

        if (!mapData.isLoaded()) {
            $location.path('/loading/' + $routeParams.id);
        } else {
            self.openConsole = function(consoleEndpoint) {
                var endpoint = consoleEndpoint;
                modalInstance = $uibModal.open({
                    templateUrl: 'cmd-dialog.html',
                    controller: 'CommandLineController',
                    resolve: {
                        endpoint: function () {
                            return endpoint;
                        }
                    },
                    windowClass: 'terminal-dialog'
                });
            };
            self.onAddDevice = function(x, y) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'CreationController',
                    resolve: {
                        position: function () {
                            return [x, y];
                        }
                    }
                });

                modalInstance.result.then(function(device) {
                    mapData.addNode(device);
                });
            };
            self.onAddLink = function(fromDevice, toDevice) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'LinkController',
                    //size: 'lg',
                    resolve: {
                        fromDevice: function () {
                            return fromDevice;
                        },
                        toDevice: function () {
                           return toDevice;
                        }
                    }
                });

                modalInstance.result.then(function(ret) {
                    mapData.connect(fromDevice, toDevice, ret.newLink.id, ret.newLink.url,
                                    ret.fromPortName, ret.toPortName);
                });
            };
            self.onEditDevice = function(device) {
                modalInstance = $uibModal.open({
                    templateUrl: 'default-dialog.html',
                    controller: 'UpdateController',
                    //size: 'lg',
                    resolve: {
                        device: function () {
                            return device;
                        }
                    }
                });

                modalInstance.result.then(function (changedDevice) {
                    if (changedDevice !== null) {  // If null, it means that the node didn't change
                        mapData.updateNode(changedDevice);
                    }
                });
            };
            self.onDeleteDevice = function(node) {
                return $q(function(resolve, reject) {
                            api.removeDevice(node)
                                .then(function() {
                                    resolve();
                                }, function(error) {
                                    $log.error('Device removal.', error);
                                    reject();
                                });
                        });
            };
            self.onDeleteLink = function(edge) {
                return $q(function(resolve, reject) {
                            api.removeLink(edge)
                                .then(function() {
                                    resolve();
                                }, function() {
                                    $log.error('Something went wrong in the link removal.');
                                    reject();
                                });
                        });
            };
            self.onDrop = function(newDevice) {
                return $q(function(resolve, reject) {
                            // Adapt coordinates from DOM to canvas
                            //  (function defined in the networkMap directive)
                            var positionInMap = self.getNetworkCoordinates(newDevice.x, newDevice.y);
                            newDevice.x = positionInMap.x;
                            newDevice.y = positionInMap.y;

                            api.addDevice(newDevice)
                                .then(function(device) {
                                    mapData.addNode(device);
                                    resolve();
                                }, function(error) {
                                    $log.error('Device creation', error);
                                    reject();
                                });
                      });
            };
        }
    }]);