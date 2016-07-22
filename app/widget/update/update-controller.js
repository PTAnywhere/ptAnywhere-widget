angular.module('ptAnywhere.widget.update')
    .controller('UpdateController', ['$log', '$scope', '$q', '$uibModalInstance', 'locale', 'HttpApiService', 'device',
                                     // Device is injected in $uiModal's resolve.
                                    function($log, $scope, $q, $uibModalInstance, locale, api, deviceToEdit) {
        var self = this;
        $scope.submitError = null;
        $scope.interfaces = null;
        $scope.interface = {
            selected: null,
            ipAddr: null,
            subnet: null
        };

        $scope.locale = locale;
        $scope.modal = {
            id: 'modification-dialog',
            title: locale.modificationDialog.title,
            bodyTemplate: 'update-dialog-body.html',
            hasSubmit: true
        };
        $scope.device = {
            name: deviceToEdit.label,
            defaultGateway: ('defaultGateway' in deviceToEdit)? deviceToEdit.defaultGateway: null
        };

        $scope.$watch('interfaces', function(newValue, oldValue) {
            if (newValue !== null) {
                $scope.interface.selected = newValue[0];
            }
        });

        $scope.$watch('interface.selected', function(newValue, oldValue) {
            if (newValue && ('portIpAddress' in newValue) && ('portSubnetMask' in newValue)) {
                $scope.interface.ipAddr = newValue.portIpAddress;
                $scope.interface.subnet = newValue.portSubnetMask;
            } else {
                // Not all the might have ip address and subnet.
                $scope.interface.ipAddr = null;
                $scope.interface.subnet = null;
            }
        });

        self._load = function() {
            api.getAllPorts(deviceToEdit)
                .then(function(ports) {
                    $scope.interfaces = ports;
                    if(!$scope.$$phase) {
                        $scope.$apply();
                    }
                }, function(response) {
                    $log.error('Ports for the device ' + deviceToEdit.id + ' could not be loaded.', response);
                    $uibModalInstance.dismiss('cancel');
                });
        };

        self._haveGlobalSettingsChanged = function() {
            // TODO use $pristine instead
            return ($scope.device.name != deviceToEdit.label) ||
                   (('defaultGateway' in deviceToEdit) &&
                    ($scope.device.defaultGateway != deviceToEdit.defaultGateway));
        };

        self._hasInterfaceChanged = function() {
            // TODO use $pristine instead
            return ($scope.interface.ipAddr !== null && $scope.interface.subnet !== null) &&
                   ($scope.interface.ipAddr != $scope.interface.selected.portIpAddress ||
                    $scope.interface.subnet != $scope.interface.selected.portSubnetMask);
        };

        $scope.submit = function() {
            var update;
            if (self._haveGlobalSettingsChanged()) {
                update = api.modifyDevice(deviceToEdit, $scope.device.name, $scope.device.defaultGateway)
                            .then(function(modifiedDevice) {
                                return modifiedDevice;
                            }, function(error) {
                                $scope.submitError = 'Global settings could not be modified.';
                                return error;
                            });
            } else {
                update = $q.resolve(null);  // No modification return.
            }
            // Sequential order as API cannot cope with simultaneous changes when device name is modified.
            if (self._hasInterfaceChanged()) {
                update = update.then(function(modifiedDevice) {
                                        return api.modifyPort($scope.interface.selected.url,
                                                              $scope.interface.ipAddr, $scope.interface.subnet)
                                                  .then(function(port) {
                                                      return modifiedDevice;
                                                  }, function(error) {
                                                      $scope.submitError = 'Interface details could not be modified.';
                                                      return error;
                                                  });
                                    });
            }
            update.then(function(modifiedDevice) {
                $uibModalInstance.close(modifiedDevice);
            }, function(error) {
                $log.error('Update(s) could not be performed.', error);
            });
        };

        $scope.close = function () {
            $uibModalInstance.dismiss('cancel');
        };

        self._load();
    }]);