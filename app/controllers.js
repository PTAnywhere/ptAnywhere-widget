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
    .controller('WidgetController', ['$q', '$log', '$location', '$routeParams', '$uibModal',
                                     'baseUrl', 'NetworkMapData', 'PTAnywhereAPIService',
                                     function($q, $log, $location, $routeParams, $uibModal, baseUrl, mapData, api) {
        var self = this;
        var modalInstance;

        if (!mapData.isLoaded()) {
            $location.path('/loading/' + $routeParams.id);
        } else {
            self.iconsPath =  baseUrl + '/images/';

            self.openConsole = function(consoleEndpoint) {
                var endpoint = 'console?endpoint=' + consoleEndpoint;
                self.openCmdModal(endpoint);  // Set in the controller
            };
            self.onAddDevice = function(x, y) {
                self.openAddDeviceModal(x, y);
            };
            self.onAddLink = function(fromDevice, toDevice) {
                self.openAddLinkModal(fromDevice, toDevice);
            };
            self.onEditDevice = function(device) {
                modalInstance = $uibModal.open({
                    animation: false,  // TODO true
                    templateUrl: baseUrl + '/html/default-dialog2.html',
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
                            api.removeLink(edge).then(function() {
                                resolve();
                            }, function() {
                                $log.error('Something went wrong in the link removal.');
                                reject();
                            });
                });
            };
        }
    }]);